const { signJwt } = require("./_lib/auth");

const users = [
  { email: "admin@fundflow.org", password: "password", role: "admin", name: "Admin Adeyemi" },
  { email: "member@fundflow.org", password: "password", role: "member", name: "Amara Nwosu" },
];

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = signJwt({ email: user.email, role: user.role });
  return res.json({ token, role: user.role, name: user.name, email: user.email });
};
