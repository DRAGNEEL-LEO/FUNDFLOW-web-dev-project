import { connectToDatabase } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";
import { validateRegisterPayload } from "../lib/validation.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const user = requireAuth(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Only admins can create accounts." });
  }

  const validation = validateRegisterPayload(req.body || {});
  if (!validation.isValid) {
    return res.status(400).json({
      error: "Validation failed.",
      details: validation.errors,
    });
  }

  const { email, password, name, role, phone } = req.body || {};

  try {
    const { db } = await connectToDatabase();
    const usersCol = db.collection("users");

    const existing = await usersCol.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const orgId = user.orgId || "org_default";
    const orgName = user.orgName || "FundFlow Community Trust";

    const newUser = {
      email,
      password: hashedPassword,
      name,
      role,
      orgId,
      orgName,
      phone: phone || "",
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: user.email,
    };

    await usersCol.insertOne(newUser);

    const membersCol = db.collection("members");
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    await membersCol.insertOne({
      id: String(Date.now()),
      orgId,
      name,
      email,
      role: role || "member",
      isMainAdmin: false,
      adminType: role === "admin" ? "admin" : undefined,
      initials,
      joined: new Date().toISOString().slice(0, 10),
      status: "active",
      contributions: 0,
      outstanding: 0,
      phone: phone || "",
    });

    return res.status(201).json({
      success: true,
      user: { email: newUser.email, name: newUser.name, role: newUser.role },
    });
  } catch (error) {
    console.error("Register failed:", error);
    return res.status(500).json({ error: "Registration failed: " + error.message });
  }
}
