// src/lib/mongodb.ts
import { MongoClient, Db } from "mongodb";

const MONGO_URI = process.env.MONGO_CONNECTION_STRING!;
const DB_NAME = "doctor_consultation";

if (!MONGO_URI) {
  throw new Error("Please define MONGO_CONNECTION_STRING in your .env file");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
