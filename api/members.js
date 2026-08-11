const { connectToDatabase } = require("./_lib/db");
const { requireAuth } = require("./_lib/auth");

module.exports = async function handler(req, res) {
  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { db } = await connectToDatabase();
  const collection = db.collection("members");

  if (req.method === "GET") {
    try {
      const members = await collection.find({}).sort({ joined: -1 }).toArray();
      return res.json(members);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to fetch members." });
    }
  }

  if (req.method === "POST") {
    try {
      const { id, name, email, role, initials, joined, status, contributions, outstanding, phone } = req.body || {};
      const doc = { id, name, email, role, initials, joined, status, contributions, outstanding, phone };
      await collection.insertOne(doc);
      return res.status(201).json(doc);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to create member." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
};
