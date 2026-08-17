import { connectToDatabase } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";
import { validateTransactionPayload } from "../lib/validation.js";

export default async function handler(req, res) {
  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { db } = await connectToDatabase();
  const collection = db.collection("transactions");

  if (req.method === "GET") {
    try {
      let filter = {};
      if (user.orgId && user.orgId !== "org_default") {
        filter = { orgId: user.orgId };
      } else if (user.orgId === "org_default") {
        filter = { $or: [{ orgId: "org_default" }, { orgId: { $exists: false } }] };
      }
      const transactions = await collection.find(filter).sort({ date: -1 }).toArray();
      return res.json(transactions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to fetch transactions." });
    }
  }

  if (req.method === "POST") {
    const validation = validateTransactionPayload(req.body || {});
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Validation failed.",
        details: validation.errors,
      });
    }

    try {
      const { id, type, category, amount, description, date, reference, status } = req.body || {};
      const doc = {
        id,
        orgId: user.orgId || "org_default",
        type,
        category,
        amount,
        description,
        date,
        reference,
        status,
      };
      await collection.insertOne(doc);
      return res.status(201).json(doc);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to create transaction." });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "id is required." });

      const result = await collection.deleteOne({ id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Transaction not found." });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to delete transaction." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
