import "server-only";
import mongoose from "mongoose";
import env from "./env";

/**
 * Primary database connection using Mongoose
 * 
 * Note: We use BOTH mongoose and native MongoDB client:
 * - Mongoose: For all application models (Business, Booking, etc.)
 * - Native client (mongo-client.ts): Required by NextAuth MongoDBAdapter
 * 
 * This is necessary because NextAuth's adapter expects a native MongoClient.
 */

const globalState = global as typeof globalThis & {
  mongoosePromise?: Promise<typeof mongoose>;
};

export async function connectDb() {
  if (!globalState.mongoosePromise) {
    // Cache the connection across hot reloads in development.
    globalState.mongoosePromise = mongoose.connect(env.MONGODB_URI).catch((error) => {
      globalState.mongoosePromise = undefined;
      throw error;
    });
  }

  return globalState.mongoosePromise;
}
