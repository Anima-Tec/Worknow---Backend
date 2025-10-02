import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from '@prisma/client';
import authRoutes from "./src/routers/authRoutes.js";      // si ya tenés auth
import projectRoutes from "./src/routers/projectRoutes.js";

dotenv.config(); // carga las variables del .env

const app = express();

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", 
    credentials: true,
  })
);

// Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
