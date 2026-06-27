import User from "../models/User.js";
import bcrypt from "bcrypt";

export const getOwnProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        isApprovedByAdmin: user.isApprovedByAdmin,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOwnProfile = async (req, res, next) => {
  try {
    const { name, phone, profilePicture } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const {
      label,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault,
      lat,
      lng,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Enforce 5-address cap
    if (user.addresses.length >= 5) {
      return res.status(400).json({
        success: false,
        message:
          "You can save up to 5 addresses. Please remove one before adding a new one.",
      });
    }

    const normalizedLabel = label || "Home";

    // Enforce label uniqueness: Home / Work / Other can each exist only once
    const allowedLabels = ["Home", "Work", "Other"];
    if (allowedLabels.includes(normalizedLabel)) {
      const duplicate = user.addresses.find(
        (a) => a.label.toLowerCase() === normalizedLabel.toLowerCase(),
      );
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `A '${normalizedLabel}' address already exists. Please remove it first or use a different label.`,
        });
      }
    }

    // If this new address is default, clear others
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      label: normalizedLabel,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || false,
      lat: lat !== undefined ? lat : null,
      lng: lng !== undefined ? lng : null,
    };
    user.addresses.push(newAddress);

    // First address becomes default automatically
    if (user.addresses.length === 1) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    const addedAddress = user.addresses[user.addresses.length - 1];

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: addedAddress,
      addresses: user.addresses, // full list — CheckoutPage reads data.addresses
      totalAddresses: user.addresses.length,
      canAddMore: user.addresses.length < 5,
    });
  } catch (error) {
    next(error);
  }
};

export const removeAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const initialLength = user.addresses.length;
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== addressId,
    );

    if (user.addresses.length === initialLength) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    // If we removed the default address and there are other addresses, make the first one default
    const hasDefault = user.addresses.some((addr) => addr.isDefault);
    if (!hasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address removed successfully",
      addresses: user.addresses,
      canAddMore: user.addresses.length < 5,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    const {
      label,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault,
      lat,
      lng,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    // Label uniqueness check when changing label
    if (label && label !== addr.label) {
      const allowedLabels = ["Home", "Work", "Other"];
      if (allowedLabels.includes(label)) {
        const duplicate = user.addresses.find(
          (a) =>
            a._id.toString() !== addressId &&
            a.label.toLowerCase() === label.toLowerCase(),
        );
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `A '${label}' address already exists. Please remove it first.`,
          });
        }
      }
      addr.label = label;
    }

    if (street !== undefined) addr.street = street;
    if (city !== undefined) addr.city = city;
    if (state !== undefined) addr.state = state;
    if (zipCode !== undefined) addr.zipCode = zipCode;
    if (country !== undefined) addr.country = country;
    if (lat !== undefined) addr.lat = lat;
    if (lng !== undefined) addr.lng = lng;

    if (isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      addr.isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: addr,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current and new password are required.",
      });
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[@$!%*#?&^()_\-+=<>]/.test(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters with an uppercase letter, a number, and a special character.",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password.",
      });
    }

    user.password = newPassword; // hashed by pre-save hook
    // Revoke all refresh tokens so other devices must re-login
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please log in again on other devices.",
    });
  } catch (error) {
    next(error);
  }
};
