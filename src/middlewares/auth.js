import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET no está definido en .env");
}

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const [scheme, token] = auth.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token requerido o inválido" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
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
