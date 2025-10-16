import { prisma } from "../database/prismaClient.js";

// ✅ Listar proyectos públicos
export async function listPublicProjectsController(req, res) {
  try {
    const userId = req.user?.id || null;
    const { query } = req.query;

    console.log(`🔍 Cargando proyectos...`, { query });

    let projects = await prisma.project.findMany({
      where: { isActive: true },
      include: {
        company: {
          select: {
            nombreEmpresa: true,
            email: true,
            ciudad: true,
            sector: true,
          },
        },
        applications: userId
          ? { where: { userId }, select: { status: true } }
          : false,
      },
      orderBy: { createdAt: "desc" },
    });

    // 🔎 Filtro por búsqueda en campos clave
    if (query && query.trim() !== "") {
      const search = query.trim().toLowerCase();
      projects = projects.filter((p) => {
        const title = p.title?.toLowerCase() || "";
        const description = p.description?.toLowerCase() || "";
        const skills = JSON.stringify(p.skills)?.toLowerCase() || "";
        const remuneration = p.remuneration?.toLowerCase() || "";
        const duration = p.duration?.toLowerCase() || "";
        const companyName = p.company?.nombreEmpresa?.toLowerCase() || "";
        const companySector = p.company?.sector?.toLowerCase() || "";
        const companyCity = p.company?.ciudad?.toLowerCase() || "";

        return (
          title.includes(search) ||
          description.includes(search) ||
          skills.includes(search) ||
          remuneration.includes(search) ||
          duration.includes(search) ||
          companyName.includes(search) ||
          companySector.includes(search) ||
          companyCity.includes(search)
        );
      });
    }

    // 🔹 Formato de salida
    const formatted = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      skills: p.skills,
      duration: p.duration,
      deliveryFormat: p.deliveryFormat,
      evaluation: p.evaluation,
      remuneration: p.remuneration,
      isActive: p.isActive,
      isCompleted: p.isCompleted,
      company: p.company?.nombreEmpresa || "WorkNow",
      userStatus: p.applications?.[0]?.status || "NONE",
    }));

    console.log(`✅ ${formatted.length} proyectos públicos enviados`);
    res.json(formatted);
  } catch (error) {
    console.error("❌ Error obteniendo proyectos:", error);
    res.status(500).json({ error: "Error obteniendo proyectos" });
  }
}

// ✅ Crear un nuevo proyecto
export async function createProjectController(req, res) {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res.status(401).json({ error: "Empresa no autenticada" });
    }

    const {
      title,
      description,
      skills,
      duration,
      deliveryFormat,
      evaluation,
      remuneration,
    } = req.body;

    console.log(`🏗️ Creando nuevo proyecto: "${title}"`);

    const project = await prisma.project.create({
      data: {
        title,
        description,
        skills,
        duration,
        deliveryFormat,
        evaluation,
        remuneration,
        isActive: true,
        isCompleted: false,
        companyId,
      },
    });

    console.log(`✅ Proyecto creado: ${project.id} - "${project.title}"`);
    res.json(project);
  } catch (error) {
    console.error("❌ Error creando proyecto:", error);
    res.status(500).json({ error: "Error creando proyecto" });
  }
}

// ✅ Obtener proyecto por ID
export async function getProjectByIdController(req, res) {
  try {
    const id = Number(req.params.id);
    console.log(`🔍 Buscando proyecto por ID: ${id}`);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            nombreEmpresa: true,
            email: true,
            sitioWeb: true,
            ciudad: true,
            sector: true,
          },
        },
      },
    });

    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    // 🧩 Parsear skills
    let skillsArray = [];
    if (project.skills) {
      try {
        skillsArray = Array.isArray(project.skills)
          ? project.skills
          : JSON.parse(project.skills);
      } catch {
        skillsArray = [String(project.skills)];
      }
    }

    res.json({ ...project, skills: skillsArray });
  } catch (error) {
    console.error("❌ Error obteniendo proyecto por ID:", error);
    res.status(500).json({ error: "Error obteniendo proyecto" });
  }
}

// ✅ Obtener proyectos de la empresa autenticada
export async function getCompanyProjectsController(req, res) {
  try {
    const companyId = req.user?.id;
    if (!companyId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    console.log(`🏢 Empresa ${companyId} viendo sus proyectos`);

    const projects = await prisma.project.findMany({
      where: { companyId, isActive: true, isCompleted: false },
      include: {
        company: { select: { nombreEmpresa: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      skills: p.skills,
      duration: p.duration,
      deliveryFormat: p.deliveryFormat,
      evaluation: p.evaluation,
      remuneration: p.remuneration,
      createdAt: p.createdAt,
      companyName: p.company?.nombreEmpresa || "WorkNow",
    }));

    console.log(`📋 ${formatted.length} proyectos de empresa`);
    res.json(formatted);
  } catch (error) {
    console.error("❌ Error obteniendo proyectos de empresa:", error);
    res.status(500).json({ error: "Error obteniendo proyectos de empresa" });
  }
}
