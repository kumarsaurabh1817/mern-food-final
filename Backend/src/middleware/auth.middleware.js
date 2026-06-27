import { verifyAccessToken } from "../utils/token.utils.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing Authorization bearer token",
      errors: [],
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid Authorization bearer token",
      errors: [],
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    return next();
  } catch(error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Token is invalid or expired",
      errors: [],
    });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        errors: [],
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission",
        errors: [],
      });
    }

    return next();
  };
};
