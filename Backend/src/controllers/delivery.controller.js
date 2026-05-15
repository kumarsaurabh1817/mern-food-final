import Order from "../models/Order.js";
import DeliveryProfile from "../models/DeliveryProfile.js";
import { getIO } from "../socket/index.js";

// NOTE: DeliveryProfile is lazily created on first access (GET /api/delivery/me).
// This is intentional for now, but ideally this creation should be triggered once
// during admin approval of a delivery_boy user, not on every GET.
// TODO: Move profile seeding to the admin approval flow (adminController.approveUser)
//       and remove the upsert here to prevent unexpected DB writes.
const getProfile = async (userId) => {
  // Atomic upsert — safe even under concurrent first-time requests
  return DeliveryProfile.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { upsert: true, new: true },
  );
};

// @desc    Get current delivery profile
// @route   GET /api/delivery/me
// @access  Delivery Boy
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.id);
    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle online / offline duty status
// @route   PATCH /api/delivery/toggle-duty
// @access  Delivery Boy
export const toggleDuty = async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.id);

    const { longitude, latitude } = req.body || {};
    if (longitude !== undefined && latitude !== undefined) {
      profile.currentLocation.coordinates = [
        parseFloat(longitude),
        parseFloat(latitude),
      ];
    }

    profile.isOnline = !profile.isOnline;
    await profile.save();

    res.status(200).json({
      success: true,
      message: `You are now ${profile.isOnline ? "online" : "offline"}`,
      isOnline: profile.isOnline,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View nearby pending orders available for bidding
// @route   GET /api/delivery/pool
// @access  Delivery Boy
export const getPool = async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.id);

    if (!profile.isOnline) {
      return res.status(400).json({
        success: false,
        message: "You must be online to view the delivery pool",
      });
    }

    // FIX #4: Include 'confirmed' and 'preparing' statuses — orders the shop
    // has accepted are the ones actually ready for pickup by agents.
    // Only 'pending' was shown before, making confirmed/preparing invisible.
    const poolOrders = await Order.find({
      status: { $in: ["ready_for_pickup"] },
      $or: [{ deliveryAgent: { $exists: false } }, { deliveryAgent: null }],
      _id: { $nin: profile.rejectedOrders },
    })
      .populate({
        path: "shop",
        select: "name address isApproved isOpen isSuspended",
      })
      .populate("customer", "name")
      .sort({ createdAt: 1 });

    // Filter out orders from unapproved or suspended shops
    const filteredOrders = poolOrders.filter(
      (o) => o.shop && o.shop.isApproved && !o.shop.isSuspended,
    );

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      orders: filteredOrders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a delivery request
// @route   POST /api/delivery/accept/:orderId
// @access  Delivery Boy
export const acceptOrder = async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.id);

    if (!profile.isOnline) {
      return res.status(400).json({
        success: false,
        message: "You must be online to accept orders",
      });
    }

    // FIX #5: Atomic findOneAndUpdate with a conditional filter prevents the
    // race condition where two agents read deliveryAgent=null simultaneously
    // and both proceed to save. Now only ONE write will match the filter and
    // succeed; the other will get null back and return a 409.
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.orderId,
        status: { $in: ["ready_for_pickup"] },
        $or: [{ deliveryAgent: { $exists: false } }, { deliveryAgent: null }],
      },
      { $set: { deliveryAgent: req.user.id, status: "out_for_delivery" } },
      { new: true },
    );

    if (!order) {
      // Either order doesn't exist, is already taken, or in a terminal state
      const existing = await Order.findById(req.params.orderId).select(
        "deliveryAgent status",
      );
      if (!existing)
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      if (existing.deliveryAgent)
        return res.status(409).json({
          success: false,
          message: "Order is already accepted by another delivery partner",
        });
      return res
        .status(400)
        .json({ success: false, message: "Order is no longer available" });
    }

    try {
      const io = getIO();
      io.to(`order_${order._id}`).emit("order:status", {
        orderId: order._id,
        status: "out_for_delivery",
        deliveryAgent: req.user.id,
      });

      const coords = profile?.currentLocation?.coordinates || [];
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
      if (hasCoords) {
        io.to(`order_${order._id}`).emit("agentLocationUpdated", { lat, lng });
      }
    } catch (_) {
      /* socket not critical — order is already saved */
    }

    res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject / skip a delivery request
// @route   POST /api/delivery/reject/:orderId
// @access  Delivery Boy
export const rejectOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // FIX #24 & #25: Use a single atomic $push + $slice to cap the array at 200.
    // This prevents unbounded growth which makes the $nin query in getPool slow.
    // $slice: -200 keeps only the LAST 200 rejected order IDs.
    await DeliveryProfile.findOneAndUpdate(
      { user: req.user.id, rejectedOrders: { $ne: orderId } }, // skip if already present
      {
        $push: {
          rejectedOrders: {
            $each: [orderId],
            $slice: -200,
          },
        },
      },
      { upsert: true },
    );

    res.status(200).json({
      success: true,
      message: "Order rejected and removed from your pool",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Release (un-accept) an order the agent has already taken
// @route   POST /api/delivery/release/:orderId
// @access  Delivery Boy
export const releaseOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Only the currently assigned agent can release the order
    const order = await Order.findOne({
      _id: orderId,
      deliveryAgent: req.user.id,
    });

    if (!order)
      return res.status(404).json({
        success: false,
        message: "Order not found or you are not the assigned agent",
      });

    // Cannot release after delivery is confirmed
    if (order.status === "delivered" || order.status === "cancelled")
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status} and cannot be released`,
      });

    // If agent picked it up (out_for_delivery), revert to ready_for_pickup so shop knows
    if (order.status === "out_for_delivery") {
      order.status = "ready_for_pickup";
    }
    // For confirmed / preparing states, status stays unchanged — just unassign agent

    order.deliveryAgent = undefined;
    await order.save();

    // Remove from agent's rejectedOrders so it re-appears in the pool for others
    await DeliveryProfile.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { rejectedOrders: orderId } },
    );

    res.status(200).json({
      success: true,
      message: "Order released back to the delivery pool",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View earnings history, daily/weekly breakdown
// @route   GET /api/delivery/earnings
// @access  Delivery Boy
export const getEarnings = async (req, res, next) => {
  try {
    const DELIVERY_FEE = 5; // Fixed fee for demonstration

    const deliveredOrders = await Order.find({
      deliveryAgent: req.user.id,
      status: "delivered",
    }).sort({ updatedAt: -1 });

    const totalEarnings = deliveredOrders.length * DELIVERY_FEE;

    const dailyBreakdown = {};

    deliveredOrders.forEach((order) => {
      const dateObj = new Date(order.updatedAt);
      const dateStr = dateObj.toISOString().split("T")[0];

      if (!dailyBreakdown[dateStr]) {
        dailyBreakdown[dateStr] = { count: 0, earnings: 0 };
      }
      dailyBreakdown[dateStr].count += 1;
      dailyBreakdown[dateStr].earnings += DELIVERY_FEE;
    });

    res.status(200).json({
      success: true,
      totalEarnings,
      totalDeliveries: deliveredOrders.length,
      dailyBreakdown,
      history: deliveredOrders.map((o) => ({
        orderId: o._id,
        date: o.updatedAt,
        fee: DELIVERY_FEE,
      })),
    });
  } catch (error) {
    next(error);
  }
};
