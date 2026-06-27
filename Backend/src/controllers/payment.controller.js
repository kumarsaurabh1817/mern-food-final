import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Shop from "../models/Shop.js";
import { emitOrderUpdate } from "../socket/index.js";

// Fail fast at startup if keys are missing in production
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
) {
  throw new Error(
    "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in production",
  );
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_secret",
});

// @desc    Create a Razorpay order for an existing app order
// @route   POST /api/payments/create-intent
// @access  User
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (order.customer.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    if (!["pending"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order is already paid or cancelled",
      });
    }

    const options = {
      amount: Math.round(order.totalAmount * 100), // paise
      currency: "INR",
      receipt: `rcpt_${order._id}`,
      notes: { orderId: order._id.toString() },
    };

    const rzpOrder = await razorpay.orders.create(options);
    order.paymentGatewayId = rzpOrder.id;
    await order.save();

    return res.status(200).json({
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      provider: "razorpay",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Client-side verification after Razorpay checkout completes
// @route   POST /api/payments/verify
// @access  User
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Razorpay payment fields" });
    }

    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // Verify the order belongs to the authenticated user
    if (order.customer.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    // Verify the Razorpay order ID matches what we stored — prevents a malicious
    // user from passing a succeeded payment from a different order
    if (order.paymentGatewayId !== razorpay_order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Payment order ID mismatch" });
    }

    // HMAC-SHA256 signature verification
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mock_secret")
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    order.status = "confirmed";
    order.paymentStatus = "paid";
    await order.save();

    // Real-time: customer tracker + order list and the owner dashboard all
    // reflect the now-paid, confirmed order.
    const shopForOwner = await Shop.findById(order.shop).select("owner");
    emitOrderUpdate(order, { ownerId: shopForOwner?.owner });

    return res
      .status(200)
      .json({ success: true, message: "Payment verified successfully", order });
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay async webhook (server-to-server — authoritative payment confirmation)
// @route   POST /api/webhooks/razorpay
// @access  Public (HMAC-signed by Razorpay)
// S6 FIX: The webhook route MUST be mounted with express.raw({ type: 'application/json' })
// so that req.rawBody contains the exact bytes Razorpay signed.
// Using JSON.stringify(req.body) re-serializes the parsed object, which may differ
// from the original payload (key order, whitespace, Unicode escapes) — breaking sig verification.
export const handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (!secret || !signature) {
    return res.status(400).send("Webhook secret or signature missing");
  }

  // Use the raw body buffer set by the express.raw() middleware on this route.
  // Fall back to JSON.stringify only as a last resort (still better than nothing).
  const rawBody = req.rawBody || JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).send("Invalid signature");
  }

  const event = req.body.event;

  try {
    if (event === "order.paid" || event === "payment.captured") {
      const orderId = req.body.payload?.payment?.entity?.notes?.orderId;

      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && order.status === "pending") {
          order.status = "confirmed";
          order.paymentStatus = "paid";
          await order.save();

          // Real-time push to customer + owner
          const shopForOwner = await Shop.findById(order.shop).select("owner");
          emitOrderUpdate(order, { ownerId: shopForOwner?.owner });
        }
      }
    }
  } catch (err) {
    console.error("[Razorpay Webhook] Error processing event:", err);
    // Return 200 so Razorpay doesn't keep retrying a processing error
  }

  res.json({ status: "ok" });
};
