const { connectToDatabase } = require("./_lib/db");
const { requireAuth } = require("./_lib/auth");

module.exports = async function handler(req, res) {
  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { db } = await connectToDatabase();
  const collection = db.collection("transactions");

  if (req.method === "GET") {
    try {
      const transactions = await collection.find({}).sort({ date: -1 }).toArray();
      return res.json(transactions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to fetch transactions." });
    }
  }

  if (req.method === "POST") {
    try {
      const { id, type, category, amount, description, date, reference, status } = req.body || {};
      const doc = { id, type, category, amount, description, date, reference, status };
      await collection.insertOne(doc);
      return res.status(201).json(doc);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to create transaction." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
};
