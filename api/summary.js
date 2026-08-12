import { connectToDatabase } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const { db } = await connectToDatabase();

    const membersCount = await db.collection("members").countDocuments({});
    const activeMembersCount = await db.collection("members").countDocuments({ status: "active" });

    const incomeAgg = await db.collection("transactions").aggregate([
      { $match: { type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray();

    const expenseAgg = await db.collection("transactions").aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray();

    const totalIncome = incomeAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const fundBalance = totalIncome - totalExpenses;

    const recentTransactions = await db
      .collection("transactions")
      .find({})
      .sort({ date: -1 })
      .limit(5)
      .toArray();

    return res.json({
      summary: {
        fundBalance,
        totalIncome,
        totalExpenses,
        totalMembers: membersCount,
        activeMembers: activeMembersCount,
      },
      recentTransactions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to fetch summary." });
  }
}
