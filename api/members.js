import { connectToDatabase } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";
import { validateMemberPayload } from "../lib/validation.js";

export default async function handler(req, res) {
  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { db } = await connectToDatabase();
  const collection = db.collection("members");

  if (req.method === "GET") {
    try {
      let filter = {};
      if (user.orgId && user.orgId !== "org_default") {
        filter = { orgId: user.orgId };
      } else if (user.orgId === "org_default") {
        filter = { $or: [{ orgId: "org_default" }, { orgId: { $exists: false } }] };
      }
      const members = await collection.find(filter).sort({ joined: -1 }).toArray();
      return res.json(members);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to fetch members." });
    }
  }

  if (req.method === "POST") {
    const validation = validateMemberPayload(req.body || {}, false);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Validation failed.",
        details: validation.errors,
      });
    }

    try {
      const { id, name, email, role, initials, joined, status, contributions, outstanding, phone } = req.body || {};
      const orgId = user.orgId || "org_default";

      // Prevent duplicate members with the same email in the same organization
      const existing = await collection.findOne({
        $or: [
          ...(id ? [{ id }] : []),
          ...(email ? [{ email, ...(orgId !== "org_default" ? { orgId } : {}) }] : []),
        ],
      });

      if (existing) {
        const update = {};
        if (name !== undefined) update.name = name;
        if (phone !== undefined) update.phone = phone;
        if (status !== undefined) update.status = status;
        if (contributions !== undefined) update.contributions = Number(contributions);
        if (outstanding !== undefined) update.outstanding = Number(outstanding);
        if (name) {
          update.initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        }

        await collection.updateOne({ _id: existing._id }, { $set: update });
        return res.json({ ...existing, ...update });
      }

      const doc = {
        id: id || String(Date.now()),
        orgId,
        name,
        email,
        role: role || "member",
        initials: initials || (name ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "M"),
        joined: joined || new Date().toISOString().slice(0, 10),
        status: status || "active",
        contributions: Number(contributions) || 0,
        outstanding: Number(outstanding) || 0,
        phone: phone || "",
      };
      await collection.insertOne(doc);
      return res.status(201).json(doc);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to create member." });
    }
  }

  if (req.method === "PUT") {
    const validation = validateMemberPayload(req.body || {}, true);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Validation failed.",
        details: validation.errors,
      });
    }

    try {
      const { id, name, email, phone, status, contributions, outstanding } = req.body || {};
      if (!id && !email) return res.status(400).json({ error: "id or email is required." });

      const update = {};
      if (name !== undefined) update.name = name;
      if (email !== undefined) update.email = email;
      if (phone !== undefined) update.phone = phone;
      if (status !== undefined) update.status = status;
      if (contributions !== undefined) update.contributions = Number(contributions);
      if (outstanding !== undefined) update.outstanding = Number(outstanding);
      if (name) {
        update.initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      }

      const filter = id ? { id } : { email };
      const result = await collection.updateOne(filter, { $set: update });
      if (result.matchedCount === 0) {
        // If not matched by id, try matching by email
        if (id && email) {
          const fallbackResult = await collection.updateOne({ email }, { $set: update });
          if (fallbackResult.matchedCount === 0) {
            return res.status(404).json({ error: "Member not found." });
          }
        } else {
          return res.status(404).json({ error: "Member not found." });
        }
      }
      return res.json({ success: true, updated: update });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to update member." });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id, email } = req.body || {};
      if (!id && !email) return res.status(400).json({ error: "id or email is required." });

      const filter = id ? { id } : { email };
      const result = await collection.deleteOne(filter);
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
