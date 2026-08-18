import { connectToDatabase } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";
import { validateWelfareRequestPayload } from "../lib/validation.js";

export default async function handler(req, res) {
  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { db } = await connectToDatabase();
  const collection = db.collection("welfare_requests");

  // ────────────── GET REQUESTS ──────────────
  if (req.method === "GET") {
    try {
      let filter = {};
      const orgId = user.orgId || "org_default";

      if (orgId !== "org_default") {
        filter.orgId = orgId;
      } else {
        filter.$or = [{ orgId: "org_default" }, { orgId: { $exists: false } }];
      }

      // If regular member, only fetch their own submitted applications
      if (user.role === "member") {
        filter.memberEmail = user.email;
      }

      const requests = await collection.find(filter).sort({ date: -1 }).toArray();
      return res.json(requests);
    } catch (error) {
      console.error("Fetch welfare requests failed:", error);
      return res.status(500).json({ error: "Unable to fetch welfare requests." });
    }
  }

  // ────────────── POST NEW REQUEST ──────────────
  if (req.method === "POST") {
    const validation = validateWelfareRequestPayload(req.body || {}, false);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Validation failed.",
        details: validation.errors,
      });
    }

    try {
      const {
        id,
        category,
        amountRequested,
        urgency,
        reason,
        bankOrWalletDetails,
        memberId,
        memberName,
        memberEmail,
        memberPhone,
        date,
      } = req.body || {};

      const orgId = user.orgId || "org_default";
      const doc = {
        id: id || `WLF-${Date.now()}`,
        orgId,
        memberId: memberId || `mem_${Date.now()}`,
        memberName: memberName || user.name || "Member",
        memberEmail: memberEmail || user.email,
        memberPhone: memberPhone || "",
        category,
        amountRequested: Number(amountRequested),
        urgency: urgency || "medium",
        reason: reason.trim(),
        bankOrWalletDetails: bankOrWalletDetails.trim(),
        date: date || new Date().toISOString().slice(0, 10),
        status: "pending",
        adminNote: "",
        createdAt: new Date().toISOString(),
      };

      await collection.insertOne(doc);
      return res.status(201).json(doc);
    } catch (error) {
      console.error("Create welfare request failed:", error);
      return res.status(500).json({ error: "Unable to submit welfare request." });
    }
  }

  // ────────────── PUT UPDATE STATUS / NOTES ──────────────
  if (req.method === "PUT") {
    const validation = validateWelfareRequestPayload(req.body || {}, true);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Validation failed.",
        details: validation.errors,
      });
    }

    try {
      const { id, status, adminNote, amountApproved } = req.body || {};
      if (!id) return res.status(400).json({ error: "id is required." });

      const existing = await collection.findOne({ id });
      if (!existing) {
        return res.status(404).json({ error: "Welfare request not found." });
      }

      // Member can only edit their own pending requests
      if (user.role === "member" && existing.memberEmail !== user.email) {
        return res.status(403).json({ error: "You can only update your own applications." });
      }

      const update = {};
      if (status !== undefined) update.status = status;
      if (adminNote !== undefined) update.adminNote = adminNote;
      if (amountApproved !== undefined) update.amountApproved = Number(amountApproved);

      // If moving to 'disbursed', record expense transaction in ledger
      if (status === "disbursed" && existing.status !== "disbursed") {
        const finalDisbursedAmount = Number(amountApproved || existing.amountApproved || existing.amountRequested);
        const disDate = new Date().toISOString().slice(0, 10);
        const txId = `EXP-WLF-${Date.now().toString().slice(-6)}`;

        update.disbursedDate = disDate;
        update.disbursedTxId = txId;
        update.amountApproved = finalDisbursedAmount;

        const expenseDoc = {
          id: String(Date.now()),
          orgId: user.orgId || existing.orgId || "org_default",
          type: "expense",
          category: "Welfare",
          amount: finalDisbursedAmount,
          description: `Emergency Relief Aid: ${existing.memberName} (${existing.category})`,
          date: disDate,
          reference: txId,
          status: "completed",
          memberId: existing.memberId,
          memberEmail: existing.memberEmail,
          memberName: existing.memberName,
        };

        await db.collection("transactions").insertOne(expenseDoc);
      }

      await collection.updateOne({ id }, { $set: update });
      return res.json({ success: true, updated: update });
    } catch (error) {
      console.error("Update welfare request failed:", error);
      return res.status(500).json({ error: "Unable to update welfare request." });
    }
  }

  // ────────────── DELETE REQUEST ──────────────
  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "id is required." });

      const existing = await collection.findOne({ id });
      if (!existing) {
        return res.status(404).json({ error: "Welfare request not found." });
      }

      if (user.role === "member" && existing.memberEmail !== user.email) {
        return res.status(403).json({ error: "You can only cancel your own applications." });
      }

      await collection.deleteOne({ id });
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete welfare request failed:", error);
      return res.status(500).json({ error: "Unable to delete welfare request." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
