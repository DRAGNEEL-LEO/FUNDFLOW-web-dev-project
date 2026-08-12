import { connectToDatabase } from "../lib/db.js";
import { signJwt } from "../lib/auth.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = signJwt({ email: user.email, role: user.role, name: user.name });
    return res.json({ token, role: user.role, name: user.name, email: user.email });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Login failed: " + error.message });
  }
}
