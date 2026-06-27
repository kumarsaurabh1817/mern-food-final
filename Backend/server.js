import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./src/app.js";
import { initSocket } from "./src/socket/index.js";
import { connectDB } from "./src/config/db.js";

const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || "development";

async function gracefulShutdown(server, signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);

  server.close(async () => {
    console.log("HTTP server closed.");

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    }

    console.log("Shutdown complete.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Graceful shutdown timed out — forcing exit.");
    process.exit(1);
  }, 10000);
}

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`server is Listening at : http://localhost:${PORT}`);
    });

    initSocket(server);

    process.on("SIGINT", () => gracefulShutdown(server, "SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown(server, "SIGTERM"));

  } catch (error) {
    console.error("[STARTUP ERROR]", error.message);
    process.exit(1);
  }
}

startServer();
