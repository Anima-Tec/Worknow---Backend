import { prisma } from "../database/prismaClient.js";


export async function applyToProjectController(req, res) {
  try {
    const { message } = req.body;
    const app = await prisma.projectApplication.create({
      data: {
        userId: req.user.id,
        projectId: Number(req.params.id),
        message: message ?? null,
      },
    });
    res.status(201).json(app);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Ya te postulaste a este proyecto" });
    }
    console.error(error);
    res.status(500).json({ error: "Error al postularse" });
  }
}
