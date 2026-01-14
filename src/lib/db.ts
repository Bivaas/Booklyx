import "server-only";
import mongoose from "mongoose";
import env from "./env";

const globalState = global as typeof globalThis & {
  mongoosePromise?: Promise<typeof mongoose>;
};

export async function connectDb() {
  if (!globalState.mongoosePromise) {
    // Cache the connection across hot reloads in development.
    globalState.mongoosePromise = mongoose.connect(env.MONGODB_URI);
  }

  return globalState.mongoosePromise;
}
