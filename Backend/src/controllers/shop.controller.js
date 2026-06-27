import Shop from "../models/Shop.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";


export const getShops = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Show all approved, non-suspended shops regardless of isOpen status
    // so customers can browse even when a shop is temporarily closed.
    const filter = { isApproved: true, isSuspended: false };

    // Run find + count in parallel — same pattern as getOrders controller
    const [shops, total] = await Promise.all([
      Shop.find(filter)
        .select(
          "name category images address.city address.state isOpen operatingHours",
        )
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Shop.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: shops.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      shops,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search shops and items by keyword, veg/non-veg, price
export const searchShops = async (req, res, next) => {
  try {
    // Bug fix: frontend sends ?q=... but controller was reading keyword
    const { q, keyword, isVeg, maxPrice } = req.query;
    const searchTerm = q || keyword; // support both param names

    // FIX #11: Exclude suspended shops from search results
    let shopFilter = { isApproved: true, isSuspended: false };

    let menuFilter = { isDeleted: { $ne: true } };
    if (isVeg !== undefined) menuFilter.isVeg = isVeg === "true";
    if (maxPrice) menuFilter.price = { $lte: parseFloat(maxPrice) };

    let shops = [];

    if (searchTerm) {
      // Search both Shops and MenuItems
      const matchingShops = await Shop.find({
        ...shopFilter,
        $text: { $search: searchTerm },
      });
      const matchingItems = await MenuItem.find({
        ...menuFilter,
        $text: { $search: searchTerm },
      }).populate("shop");

      const shopMap = new Map();
      matchingShops.forEach((s) => shopMap.set(s._id.toString(), s.toObject()));

      matchingItems.forEach((item) => {
        // Only include shops that pass all filters (approved AND not suspended)
        if (item.shop && item.shop.isApproved && !item.shop.isSuspended) {
          shopMap.set(item.shop._id.toString(), item.shop.toObject());
        }
      });
      shops = Array.from(shopMap.values());
    } else {
      shops = await Shop.find(shopFilter).lean();
    }

    res.status(200).json({
      success: true,
      count: shops.length,
      shops,
    });
  } catch (error) {
    next(error);
  }
};

import mongoose from "mongoose";

// @desc    Get full shop profile with menu
export const getShopById = async (req, res, next) => {
  try {
    const shopArr = await Shop.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "menuitems",
          let: { shopId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$shop", "$$shopId"] },
                isDeleted: { $ne: true },
              },
            },
          ],
          as: "menu",
        },
      },
    ]);
    if (!shopArr.length)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });

    res.status(200).json({ success: true, shop: shopArr[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in owner's shop
export const getMyShop = async (req, res, next) => {
  try {
    const shopArr = await Shop.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $lookup: {
          from: "menuitems",
          let: { shopId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$shop", "$$shopId"] },
                isDeleted: { $ne: true },
              },
            },
          ],
          as: "menu",
        },
      },
    ]);
    const shop = shopArr.length ? shopArr[0] : null;

    res.status(200).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

// @desc    Create shop
export const createShop = async (req, res, next) => {
  try {
    const existingShop = await Shop.findOne({ owner: req.user.id });
    if (existingShop)
      return res.status(400).json({
        success: false,
        message: "You already have a shop registered.",
      });

    // S3 FIX: Allowlist only the fields an owner is permitted to set.
    // Spreading req.body would allow injection of isApproved, isSuspended,
    // commissionRate, owner, etc.
    const {
      name,
      description,
      category,
      images,
      address,
      deliveryRadiusKm,
      operatingHours,
    } = req.body;

    const shopData = {
      name,
      description,
      category,
      images,
      address,
      deliveryRadiusKm,
      operatingHours,
      owner: req.user.id,
      isApproved: false, // always starts unapproved
      isOpen: false, // always starts closed
    };
    const shop = await Shop.create(shopData);

    res
      .status(201)
      .json({ success: true, message: "Shop created successfully", shop });
  } catch (error) {
    next(error);
  }
};

