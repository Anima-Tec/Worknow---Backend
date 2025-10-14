import { prisma } from "../database/prismaClient.js";

// ✅ Crear un nuevo proyecto
export async function createProjectController(req, res) {
  try {
    const { title, description, skills, duration, modality, remuneration, location } = req.body;

    console.log(`🏗️ Creando nuevo proyecto: "${title}"`);

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
        isCompleted: false,
        companyId: req.user?.id || 1,
      },
    });

    console.log(`✅ Proyecto creado: ${project.id} - "${project.title}"`);

    res.json(project);
  } catch (error) {
    console.error("❌ Error creando proyecto:", error);
    res.status(500).json({ error: "Error creando proyecto" });
  }
}

export async function listPublicProjectsController(req, res) {
  try {
    const userId = req.user?.id || null;
    console.log(`🔍 Cargando proyectos activos (userId: ${userId || "anon"})`);

    // 🔹 Traemos todos los proyectos activos (sin limitar por postulaciones)
    const projects = await prisma.project.findMany({
      where: { isActive: true },
      include: {
        company: {
          select: { nombreEmpresa: true, email: true },
        },
        // Si hay usuario logueado, traemos sus postulaciones
        applications: userId
          ? { where: { userId }, select: { status: true } }
          : false,
      },
      orderBy: { createdAt: "desc" },
    });

    // 🔹 Transformamos para incluir userStatus
    const formatted = projects
      .map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        skills: p.skills,
        duration: p.duration,
        modality: p.modality,
        remuneration: p.remuneration,
        location: p.location,
        isActive: p.isActive,
        isCompleted: p.isCompleted,
        company: p.company?.nombreEmpresa || p.company?.email || "WorkNow",
        userStatus: p.applications?.[0]?.status || "NONE",
      }))
      // 🔥 Ocultar los que están completados o HECHO/ACEPTADO
      .filter(
        (p) =>
          !p.isCompleted &&
          p.userStatus.toUpperCase() !== "HECHO" &&
          p.userStatus.toUpperCase() !== "ACEPTADO"
      );

    console.log(
      `✅ ${formatted.length} proyectos enviados (de ${projects.length} totales)`
    );

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error obteniendo proyectos:", error);
    res.status(500).json({ error: "Error obteniendo proyectos" });
  }
}


// ✅ Obtener un proyecto por ID (para ApplyModal)
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
            email: true,
            nombreEmpresa: true 
          } 
        } 
      },
    });

    if (!project) {
      console.log(`❌ Proyecto ${id} no encontrado`);
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    console.log(`✅ Proyecto encontrado: ${project.id} - "${project.title}" | isCompleted: ${project.isCompleted}`);

    res.json(project);
  } catch (error) {
    console.error("❌ Error obteniendo proyecto por ID:", error);
    res.status(500).json({ error: "Error obteniendo proyecto" });
  }
}

// ✅ Obtener proyectos de la empresa logueada (solo los suyos, activos y no completados)
export async function getCompanyProjectsController(req, res) {
  try {
    const companyId = req.user?.id;

    if (!companyId) {
      return res.status(401).json({ error: "No autorizado: falta ID de empresa" });
    }

    console.log(`🏢 Empresa ${companyId} viendo sus proyectos`);

    const projects = await prisma.project.findMany({
      where: {
        companyId,         // 🔹 Solo proyectos de esta empresa
        isActive: true,    // 🔹 Solo activos
        isCompleted: false // 🔹 No completados
      },
      include: {
        company: {
          select: { nombreEmpresa: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedProjects = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      skills: p.skills,
      duration: p.duration,
      modality: p.modality,
      remuneration: p.remuneration,
      location: p.location,
      createdAt: p.createdAt,
      companyName: p.company?.nombreEmpresa || "WorkNow",
    }));

    console.log(`📋 Empresa ve ${formattedProjects.length} proyectos`);

    res.json(formattedProjects);
  } catch (error) {
    console.error("❌ Error obteniendo proyectos de empresa:", error);
    res.status(500).json({ error: "Error obteniendo proyectos de empresa" });
  }
}
