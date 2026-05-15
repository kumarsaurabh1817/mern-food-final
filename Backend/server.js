import "dotenv/config";
import mongoose from "mongoose";

import app from "./src/app.js";
import { initSocket } from "./src/socket/index.js";

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

// ─── Global safety nets ───────────────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
	console.error("[UNHANDLED REJECTION]", reason);
	process.exit(1);
});

process.on("uncaughtException", (err) => {
	console.error("[UNCAUGHT EXCEPTION]", err);
	process.exit(1);
});

const connectDB = async () => {
	if (!mongoUri) {
		console.warn("MONGODB_URI is not set. Starting server without database connection.");
		return;
	}

	await mongoose.connect(mongoUri);
	console.log("MongoDB connected");
};

const startServer = async () => {
	try {
		await connectDB();

		const server = app.listen(port, () => {
			console.log(`Server running on http://localhost:${port}`);
		});

		initSocket(server);

		const shutdown = async (signal) => {
			console.log(`${signal} received. Shutting down gracefully...`);

			server.close(async () => {
				if (mongoose.connection.readyState === 1) {
					await mongoose.connection.close();
					console.log("MongoDB connection closed");
				}

				process.exit(0);
			});
		};

		process.on("SIGINT",  () => { shutdown("SIGINT"); });
		process.on("SIGTERM", () => { shutdown("SIGTERM"); });
	} catch (error) {
		console.error("Failed to start server:", error.message);
		process.exit(1);
	}
};

startServer();

