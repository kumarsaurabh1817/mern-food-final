import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_SECRET) throw new Error("ACCESS_TOKEN_SECRET is not set!");
if (!REFRESH_SECRET) throw new Error("REFRESH_TOKEN_SECRET is not set!");

export const generateAccessToken = (user) => {
	return jwt.sign(
		{ sub: user._id, role: user.role },
		ACCESS_SECRET,
		{ expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
	);
};

export const generateRefreshToken = (user) => {
	return jwt.sign(
		{ sub: user._id },
		REFRESH_SECRET,
		{ expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
	);
};

export const verifyAccessToken = (token) => {
	return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
	return jwt.verify(token, REFRESH_SECRET);
};
