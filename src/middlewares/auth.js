import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");
  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export function requireCompany(req, res, next) {
  if (!req.user || req.user.role !== "COMPANY") {
    return res.status(403).json({ error: "Solo empresas" });
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user || req.user.role !== "USER") {
    return res.status(403).json({ error: "Solo usuarios" });
  }
  next();
}
