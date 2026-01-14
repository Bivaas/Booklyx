import "server-only";
import { MongoClient } from "mongodb";
import env from "./env";

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
