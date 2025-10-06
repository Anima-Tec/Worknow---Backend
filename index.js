import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routers/authRoutes.js"; // 👈 verifica que sea routers/ o routes/
import jobRoutes from "./src/routers/jobRoutes.js";


dotenv.config();

const app = express();

// Middleware base
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);

// Healthcheck para evitar confusión con 404 en "/"
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Servidor WorkNow corriendo ✅" });
});

// Rutas de auth
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

// Rutas extra (si las usás)
// import projectRoutes from "./src/routes/projectRoutes.js";
// app.use("/api/projects", projectRoutes);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔐 JWT_SECRET length: ${process.env.JWT_SECRET?.length || 0}`);
});
