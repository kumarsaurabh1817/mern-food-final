import Order from "../models/Order.js";
import Shop from "../models/Shop.js";
import { getIO, deleteAgentLocationCache } from "../socket/index.js";
import MenuItem from "../models/MenuItem.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

/**
 * Haversine formula — returns the great-circle distance in km
 * between two lat/lng points.
 */
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const getOrderAnalytics = async (req, res, next) => {
  try {
    const daysRaw = Number.parseInt(req.query.days, 10);
    const days = Number.isFinite(daysRaw) ? daysRaw : 7;
    const useAllTime = req.query.range === "all" || days <= 0;

    let shopId = req.query.shopId;
    let shop = null;
    if (req.user.role === "owner") {
      shop = await Shop.findOne({ owner: req.user.id }).select("_id name");
      if (!shop) {
        return res
          .status(404)
          .json({ success: false, message: "Shop not found" });
      }
      shopId = shop._id;
    } else if (req.user.role === "admin" && shopId) {
      shop = await Shop.findById(shopId).select("_id name");
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setDate(endOfYesterday.getDate() + 1);

    const seriesDays = useAllTime ? 7 : Math.max(1, days);
    const startOfSeries = new Date(startOfToday);
    startOfSeries.setDate(startOfSeries.getDate() - (seriesDays - 1));
    const endOfSeries = new Date(endOfToday);

    const shopMatch = shopId ? { shop: shopId } : {};

    const revenueMatch = (range) => ({
      ...shopMatch,
      createdAt: range,
      $or: [{ status: "delivered" }, { paymentStatus: "paid" }],
    });

    const [
      revenueTodayAgg,
      revenueYesterdayAgg,
      ordersTodayCount,
      ordersYesterdayCount,
      pendingCount,
      weekRevenueAgg,
      paymentSplitAgg,
      statusCountsAgg,
      topItemsAgg,
      activityOrders,
    ] = await Promise.all([
      Order.aggregate([
        { $match: revenueMatch({ $gte: startOfToday, $lt: endOfToday }) },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        {
          $match: revenueMatch({ $gte: startOfYesterday, $lt: endOfYesterday }),
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.countDocuments({
        ...shopMatch,
        createdAt: { $gte: startOfToday, $lt: endOfToday },
      }),
      Order.countDocuments({
        ...shopMatch,
        createdAt: { $gte: startOfYesterday, $lt: endOfYesterday },
      }),
      Order.countDocuments({ ...shopMatch, status: "pending" }),
      Order.aggregate([
        {
          $match: {
            ...shopMatch,
            createdAt: { $gte: startOfSeries, $lt: endOfSeries },
            $or: [{ status: "delivered" }, { paymentStatus: "paid" }],
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$totalAmount" },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            ...shopMatch,
            createdAt: useAllTime
              ? { $exists: true }
              : { $gte: startOfSeries, $lt: endOfSeries },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        {
          $match: {
            ...shopMatch,
            createdAt: useAllTime
              ? { $exists: true }
              : { $gte: startOfSeries, $lt: endOfSeries },
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        {
          $match: {
            ...shopMatch,
            createdAt: useAllTime
              ? { $exists: true }
              : { $gte: startOfSeries, $lt: endOfSeries },
            status: { $ne: "cancelled" },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 3 },
      ]),
      Order.find({ ...shopMatch })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("status createdAt customer")
        .populate("customer", "name"),
    ]);

    const revenueToday = revenueTodayAgg?.[0]?.total || 0;
    const revenueYesterday = revenueYesterdayAgg?.[0]?.total || 0;

    const weekDays = Array.from({ length: seriesDays }, (_, idx) => {
      const date = new Date(startOfSeries);
      date.setDate(startOfSeries.getDate() + idx);
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      };
    });

    const revenueByDate = new Map(
      weekRevenueAgg.map((row) => [row._id, row.total]),
    );
    const weekRevenue = weekDays.map((day) => ({
      date: day.key,
      label: day.label,
      total: revenueByDate.get(day.key) || 0,
    }));

    const paymentSplit = { online: 0, cod: 0 };
    paymentSplitAgg.forEach((row) => {
      if (row._id === "online") paymentSplit.online = row.count;
      if (row._id === "cod") paymentSplit.cod = row.count;
    });

    const statusCounts = {};
    statusCountsAgg.forEach((row) => {
      if (!row._id) return;
      statusCounts[row._id] = row.count;
    });

    const topItems = topItemsAgg.map((row) => ({
      name: row._id,
      count: row.quantity,
    }));

    const activity = activityOrders.map((order) => ({
      id: order._id,
      status: order.status,
      createdAt: order.createdAt,
      customerName: order.customer?.name || "",
    }));

    res.status(200).json({
      success: true,
      analytics: {
        range: {
          days: useAllTime ? 0 : seriesDays,
          startDate: useAllTime ? null : startOfSeries,
          endDate: endOfSeries,
        },
        revenue: {
          today: revenueToday,
          yesterday: revenueYesterday,
        },
        orders: {
          today: ordersTodayCount,
          yesterday: ordersYesterdayCount,
          pending: pendingCount,
        },
        weekRevenue,
        paymentSplit,
        statusCounts,
        topItems,
        activity,
        shop: shop ? { id: shop._id, name: shop.name } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const checkout = async (req, res, next) => {
  try {
    const {
      shopId,
      items: rawItems,
      cartItems,
      deliveryAddress,
      idempotencyKey,
      paymentMethod = "online",
    } = req.body;

    const items =
      Array.isArray(rawItems) && rawItems.length > 0 ? rawItems : cartItems;

    if (idempotencyKey) {
      const existingOrder = await Order.findOne({
        idempotencyKey,
        customer: req.user.id,
      });
      if (existingOrder)
        return res.status(200).json({
          success: true,
          message: "Idempotent hit",
          order: existingOrder,
        });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items provided" });
    }

    // --- FIX #6: Bulk-fetch all menu items in ONE query instead of N individual findById calls ---
    const rawIds = items
      .map((i) => i.menuItemId || i.menuItem || i.id || i._id)
      .filter(Boolean);
    if (rawIds.length !== items.length) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid item: missing menuItemId" });
    }

    const menuItemDocs = await MenuItem.find({ _id: { $in: rawIds } });
    const menuMap = new Map(menuItemDocs.map((m) => [m._id.toString(), m]));

    let resolvedShopId = shopId;
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItemId = (
        item.menuItemId ||
        item.menuItem ||
        item.id ||
        item._id
      ).toString();
      const menuItem = menuMap.get(menuItemId);

      if (!menuItem || !menuItem.isAvailable) {
        return res
          .status(400)
          .json({ success: false, message: `Item unavailable: ${menuItemId}` });
      }

      const menuShopId = menuItem.shop.toString();
      if (!resolvedShopId) {
        resolvedShopId = menuShopId;
      } else if (menuShopId !== resolvedShopId.toString()) {
        return res.status(400).json({
          success: false,
          message: "All items must belong to the same shop",
        });
      }

      const qty = item.quantity || item.qty || 1;
      if (qty <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid item quantity" });
      }

      subtotal += menuItem.price * qty;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
      });
    }

    if (!resolvedShopId) {
      return res
        .status(400)
        .json({ success: false, message: "Shop unavailable" });
    }

    const shop = await Shop.findById(resolvedShopId);
    // FIX #7: Also reject if shop is not approved or is suspended
    if (!shop || !shop.isOpen)
      return res
        .status(400)
        .json({ success: false, message: "Shop is currently unavailable" });
    if (!shop.isApproved)
      return res
        .status(400)
        .json({ success: false, message: "Shop is not yet approved" });
    if (shop.isSuspended)
      return res
        .status(400)
        .json({ success: false, message: "Shop is suspended" });

    // ── Delivery radius validation ──────────────────────────────────────────
    // Only enforced when both the shop has valid coordinates AND the delivery
    // address carries lat/lng (populated by the frontend via browser geolocation
    // or geocoding). If coordinates are absent we skip the check gracefully.
    const shopCoords = shop.address?.coordinates?.coordinates;
    const shopLat = shopCoords?.[1];
    const shopLng = shopCoords?.[0];
    const addrLat = deliveryAddress?.lat;
    const addrLng = deliveryAddress?.lng;
    const hasShopCoords =
      Number.isFinite(shopLat) &&
      Number.isFinite(shopLng) &&
      !(shopLat === 0 && shopLng === 0);
    const hasAddrCoords =
      Number.isFinite(addrLat) &&
      Number.isFinite(addrLng);

    if (hasShopCoords && hasAddrCoords && shop.deliveryRadiusKm > 0) {
      const distanceKm = haversineDistanceKm(shopLat, shopLng, addrLat, addrLng);
      if (distanceKm > shop.deliveryRadiusKm) {
        return res.status(422).json({
          success: false,
          code: "OUTSIDE_DELIVERY_RADIUS",
          message: `Sorry, this restaurant does not deliver to your address. It only delivers within ${shop.deliveryRadiusKm} km (your address is ${distanceKm.toFixed(1)} km away).`,
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          radiusKm: shop.deliveryRadiusKm,
        });
      }
    }
    // ── End radius validation ───────────────────────────────────────────────

    const deliveryCharge = 5;
    const platformFee = subtotal * 0.1;
    const totalAmount = subtotal + deliveryCharge + platformFee;

    // B2 FIX: Generate OTP — store both hash (for verification) and plain value
    // so customers can view it later in order history.
    const rawOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const deliveryOTPHash = await bcrypt.hash(rawOTP, otpRounds);

    const initialStatus = paymentMethod === "cod" ? "confirmed" : "pending";

    const order = await Order.create({
      idempotencyKey,
      // Set 24-hour TTL on the idempotency key so repeated retries within
      // a day return the same order, but stale keys don't block new orders.
      idempotencyKeyExpiresAt: idempotencyKey
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : null,
      customer: req.user.id,
      shop: resolvedShopId,
      items: orderItems,
      subtotal,
      platformFee,
      deliveryCharge,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      // COD orders are "committed" to payment \u2014 mark as paid immediately.
      // Online orders start as 'pending' until Razorpay confirms the payment.
      paymentStatus: paymentMethod === 'cod' ? 'paid' : 'pending',
      status: initialStatus,
      deliveryOTP: rawOTP,
      // deliveryOTP (plain) is returned to customers and never exposed to other roles
      deliveryOTPHash,
    });

    const paymentIntent = {
      id: `pi_mock_${crypto.randomBytes(8).toString("hex")}`,
      amount: totalAmount,
      client_secret: `secret_mock_${crypto.randomBytes(8).toString("hex")}`,
    };

    // deliveryOTP is returned here and also stored for customer history views.
    res
      .status(201)
      .json({ success: true, order, paymentIntent, deliveryOTP: rawOTP });
  } catch (error) {
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.idempotencyKey
    ) {
      const existingOrder = await Order.findOne({
        idempotencyKey: req.body.idempotencyKey,
        customer: req.user.id,
      });
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: "Idempotent hit",
          order: existingOrder,
        });
      }
      return res.status(409).json({
        success: false,
        message: "Idempotency key already used.",
      });
    }
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit))); // cap at 50
    let query = {};

    if (req.user.role === "user") {
      // Customer: only their own orders
      query.customer = req.user.id;
    } else if (req.user.role === "owner") {
      // CRITICAL FIX: scope strictly to the owner's shop.
      // If the owner has no shop yet, return an empty list immediately —
      // NEVER allow query={} which would return every order in the database.
      const shop = await Shop.findOne({ owner: req.user.id }).select("_id");
      if (!shop) {
        return res.status(200).json({
          success: true,
          orders: [],
          total: 0,
          page: parsedPage,
          totalPages: 0,
        });
      }
      query.shop = shop._id;
    } else if (req.user.role === "delivery_boy") {
      // Delivery agent: only orders assigned to them
      query.deliveryAgent = req.user.id;
    }
    // admin role: no filter — sees all orders intentionally

    if (status) query.status = status;

    let orderQuery = Order.find(query)
      .populate("shop", "name")
      .populate("customer", "name")
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .sort({ createdAt: -1 });

    if (req.user.role === "user") orderQuery = orderQuery.select("+deliveryOTP");

    const [orders, total] = await Promise.all([
      orderQuery,
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      orders,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    let orderQuery = Order.findById(req.params.id)
      .populate("shop")
      .populate("customer")
      .populate("deliveryAgent");
    if (role === "user") orderQuery = orderQuery.select("+deliveryOTP");

    const order = await orderQuery;
    if (!order)
      return res.status(404).json({ success: false, message: "Not found" });

    // FIX #8: Enforce ownership — any logged-in user could previously read any order
    if (role === "user" && order.customer?._id?.toString() !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    if (
      role === "delivery_boy" &&
      order.deliveryAgent?._id?.toString() !== userId
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    if (role === "owner") {
      const shop = await Shop.findOne({ owner: userId }).select("_id");
      if (!shop || order.shop?._id?.toString() !== shop._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }
    }
    // admin role: unrestricted access

    const orderData = order.toObject();
    delete orderData.deliveryOTPHash; // never expose the bcrypt hash to any client
    if (role !== "user") delete orderData.deliveryOTP; // only customer sees plain OTP
    res.status(200).json({ success: true, order: orderData });
  } catch (error) {
    next(error);
  }
};

export const confirmOrder = async (req, res, next) => {
  try {
    // Guard: PATCH requests from the frontend may have no body, leaving req.body
    // as undefined. Fall back to {} so preparationTime is simply undefined (optional).
    const { preparationTime } = req.body || {};
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // FIX #12: Only allow confirming a pending order
    if (order.status !== "pending")
      return res.status(400).json({
        success: false,
        message: `Cannot confirm an order with status '${order.status}'`,
      });

    // Block confirmation if the customer's online payment has not been completed.
    // When a Razorpay payment is cancelled/dismissed the order stays as
    // status='pending' + paymentStatus='pending'. The owner must NOT be able
    // to confirm such an order — it would fulfil an unpaid order.
    if (order.paymentMethod === "online" && order.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot confirm this order — payment has not been completed by the customer.",
      });
    }

    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop || order.shop.toString() !== shop._id.toString())
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    order.status = "confirmed";
    order.preparationTime = preparationTime;
    await order.save();

    // Notify the customer's tracking page in real-time
    try {
      const io = getIO();
      io.to(`order_${order._id}`).emit("order:status", {
        orderId: order._id,
        status: "confirmed",
      });
    } catch (_) { /* socket not critical */ }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// FIX #13: New action — owner marks the order as currently being prepared.
// Restores the 'preparing' status in the lifecycle:
//   pending → confirmed → preparing → out_for_delivery → delivered
export const markPreparing = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (order.status !== "confirmed")
      return res.status(400).json({
        success: false,
        message: `Cannot mark as preparing — order is '${order.status}'`,
      });

    const shop = await Shop.findOne({ owner: req.user.id });
    if (
      req.user.role !== "admin" &&
      (!shop || order.shop.toString() !== shop._id.toString())
    )
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    order.status = "preparing";
    await order.save();
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const markReady = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // FIX #13: markReady now requires the order to be in 'preparing' state.
    // Full lifecycle: pending → confirmed → preparing → out_for_delivery → delivered
    if (order.status !== "preparing")
      return res.status(400).json({
        success: false,
        message: `Cannot mark as ready — order is '${order.status}'`,
      });

    // Only the shop owner or admin can mark ready
    const shop = await Shop.findOne({ owner: req.user.id });
    if (
      req.user.role !== "admin" &&
      (!shop || order.shop.toString() !== shop._id.toString())
    )
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    order.status = "ready_for_pickup";
    await order.save();
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("shop", "owner");
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const isCustomer = order.customer.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    // Owner of the shop can also cancel orders placed at their shop
    const isShopOwner = order.shop?.owner?.toString() === req.user.id;

    if (!isCustomer && !isAdmin && !isShopOwner)
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    // Customers can cancel only while pending
    // Owner/admin can cancel pending or confirmed orders
    const cancellableByCustomer = ["pending"];
    const cancellableByOwnerAdmin = ["pending", "confirmed"];
    const allowed = isCustomer
      ? cancellableByCustomer
      : cancellableByOwnerAdmin;

    if (!allowed.includes(order.status))
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled at status '${order.status}'`,
      });

    order.status = "cancelled";
    await order.save();

    // Evict the cached agent location — order is cancelled
    deleteAgentLocationCache(order._id);

    // ── Real-time: push cancellation to customer's tracking page instantly ──
    try {
      const io = getIO();
      io.to(`order_${order._id}`).emit("order:cancelled", {
        orderId: order._id,
        cancelledBy: isShopOwner ? "owner" : isAdmin ? "admin" : "customer",
        message: isShopOwner
          ? "Your order was cancelled by the restaurant."
          : isAdmin
            ? "Your order was cancelled by admin."
            : "Order cancelled.",
      });
    } catch (_) {
      /* socket not critical — order is already saved */
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const verifyDeliveryOtp = async (req, res, next) => {
  try {
    const { otp, deliveryOTP } = req.body;
    const inputOtp = (otp ?? deliveryOTP ?? "").toString().trim();

    // Guard: bcrypt.compare throws if either argument is empty/null
    if (!inputOtp)
      return res
        .status(400)
        .json({ success: false, message: "OTP is required" });

    // Explicitly select the hidden deliveryOTP field so we can use it as fallback
    const order = await Order.findById(req.params.id).select("+deliveryOTP +deliveryOTPHash");
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // Only the assigned delivery agent can verify OTP
    if (!order.deliveryAgent || order.deliveryAgent.toString() !== req.user.id)
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    if (order.status !== "out_for_delivery")
      return res
        .status(400)
        .json({ success: false, message: "Order is not out for delivery" });

    let isValidOtp = false;

    if (order.deliveryOTPHash) {
      // Primary path: compare against bcrypt hash
      isValidOtp = await bcrypt.compare(inputOtp, order.deliveryOTPHash);
    } else if (order.deliveryOTP) {
      // Fallback for legacy orders that stored the plain OTP (select:false keeps it off normal queries)
      isValidOtp = inputOtp === order.deliveryOTP.toString().trim();
    } else {
      return res.status(400).json({
        success: false,
        message: "This order has no OTP set. Please contact support.",
      });
    }

    if (!isValidOtp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    order.status = "delivered";
    // deliveryAgent is already set when agent accepted — do NOT overwrite
    await order.save();

    // Evict the cached agent location — order is complete
    deleteAgentLocationCache(req.params.id);

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};
