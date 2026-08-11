const { connectToDatabase } = require("./_lib/db");
const { requireAuth } = require("./_lib/auth");

const GEMINI_DEFAULT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function requestGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required.");

  const url = `${process.env.GEMINI_API_URL || GEMINI_DEFAULT_URL}?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
}

async function requestOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required.");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 700,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || JSON.stringify(data);
}

async function generateFinancialAnalysis(prompt) {
  if (process.env.GEMINI_API_KEY) return requestGemini(prompt);
  if (process.env.OPENAI_API_KEY) return requestOpenAI(prompt);
  return "No Gemini or OpenAI API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY in your environment variables.";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const { db } = await connectToDatabase();
    const role = req.body?.role || "admin";
    const timePeriod = req.body?.timePeriod || "last 6 months";

    const memberAgg = await db.collection("members").aggregate([
      {
        $group: {
          _id: null,
          total_members: { $sum: 1 },
          total_contributions: { $sum: "$contributions" },
          total_outstanding: { $sum: "$outstanding" },
        },
      },
    ]).toArray();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoff = sixMonthsAgo.toISOString().split("T")[0];

    const incomeAgg = await db.collection("transactions").aggregate([
      { $match: { type: "income", date: { $gte: cutoff } } },
      {
        $group: {
          _id: null,
          total_income: { $sum: "$amount" },
          income_count: { $sum: 1 },
        },
      },
    ]).toArray();

    const expenseAgg = await db.collection("transactions").aggregate([
      { $match: { type: "expense", date: { $gte: cutoff } } },
      {
        $group: {
          _id: null,
          total_expenses: { $sum: "$amount" },
          expense_count: { $sum: 1 },
        },
      },
    ]).toArray();

    const members = memberAgg[0] || { total_members: 0, total_contributions: 0, total_outstanding: 0 };
    const income = incomeAgg[0] || { total_income: 0, income_count: 0 };
    const expenses = expenseAgg[0] || { total_expenses: 0, expense_count: 0 };

    const prompt = `You are a financial analytics assistant for a fund management system.
Provide a concise ${role === "admin" ? "board-level" : "member-level"} summary of the current fund status for ${timePeriod}.

Key data:
- total members: ${members.total_members}
- total contributions: ${members.total_contributions}
- total outstanding: ${members.total_outstanding}
- recent income sum: ${income.total_income}
- number of income records: ${income.income_count}
- recent expense sum: ${expenses.total_expenses}
- number of expense records: ${expenses.expense_count}

Highlight trends, risk areas, savings, and recommendations for improving fund health. Use clear headings and bullet points.`;

    const analysis = await generateFinancialAnalysis(prompt);
    return res.json({
      analysis,
      summary: {
        members: { total_members: members.total_members, total_contributions: String(members.total_contributions), total_outstanding: String(members.total_outstanding) },
        income: { total_income: String(income.total_income), income_count: income.income_count },
        expenses: { total_expenses: String(expenses.total_expenses), expense_count: expenses.expense_count },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Unable to generate analysis." });
  }
};
