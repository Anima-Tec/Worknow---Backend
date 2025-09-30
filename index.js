import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./src/routers/authRoutes.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);

app.post("/api/jobs", async (req, res) => {
  try {
    const job = await prisma.job.create({
      data: req.body,
    });
    res.json(job);
  } catch (error) {
    console.error("Error creando trabajo:", error);
    res.status(500).json({ error: "Error creando trabajo" });
  }
});

app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(jobs);
  } catch (error) {
    console.error("Error obteniendo trabajos:", error);
    res.status(500).json({ error: "Error obteniendo trabajos" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
