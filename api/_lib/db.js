const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set.");
}

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("smartfund");

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

module.exports = { connectToDatabase };
