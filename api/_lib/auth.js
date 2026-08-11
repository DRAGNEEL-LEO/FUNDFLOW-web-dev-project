const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretdev";

function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

function requireAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}

module.exports = { signJwt, verifyJwt, requireAuth };
