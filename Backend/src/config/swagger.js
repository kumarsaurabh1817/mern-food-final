import swaggerJsdoc from "swagger-jsdoc";

const port = process.env.PORT || 5000;

const swaggerOptions = {
	definition: {
		openapi: "3.0.3",
		info: {
			title: "Orange Bite API",
			version: "1.0.0",
			description: "Complete API documentation for the Orange Bite food delivery platform. Use the Authorize button to set your Bearer token before testing protected endpoints.",
		},
		servers: [
			{
				url: `http://localhost:${port}`,
				description: "Local development server",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description: "Enter your access token (obtained from POST /api/auth/login)",
				},
			},
		},
		security: [{ bearerAuth: [] }],
		tags: [
			{ name: "System",   description: "Health check and liveness endpoints" },
			{ name: "Auth",     description: "Registration, login, email verification, password reset" },
			{ name: "Users",    description: "Authenticated user profile and saved addresses" },
			{ name: "Shops",    description: "Shop browsing (customers) and shop & menu management (owners)" },
			{ name: "Orders",   description: "Order placement, tracking, and status lifecycle" },
			{ name: "Delivery", description: "Delivery agent duty, pool, and earnings" },
			{ name: "Admin",    description: "Platform management — users, shops, KPIs, revenue (admin only)" },
			{ name: "Payments", description: "Payment intent creation and verification (Stripe / Razorpay)" },
			{ name: "Webhooks", description: "Payment gateway webhook receivers (Stripe / Razorpay)" },
		],
	},
	apis: [
		"./src/app.js",
		"./src/routes/auth.routes.js",
		"./src/routes/user.routes.js",
		"./src/routes/shop.routes.js",
		"./src/routes/order.routes.js",
		"./src/routes/delivery.routes.js",
		"./src/routes/admin.routes.js",
		"./src/routes/payment.routes.js",
		"./src/routes/webhook.routes.js",
	],
};

const rawSpec = swaggerJsdoc(swaggerOptions);

// The JSDoc comments use /api/... prefixes for readability, but Express mounts
// the routers without that prefix (e.g. app.use("/auth", ...)).
// Strip the leading /api from every path key so Swagger UI hits the real URLs.
const strippedPaths = {};
for (const [path, value] of Object.entries(rawSpec.paths || {})) {
	strippedPaths[path.replace(/^\/api/, "")] = value;
}

const swaggerSpec = { ...rawSpec, paths: strippedPaths };

export default swaggerSpec;
