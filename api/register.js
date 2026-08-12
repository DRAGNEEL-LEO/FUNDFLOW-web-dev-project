const { connectToDatabase } = require("./_lib/db");
const { requireAuth } = require("./_lib/auth");
const bcrypt = require("bcryptjs");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Only admins can create accounts
  const user = requireAuth(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Only admins can create accounts." });
  }

  const { email, password, name, role, phone } = req.body || {};

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "email, password, name, and role are required." });
  }

  if (!["admin", "member"].includes(role)) {
    return res.status(400).json({ error: "role must be 'admin' or 'member'." });
  }

  try {
    const { db } = await connectToDatabase();
    const usersCol = db.collection("users");

    // Check if email already exists
    const existing = await usersCol.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: user.email,
    };

    await usersCol.insertOne(newUser);

    // If registering a member, also add them to the members collection
    if (role === "member") {
      const membersCol = db.collection("members");
      const initials = name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      await membersCol.insertOne({
        id: String(Date.now()),
        name,
        email,
        role: "member",
        initials,
        joined: new Date().toISOString().slice(0, 10),
        status: "active",
        contributions: 0,
        outstanding: 0,
        phone: phone || "",
      });
    }

    return res.status(201).json({
      success: true,
      user: { email: newUser.email, name: newUser.name, role: newUser.role },
    });
  } catch (error) {
    console.error("Register failed:", error);
    return res.status(500).json({ error: "Registration failed: " + error.message });
  }
};
