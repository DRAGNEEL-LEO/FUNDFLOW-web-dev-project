import { connectToDatabase } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

export default async function handler(req, res) {
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

  if (req.method === "PUT") {
    try {
      const { id, name, email, phone, status, contributions, outstanding } = req.body || {};
      if (!id) return res.status(400).json({ error: "id is required." });

      const update = {};
      if (name !== undefined) update.name = name;
      if (email !== undefined) update.email = email;
      if (phone !== undefined) update.phone = phone;
      if (status !== undefined) update.status = status;
      if (contributions !== undefined) update.contributions = contributions;
      if (outstanding !== undefined) update.outstanding = outstanding;
      if (name) {
        update.initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      }

      const result = await collection.updateOne({ id }, { $set: update });
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Member not found." });
      }
      return res.json({ success: true, updated: update });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to update member." });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "id is required." });

      const result = await collection.deleteOne({ id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Member not found." });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to delete member." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
