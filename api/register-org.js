import { connectToDatabase } from "../lib/db.js";
import { signJwt } from "../lib/auth.js";
import { validateRegisterOrgPayload } from "../lib/validation.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const validation = validateRegisterOrgPayload(req.body || {});
  if (!validation.isValid) {
    return res.status(400).json({
      error: "Validation failed.",
      details: validation.errors,
    });
  }

  const { orgName, adminName, email, password, phone } = req.body || {};

  try {
    const { db } = await connectToDatabase();
    const usersCol = db.collection("users");
    const orgsCol = db.collection("organizations");

    // 1. Check if user email already exists
    const existing = await usersCol.findOne({ email: email.trim() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // 2. Create the Organization document
    const orgId = "org_" + Date.now();
    const cleanOrgName = orgName.trim();
    const cleanAdminName = adminName.trim();
    const cleanEmail = email.trim();

    const newOrg = {
      id: orgId,
      name: cleanOrgName,
      slug: cleanOrgName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      ownerEmail: cleanEmail,
      phone: phone ? phone.trim() : "",
      currency: "BDT",
      createdAt: new Date().toISOString().slice(0, 10),
      status: "active",
    };
    await orgsCol.insertOne(newOrg);

    // 3. Hash Password & Create Primary Admin Account
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: "usr_" + Date.now(),
      orgId,
      orgName: cleanOrgName,
      email: cleanEmail,
      password: hashedPassword,
      name: cleanAdminName,
      role: "admin",
      phone: phone ? phone.trim() : "",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    await usersCol.insertOne(newUser);

    // 4. Initialize starter seed balance & announcements for this new organization
    const transactionsCol = db.collection("transactions");
    const announcementsCol = db.collection("announcements");

    await transactionsCol.insertOne({
      id: String(Date.now()),
      orgId,
      type: "income",
      category: "Monthly Contribution",
      amount: 10000,
      description: "Initial treasury setup grant for " + cleanOrgName,
      date: new Date().toISOString().slice(0, 10),
      reference: `ORG-INIT-${Date.now().toString().slice(-6)}`,
      status: "completed",
    });

    await announcementsCol.insertOne({
      id: String(Date.now()),
      orgId,
      title: `Welcome to ${cleanOrgName} Fund Portal`,
      body: `Welcome to the official digital fund management system for ${cleanOrgName}. You can now manage members, record collections, disburse expenses, and track financial transparency.`,
      date: new Date().toISOString().slice(0, 10),
      priority: "high",
      author: cleanAdminName + " (Admin)",
    });

    // 5. Sign JWT token
    const token = signJwt({
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      orgId,
      orgName: cleanOrgName,
    });

    return res.status(201).json({
      success: true,
      token,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
      orgId,
      orgName: cleanOrgName,
    });
  } catch (error) {
    console.error("Organization registration failed:", error);
    return res.status(500).json({ error: "Registration failed: " + error.message });
  }
}
