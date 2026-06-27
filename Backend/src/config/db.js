import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if(!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Please set the MONGODB_URI environment variable.");
    
}

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI );
        console.log("MongoDB connected");
    }
    catch (error) {
        console.error("Failed to connect to MongoDB:", error.message);
        process.exit(1);
    }
};