import { prisma } from "../database/prismaClient.js";

// ✅ Crear un nuevo proyecto
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
        companyId: req.user?.id || 1, // fallback si no hay auth
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
      include: {
        company: {
          select: { email: true }, // o name si tenés campo "name"
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 🧩 Convertimos la empresa en texto para el front
    const formattedProjects = projects.map((p) => ({
      ...p,
      company: p.company?.email || "WorkNow",
    }));

    res.json(formattedProjects);
  } catch (error) {
    console.error("❌ Error obteniendo proyectos:", error);
    res.status(500).json({ error: "Error obteniendo proyectos" });
  }
}


// ✅ Obtener un proyecto por ID (para ApplyModal)
export async function getProjectByIdController(req, res) {
  try {
    const id = Number(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id },
      include: { company: { select: { id: true, email: true } } },
    });

    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });
    res.json(project);
  } catch (error) {
    console.error("❌ Error obteniendo proyecto por ID:", error);
    res.status(500).json({ error: "Error obteniendo proyecto" });
  }
}

export async function getCompanyProjectsController(req, res) {
  try {
    const companyId = req.user?.id;
    const projects = await prisma.project.findMany({
      where: { companyId },
      include: {
        company: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedProjects = projects.map((p) => ({
      ...p,
      company: p.company?.email || "WorkNow",
    }));

    res.json(formattedProjects);
  } catch (error) {
    console.error("❌ Error obteniendo proyectos de empresa:", error);
    res.status(500).json({ error: "Error obteniendo proyectos de empresa" });
  }
}

