import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Order from "../models/Order.js";
import { sendEmail } from "../utils/email.utils.js";


export const getDashboardKpis = async (req, res, next) => {
  try {
    const COMMISSION_RATE = 0.1;
    const [gmvAgg, activeUsers, pendingApprovals, totalShops] =
      await Promise.all([
        Order.aggregate([
          { $match: { status: "delivered" } },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalAmount" },
              count: { $sum: 1 },
            },
          },
        ]),
        User.countDocuments({ isBlocked: false }),
        User.countDocuments({
          isApprovedByAdmin: false,
          role: { $in: ["owner", "delivery_boy"] },
        }),
        Shop.countDocuments({}),
      ]);

    const gmv = gmvAgg[0]?.total || 0;
    const totalOrders = gmvAgg[0]?.count || 0;
    const commission = gmv * COMMISSION_RATE;

    res.status(200).json({
      success: true,
      data: {
        gmv,
        totalOrders,
        activeUsers,
        totalCommission: commission,
        pendingApprovals,
        totalShops,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all users with filters (role, status, search)
// @route   GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const {
      role,
      isBlocked,
      isApprovedByAdmin,
      search,
      page = 1,
      limit = 10,
    } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (parsedPage - 1) * parsedLimit;

    let query = {};
    if (role) query.role = role;
    if (isBlocked !== undefined) query.isBlocked = isBlocked === "true";
    if (isApprovedByAdmin !== undefined)
      query.isApprovedByAdmin = isApprovedByAdmin === "true";

    // Search by name OR email (case-insensitive)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshTokens")
        .skip(skip)
        .limit(parsedLimit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve Owner or Delivery Boy KYC
// @route   PATCH /api/admin/users/:id/approve
export const approveUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.role === "user" || user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Only Owners and Delivery Boys require approval",
      });
    }

    user.isApprovedByAdmin = true;
    await user.save();

    // Fire welcome email asynchronously
    try {
      await sendEmail({
        to: user.email,
        subject: "OrangeBite – Your account has been approved! 🎉",
        html: `<h2>Welcome to OrangeBite, ${user.name}!</h2><p>Your KYC has been reviewed and your account is now <strong>approved</strong>. You can log in and start using the platform.</p>`,
      });
    } catch (emailErr) {
      console.error("Approval email failed:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `${user.role} approved successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject Owner or Delivery Boy KYC
// @route   PATCH /api/admin/users/:id/reject
export const rejectUser = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.role === "user" || user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Only Owners and Delivery Boys require KYC approval",
      });
    }

    user.isApprovedByAdmin = false;
    await user.save();

    if (reason) {
      try {
        await sendEmail({
          to: user.email,
          subject: "OrangeBite – KYC Application Update",
          html: `<h2>Hi ${user.name},</h2><p>Unfortunately, your KYC application has been <strong>rejected</strong> for the following reason:</p><blockquote>${reason}</blockquote><p>Please re-submit your documents or contact support.</p>`,
        });
      } catch (emailErr) {
        console.error("Rejection email failed:", emailErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `KYC rejected for ${user.email}`,
    });
  } catch (error) {
    next(error);
  }
};


export const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot block an admin account" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all shops with approval status + search + status filter
// @route   GET /api/admin/shops
export const getShops = async (req, res, next) => {
  try {
    // Frontend sends: status=all|pending|approved|suspended + search=...
    const { status, search, page = 1, limit = 10 } = req.query;
    const parsedPage  = Math.max(1, parseInt(page,  10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (parsedPage - 1) * parsedLimit;

    let query = {};

    // Translate status string → boolean flags
    if (status === "pending")   { query.isApproved = false; query.isSuspended = false; }
    if (status === "approved")  { query.isApproved = true;  query.isSuspended = false; }
    if (status === "suspended") { query.isSuspended = true; }

    // Search by shop name, category, or city (case-insensitive)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { category: regex },
        { "address.city": regex },
      ];
    }

    const [shops, total] = await Promise.all([
      Shop.find(query)
        .populate("owner", "name email")
        .skip(skip)
        .limit(parsedLimit)
        .sort({ createdAt: -1 }),
      Shop.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: shops.length,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      shops,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a shop for public listing
// @route   PATCH /api/admin/shops/:id/approve
export const approveShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });

    shop.isApproved = true;
    await shop.save();

    res.status(200).json({
      success: true,
      message: "Shop approved and listed",
      shop,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or reinstate a shop
// @route   PATCH /api/admin/shops/:id/suspend
export const toggleSuspendShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });

    shop.isSuspended = !shop.isSuspended;

    if (shop.isSuspended) {
      shop.isOpen = false;
    }

    await shop.save();

    res.status(200).json({
      success: true,
      message: `Shop ${shop.isSuspended ? "suspended" : "reinstated"}`,
      shop,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Detailed revenue, commission, and payout analytics
// @route   GET /api/admin/revenue
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const COMMISSION_RATE = 0.1;

    // FIX #7: push all computation into MongoDB aggregation — no RAM loading
    const [summaryAgg, shopBreakdownAgg] = await Promise.all([
      Order.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: null,
            totalGmv: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: "$shop", revenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const totalGmv = summaryAgg[0]?.totalGmv || 0;
    const totalOrdersDelivered = summaryAgg[0]?.count || 0;
    const totalCommission = totalGmv * COMMISSION_RATE;
    const totalPayoutToShops = totalGmv - totalCommission;

    const shopRevenueBreakdown = Object.fromEntries(
      shopBreakdownAgg.map((row) => [row._id.toString(), row.revenue]),
    );

    res.status(200).json({
      success: true,
      data: {
        totalGmv,
        totalCommission,
        totalPayoutToShops,
        totalOrdersDelivered,
        shopRevenueBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
