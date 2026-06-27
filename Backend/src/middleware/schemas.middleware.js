import { body } from "express-validator";

export const signupSchema = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[@$!%*#?&^()_\-+=<>]/)
    .withMessage("Password must contain at least one special character"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["user", "owner", "delivery_boy"])
    .withMessage("Role must be user, owner, or delivery_boy"),

  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .customSanitizer((v) => v?.replace(/[\s\-\.]/g, ""))
    .matches(/^(\+?\d{1,4})?[\(]?\d{6,14}[\)]?$/)
    .withMessage(
      "Phone must be 6–15 digits, optionally prefixed with a country code (e.g. +91 9876543210)",
    ),
];

export const loginSchema = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),

  body("password").notEmpty().withMessage("Password is required"),
];

export const forgotPasswordSchema = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
];

export const resetPasswordSchema = [
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[@$!%*#?&^()_\-+=<>]/)
    .withMessage("Password must contain at least one special character"),
];

export const checkoutSchema = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),

  body("items.*.menuItemId")
    .notEmpty()
    .withMessage("Each item must have a menuItemId")
    .isMongoId()
    .withMessage("Invalid menuItemId"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be at least 1"),

  body("deliveryAddress")
    .notEmpty()
    .withMessage("Delivery address is required"),

  body("deliveryAddress.street")
    .trim()
    .notEmpty()
    .withMessage("Delivery street is required"),

  body("deliveryAddress.city")
    .trim()
    .notEmpty()
    .withMessage("Delivery city is required"),

  body("paymentMethod")
    .optional()
    .isIn(["online", "cod"])
    .withMessage("Payment method must be online or cod"),
];
