const { connectToDatabase } = require("./_lib/db");
const { requireAuth } = require("./_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const { db } = await connectToDatabase();

    const memberAgg = await db.collection("members").aggregate([
      {
        $group: {
          _id: null,
          member_count: { $sum: 1 },
          total_contributions: { $sum: "$contributions" },
          total_outstanding: { $sum: "$outstanding" },
        },
      },
    ]).toArray();

    const incomeAgg = await db.collection("transactions").aggregate([
      { $match: { type: "income" } },
      {
        $group: {
          _id: null,
          total_income: { $sum: "$amount" },
        },
      },
    ]).toArray();

    const expenseAgg = await db.collection("transactions").aggregate([
      { $match: { type: "expense" } },
      {
        $group: {
          _id: null,
          total_expenses: { $sum: "$amount" },
        },
      },
    ]).toArray();

    return res.json({
      members: {
        member_count: memberAgg[0]?.member_count || 0,
        total_contributions: memberAgg[0]?.total_contributions || 0,
        total_outstanding: memberAgg[0]?.total_outstanding || 0,
      },
      income: {
        total_income: incomeAgg[0]?.total_income || 0,
      },
      expenses: {
        total_expenses: expenseAgg[0]?.total_expenses || 0,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to fetch summary." });
  }
};
