import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routers/authRoutes.js";

dotenv.config(); // 👈 carga las variables del .env

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // URL de tu front
    credentials: true,
  })
);

// Rutas
app.use("/api/auth", authRoutes);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
