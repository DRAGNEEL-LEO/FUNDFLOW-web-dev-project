import { connectToDatabase } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

export default async function handler(req, res) {
  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { db } = await connectToDatabase();
  const collection = db.collection("announcements");

  if (req.method === "GET") {
    try {
      const announcements = await collection.find({}).sort({ date: -1 }).toArray();
      return res.json(announcements);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to fetch announcements." });
    }
  }

  if (req.method === "POST") {
    try {
      const { id, title, body, date, priority, author } = req.body || {};
      const doc = { id, title, body, date, priority, author };
      await collection.insertOne(doc);
      return res.status(201).json(doc);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to create announcement." });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "id is required." });

      const result = await collection.deleteOne({ id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Announcement not found." });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to delete announcement." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
