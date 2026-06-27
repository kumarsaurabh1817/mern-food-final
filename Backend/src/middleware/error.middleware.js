// Global error handler — called when any route does next(error) or throws
// Express identifies this as an error handler because it has 4 parameters
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  // In development, also log the stack trace for easier debugging
  const logPayload = {
    status: statusCode,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };
  console.error("[APP_ERROR]", JSON.stringify(logPayload));

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
};