export const updateShop = async (req, res, next) => {
  try {
    let shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    if (shop.owner.toString() !== req.user.id && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    const { isApproved, isSuspended, commissionRate, owner, ...updateData } =
      req.body;
    shop = await Shop.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

export const deleteShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    if (shop.owner.toString() !== req.user.id && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    // FIX #7: Cancel all non-terminal orders before deleting so customers
    // are not left with paid-but-orphaned orders.
    await Order.updateMany(
      { shop: shop._id, status: { $nin: ["delivered", "cancelled"] } },
      { $set: { status: "cancelled" } },
    );

    await shop.deleteOne();
    await MenuItem.deleteMany({ shop: shop._id }); // Cascade delete menu items
    res
      .status(200)
      .json({ success: true, message: "Shop deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const addMenuItem = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    if (shop.owner.toString() !== req.user.id && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    // S4 FIX: Allowlist only valid menu item fields.
    // Spreading req.body would allow injection of isDeleted:true, shop:<other ID>, etc.
    const { name, description, price, category, isAvailable, isVeg, image } =
      req.body;
    await MenuItem.create({
      name,
      description,
      price,
      category,
      isAvailable,
      isVeg,
      image,
      shop: shop._id, // always set from the route param, never from body
    });

    // Return the full updated menu list so frontend can sync state
    const menuItems = await MenuItem.find({
      shop: shop._id,
      isDeleted: { $ne: true },
    });
    res
      .status(201)
      .json({ success: true, message: "Menu item added", menuItems });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    if (shop.owner.toString() !== req.user.id && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    // FIX #9: Whitelist allowed fields — prevents overwriting `shop`, `isDeleted`,
    // or any other field an attacker might inject via req.body.
    const { name, description, price, category, isAvailable, isVeg, image } =
      req.body;
    const allowedUpdates = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (description !== undefined) allowedUpdates.description = description;
    if (price !== undefined) allowedUpdates.price = price;
    if (category !== undefined) allowedUpdates.category = category;
    if (isAvailable !== undefined) allowedUpdates.isAvailable = isAvailable;
    if (isVeg !== undefined) allowedUpdates.isVeg = isVeg;
    if (image !== undefined) allowedUpdates.image = image;

    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.itemId, shop: shop._id },
      allowedUpdates,
      { new: true, runValidators: true },
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });

    // Return the full updated menu list so frontend can sync state
    const menuItems = await MenuItem.find({
      shop: shop._id,
      isDeleted: { $ne: true },
    });
    res
      .status(200)
      .json({ success: true, message: "Menu item updated", item, menuItems });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    if (shop.owner.toString() !== req.user.id && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    const item = await MenuItem.findOne({
      _id: req.params.itemId,
      shop: shop._id,
    });
    if (!item || item.isDeleted)
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });

    item.isDeleted = true;
    await item.save();

    // Return the full updated menu list so frontend can sync state
    const menuItems = await MenuItem.find({
      shop: shop._id,
      isDeleted: { $ne: true },
    });
    res
      .status(200)
      .json({ success: true, message: "Menu item deleted", menuItems });
  } catch (error) {
    next(error);
  }
};

export const toggleItemStock = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    if (shop.owner.toString() !== req.user.id && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    const item = await MenuItem.findOne({
      _id: req.params.itemId,
      shop: shop._id,
    });
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.status(200).json({
      success: true,
      message: `Item marked as ${item.isAvailable ? "in stock" : "out of stock"}`,
      item,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleShopOpen = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    if (shop.owner.toString() !== req.user.id && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    if (!shop.isApproved)
      return res
        .status(400)
        .json({ success: false, message: "Cannot open an unapproved shop" });

    shop.isOpen = !shop.isOpen;
    await shop.save();

    res.status(200).json({
      success: true,
      message: `Shop is now ${shop.isOpen ? "open" : "closed"}`,
      isOpen: shop.isOpen,
    });
  } catch (error) {
    next(error);
  }
};
