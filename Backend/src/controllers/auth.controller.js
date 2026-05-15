import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.utils.js";
import { generateRandomToken, sendEmail } from "../utils/email.utils.js";
import crypto from "crypto";

/**
 * Convert a JWT duration string ('7d', '15m', '2h', '30s') to milliseconds.
 * Returns null if the format is not recognised.
 */
function parseDurationToMs(str) {
  if (!str || typeof str !== "string") return null;
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * map[unit];
}

// ─── One-time Admin Bootstrap ─────────────────────────────────────────────────
// POST /api/auth/setup-admin
// Creates the first admin account. Permanently disabled once any admin exists.
// S1 FIX: Requires a matching ADMIN_SETUP_SECRET in the request body to prevent
// an attacker from seeding their own admin account before the legitimate one.
export const setupAdmin = async (req, res, next) => {
  try {
    // S1 FIX: Secret gate — must match ADMIN_SETUP_SECRET env variable.
    // Set this in Backend/.env before running the first setup, then remove it.
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!setupSecret || req.body.setupSecret !== setupSecret) {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    // Lock down: if even one admin exists, refuse forever
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin account already exists. This endpoint is disabled.",
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email, and password are all required.",
      });
    }

    // Same password rules as regular signup
    const pwdValid =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[@$!%*#?&^()_\-+=<>]/.test(password);

    if (!pwdValid) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.",
      });
    }

    const duplicate = await User.findOne({ email: email.toLowerCase() });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "An account with that email already exists.",
      });
    }

    const admin = new User({
      name,
      email,
      password, // hashed by pre-save hook
      role: "admin",
      isEmailVerified: true,
      isApprovedByAdmin: true,
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message:
        "Admin account created successfully. This endpoint is now permanently disabled.",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, kycDocuments } = req.body;

    // Password is already validated by signupSchema middleware before reaching here.
    // This is a defence-in-depth check in case the route is called without middleware.
    const pwdValid =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[@$!%*#?&^()_\-+=<>]/.test(password);

    if (!pwdValid) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    const validRoles = ["user", "owner", "delivery_boy"]; // Admin accounts must be seeded directly in the DB
    if (!validRoles.includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role selected" });
    }

    const newUser = new User({
      name,
      email,
      password,
      role,
      phone: phone || undefined,
      kycDocuments:
        role === "owner" || role === "delivery_boy" ? kycDocuments : undefined,
      // All accounts are auto-verified — no email verification step
      isEmailVerified: true,
      // Regular users are auto-approved; owners/delivery_boys need admin KYC approval
      isApprovedByAdmin: role === "user",
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message:
        role === "user"
          ? "Account created successfully."
          : "Account created successfully. Your account is pending admin approval — you will be able to login once approved.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isApprovedByAdmin: newUser.isApprovedByAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // B3 FIX: Check block + lockout BEFORE running the expensive bcrypt comparison.
    // This prevents brute-force attempts from continuing to hit comparePassword
    // even when the account is already locked or blocked.
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked. Please contact support.",
      });
    }

    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
      const minutesLeft = Math.ceil(
        (user.accountLockedUntil - Date.now()) / 60000,
      );
      return res.status(403).json({
        success: false,
        message: `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // Only now run the expensive bcrypt comparison
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = Date.now() + 15 * 60 * 1000; // 15 min lockout
      }
      await user.save();
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Enforce admin approval for owners and delivery boys
    if (
      (user.role === "owner" || user.role === "delivery_boy") &&
      !user.isApprovedByAdmin
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending admin approval. You will be notified by email once approved.",
      });
    }

    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Prune refresh tokens that have already expired (past their JWT expiry).
    // We decode iat + compare against the configured refresh TTL.
    const refreshTtlMs =
      parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN) ||
      7 * 24 * 60 * 60 * 1000; // default 7 days
    const cutoff = Date.now() - refreshTtlMs;
    user.refreshTokens = user.refreshTokens
      .filter((t) => {
        try {
          const payload = JSON.parse(
            Buffer.from(t.split(".")[1], "base64").toString(),
          );
          return payload.iat * 1000 > cutoff;
        } catch {
          return false;
        }
      })
      .slice(-4); // keep at most 4 existing + 1 new = 5 max
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      // Cookie lives 30 days so the browser doesn't discard it before the user
      // returns. The JWT inside still expires in 7 days (JWT_REFRESH_EXPIRES_IN)
      // so security is not weakened — an expired JWT is rejected by verifyRefreshToken.
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApprovedByAdmin: user.isApprovedByAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    });

    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token not found" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      // JWT expired or tampered — clear the stale cookie and tell the client
      res.clearCookie("refreshToken");
      return res
        .status(401)
        .json({ success: false, message: "Session expired. Please log in again." });
    }

    const user = await User.findById(decoded.sub);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      // Token was revoked (logout on another device) — clear cookie
      res.clearCookie("refreshToken");
      return res
        .status(401)
        .json({ success: false, message: "Session revoked. Please log in again." });
    }

    // ── Rolling refresh: issue a new refresh token and retire the old one ──
    const newRefreshToken = generateRefreshToken(user);
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const newAccessToken = generateAccessToken(user);
    return res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const { token, hashedToken } = generateRandomToken();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // FIX #6: Use CLIENT_URL (frontend) not req.get('host') (backend).
    // The old URL pointed at localhost:5000 — clicking it returned raw JSON.
    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${token}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#FF7A00,#FF9F43);padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:40px;height:40px;background:rgba(255,255,255,0.25);border-radius:12px;display:inline-block;line-height:40px;text-align:center;font-size:22px;">⚡</div>
              <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;">Orange Bite</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1A1A1A;">Reset your password</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
              We received a request to reset the password for your <strong>Orange Bite</strong> account.
              Click the button below to choose a new password.
            </p>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 28px;">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#FF7A00,#FF9F43);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;box-shadow:0 6px 18px rgba(255,122,0,0.35);letter-spacing:-0.01em;">
                    Reset Password →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Expiry notice -->
            <div style="background:#FFF7ED;border:1.5px solid #FED7AA;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#C2410C;font-weight:600;">
                ⏰ This link expires in <strong>1 hour</strong>. If it expires, simply request a new one.
              </p>
            </div>

            <!-- Fallback URL -->
            <p style="margin:0 0 6px;font-size:12px;color:#9CA3AF;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
              <a href="${resetUrl}" style="color:#FF7A00;text-decoration:none;">${resetUrl}</a>
            </p>

            <hr style="border:none;border-top:1px solid #F3F4F6;margin:0 0 20px;">

            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
              If you didn't request a password reset, you can safely ignore this email —
              your password will remain unchanged and no action is needed.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;padding:20px 40px;text-align:center;border-top:1px solid #F3F4F6;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">
              © ${new Date().getFullYear()} Orange Bite. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await sendEmail({
      to: user.email,
      subject: "Reset your Orange Bite password",
      text: `Hi,\n\nYou requested a password reset for your Orange Bite account.\n\nClick the link below to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\n— Orange Bite Team`,
      html,
    });

    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    user.refreshTokens = [];
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    next(error);
  }
};
