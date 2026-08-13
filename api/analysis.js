import { connectToDatabase } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

const GEMINI_DEFAULT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

async function requestGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required.");

  const url = `${process.env.GEMINI_API_URL || GEMINI_DEFAULT_URL}?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
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
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4096,
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
  return null;
}

function safeParseJson(raw) {
  if (!raw) return null;
  let text = String(raw).trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  // Direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue repair
  }

  const start = text.indexOf("{");
  if (start === -1) return null;

  // Try parsing backwards from last '}'
  let end = text.lastIndexOf("}");
  while (end > start) {
    const candidate = text.substring(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      end = text.lastIndexOf("}", end - 1);
    }
  }

  // Fallback: repair missing closing braces
  try {
    let repaired = text;
    const lastComma = repaired.lastIndexOf(",");
    if (lastComma > start) {
      repaired = repaired.substring(0, lastComma);
    }
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += "}";
    }
    return JSON.parse(repaired);
  } catch (e) {
    return null;
  }
}

function formatStructuredAsText(structured) {
  if (!structured) return "";
  const parts = [];

  if (structured.healthScore) {
    parts.push(`### Financial Health Score: ${structured.healthScore.score}/100 (${structured.healthScore.label})`);
    if (structured.healthScore.factors) {
      structured.healthScore.factors.forEach((f) => {
        parts.push(`- ${f.name}: ${f.score}%`);
      });
    }
  }

  if (structured.riskMatrix && structured.riskMatrix.length > 0) {
    parts.push("\n### Identified Risks & Mitigations");
    structured.riskMatrix.forEach((r) => {
      parts.push(`- **${r.risk}** (${r.severity.toUpperCase()}): ${r.impact}. *Mitigation*: ${r.mitigation}`);
    });
  }

  if (structured.spendingTrends) {
    parts.push("\n### Spending Trends");
    if (structured.spendingTrends.insights) {
      structured.spendingTrends.insights.forEach((ins) => parts.push(`- ${ins}`));
    }
  }

  if (structured.recommendations && structured.recommendations.length > 0) {
    parts.push("\n### Key Strategic Recommendations");
    structured.recommendations.forEach((rec) => {
      parts.push(`- **${rec.title}** (${rec.priority.toUpperCase()}): ${rec.description}`);
    });
  }

  return parts.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const { db } = await connectToDatabase();
    const role = req.body?.role || user.role || "admin";
    const timePeriod = req.body?.timePeriod || "last 6 months";

    const memberAgg = await db.collection("members").aggregate([
      {
        $group: {
          _id: null,
          total_members: { $sum: 1 },
          total_contributions: { $sum: "$contributions" },
          total_outstanding: { $sum: "$outstanding" },
          active_members: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
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

    const categoryAgg = await db.collection("transactions").aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]).toArray();

    const members = memberAgg[0] || { total_members: 0, total_contributions: 0, total_outstanding: 0, active_members: 0 };
    const income = incomeAgg[0] || { total_income: 0, income_count: 0 };
    const expenses = expenseAgg[0] || { total_expenses: 0, expense_count: 0 };
    const fundBalance = income.total_income - expenses.total_expenses;

    const currentMember = await db.collection("members").findOne({ email: user.email });

    const prompt = `You are an expert AI financial analytics engine for the Smart Fund Management System.
Generate a comprehensive, structured financial analysis for ${role === "admin" ? "executive leadership/board" : "member " + (user.name || user.email)} for time period "${timePeriod}".

CURRENT DATABASE METRICS:
- Total Members: ${members.total_members} (${members.active_members} active)
- Total Member Contributions: Tk ${members.total_contributions}
- Total Outstanding Balance: Tk ${members.total_outstanding}
- Total Fund Income (Recent): Tk ${income.total_income} (${income.income_count} transactions)
- Total Fund Expenses (Recent): Tk ${expenses.total_expenses} (${expenses.expense_count} transactions)
- Net Fund Balance: Tk ${fundBalance}
- Expense Categories Breakdown: ${JSON.stringify(categoryAgg.map(c => ({ category: c._id, total: c.total })))}
${currentMember ? `- Target Member (${currentMember.name}): Contributions=Tk ${currentMember.contributions}, Outstanding=Tk ${currentMember.outstanding}, Status=${currentMember.status}` : ''}

You MUST return strictly valid JSON matching this exact JSON schema (no markdown formatting, no plain text):

{
  "healthScore": {
    "score": 82,
    "label": "Strong | Good | Moderate | At Risk",
    "factors": [
      { "name": "Income Stability", "score": 85 },
      { "name": "Expense Ratio", "score": 75 },
      { "name": "Reserve Coverage", "score": 70 },
      { "name": "Collection Rate", "score": 92 }
    ]
  },
  "riskMatrix": [
    {
      "risk": "Risk summary description",
      "severity": "high | medium | low",
      "impact": "Quantified impact (e.g. Tk 45,000 pending)",
      "mitigation": "Recommended action step"
    }
  ],
  "spendingTrends": {
    "insights": ["Insight point 1", "Insight point 2"],
    "topCategory": "Category Name",
    "topCategoryPercent": 32.5,
    "monthOverMonthChange": 4.2,
    "trend": "increasing | decreasing | stable"
  },
  "revenueDiversification": {
    "sources": [
      { "name": "Monthly Contribution", "percent": 55, "trend": "stable" },
      { "name": "Sponsorship", "percent": 25, "trend": "growing" }
    ],
    "diversificationScore": 75,
    "insight": "Diversification insight description"
  },
  "cashFlow": {
    "insights": ["Cash flow point 1"],
    "monthlyAvgSurplus": 145000,
    "consecutivePositiveMonths": 6,
    "runwayMonths": 4.5
  },
  "forecast": {
    "currentBalance": ${fundBalance},
    "predicted30Day": ${Math.round(fundBalance * 1.08)},
    "predicted90Day": ${Math.round(fundBalance * 1.25)},
    "growthPercent30": 8.0,
    "growthPercent90": 25.0,
    "confidence": 86,
    "scenarioBest": ${Math.round(fundBalance * 1.35)},
    "scenarioWorst": ${Math.round(fundBalance * 0.95)}
  },
  "anomalies": [
    {
      "type": "spike | pattern | deviation",
      "description": "Anomaly description",
      "severity": "warning | info | danger"
    }
  ],
  "recommendations": [
    {
      "priority": "high | medium | low",
      "title": "Action Title",
      "description": "Actionable description",
      "estimatedImpact": "Estimated impact summary"
    }
  ],
  "memberAnalysis": {
    "totalContributions": ${currentMember ? currentMember.contributions : members.total_contributions},
    "outstandingBalance": ${currentMember ? currentMember.outstanding : members.total_outstanding},
    "rank": 2,
    "totalMembers": ${members.total_members},
    "percentile": 85.0,
    "contributionTrend": "consistent",
    "personalRecommendations": [
      { "icon": "check", "text": "Personal recommendation 1" }
    ]
  }
}`;

    const rawResponse = await generateFinancialAnalysis(prompt);

    let structured = safeParseJson(rawResponse);
    let analysisText = "";

    if (structured) {
      analysisText = formatStructuredAsText(structured);
    } else if (rawResponse) {
      analysisText = rawResponse;
    }

    return res.json({
      analysis: analysisText,
      structured,
      summary: {
        members: { total_members: members.total_members, total_contributions: String(members.total_contributions), total_outstanding: String(members.total_outstanding) },
        income: { total_income: String(income.total_income), income_count: income.income_count },
        expenses: { total_expenses: String(expenses.total_expenses), expense_count: expenses.expense_count },
      },
    });
  } catch (error) {
    console.error("Analysis API error:", error);
    return res.status(500).json({ error: error.message || "Unable to generate analysis." });
  }
}


