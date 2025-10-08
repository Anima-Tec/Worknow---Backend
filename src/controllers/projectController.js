import { prisma } from "../database/prismaClient.js";

export async function createProjectController(req, res) {
  try {
    const { title, description, skills, duration, modality, remuneration, location } = req.body;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        skills,
        duration,
        modality,
        remuneration,
        location,
        isActive: true,
        companyId: req.user?.id || 1, // si usás auth, toma el id del token
      },
    });

    res.json(project);
  } catch (error) {
    console.error("❌ Error creando proyecto:", error);
    res.status(500).json({ error: "Error creando proyecto" });
  }
}

export async function listPublicProjectsController(req, res) {
  try {
    const projects = await prisma.project.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(projects);
  } catch (error) {
    console.error("❌ Error obteniendo proyectos:", error);
    res.status(500).json({ error: "Error obteniendo proyectos" });
  }
}

export async function getCompanyProjectsController(req, res) {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const projects = await prisma.project.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    res.json(projects);
  } catch (error) {
    console.error("❌ Error obteniendo proyectos de empresa:", error);
    res.status(500).json({ error: "Error obteniendo proyectos de empresa" });
  }
}
