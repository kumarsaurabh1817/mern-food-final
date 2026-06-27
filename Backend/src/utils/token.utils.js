import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
if (!process.env.ACCESS_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET is not set!");
}
if (!process.env.REFRESH_TOKEN_SECRET) {
  throw new Error("REFRESH_TOKEN_SECRET is not set!");
}

export const generateAccessToken = (user) => {
  const payload = {
    sub: user._id,
    role: user.role,
  };
  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    },
  );
};

export const generateRefreshToken = (user) => {
  const payload = {
    sub: user._id,
    role: user.role,
  };
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
};
