import "server-only";
import { MongoClient } from "mongodb";
import env from "./env";

/**
 * Native MongoDB Client - ONLY FOR NEXTAUTH
 * 
 * This is required by NextAuth's MongoDBAdapter.
 * For all other database operations, use mongoose via connectDb() from db.ts
 */

const globalState = global as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

const uri = env.MONGODB_URI;

export const mongoClientPromise =
  globalState.mongoClientPromise ?? new MongoClient(uri).connect();

if (process.env.NODE_ENV !== "production") {
  globalState.mongoClientPromise = mongoClientPromise;
}

export default mongoClientPromise;
