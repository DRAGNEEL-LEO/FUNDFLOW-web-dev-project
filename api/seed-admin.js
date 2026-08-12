import { connectToDatabase } from "../lib/db.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { db } = await connectToDatabase();
    const usersCol = db.collection("users");

    const existingAdmin = await usersCol.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(403).json({
        error: "An admin account already exists. Use login or ask an admin to create new accounts.",
      });
    }

    const hashedPassword = await bcrypt.hash("password", 10);

    await usersCol.insertOne({
      email: "admin@fundflow.org",
      password: hashedPassword,
      name: "Admin Adeyemi",
      role: "admin",
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: null,
    });

    return res.json({
      success: true,
      message: "First admin account created. Login with admin@fundflow.org / password",
    });
  } catch (error) {
    console.error("Seed admin failed:", error);
    return res.status(500).json({ error: "Seed admin failed: " + error.message });
  }
}
