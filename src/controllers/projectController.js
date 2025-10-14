import { prisma } from "../database/prismaClient.js";

export async function listPublicProjectsController(req, res) {
  try {
    const userId = req.user?.id || null;
    const { query } = req.query;
    
    console.log(`🔍 Cargando proyectos...`, { query });

    let projects = await prisma.project.findMany({
      where: { 
        isActive: true 
      },
      include: {
        company: {
          select: { nombreEmpresa: true, email: true, ciudad: true, sector: true },
        },
        applications: userId
          ? { where: { userId }, select: { status: true } }
          : false,
      },
      orderBy: { createdAt: "desc" },
    });

    // 👇 BUSCAR EN TODOS LOS CAMPOS DEL PROYECTO Y EMPRESA
    if (query && query.trim() !== '') {
      const searchQuery = query.trim().toLowerCase();
      projects = projects.filter(project => {
        // Campos del proyecto
        const title = project.title ? project.title.toLowerCase() : '';
        const description = project.description ? project.description.toLowerCase() : '';
        const skills = project.skills ? JSON.stringify(project.skills).toLowerCase() : '';
        const location = project.location ? project.location.toLowerCase() : '';
        const remuneration = project.remuneration ? project.remuneration.toLowerCase() : '';
        const modality = project.modality ? project.modality.toLowerCase() : '';
        const duration = project.duration ? project.duration.toLowerCase() : '';
        
        // Campos de la empresa
        const companyName = project.company?.nombreEmpresa ? project.company.nombreEmpresa.toLowerCase() : '';
        const companyEmail = project.company?.email ? project.company.email.toLowerCase() : '';
        const companyCity = project.company?.ciudad ? project.company.ciudad.toLowerCase() : '';
        const companySector = project.company?.sector ? project.company.sector.toLowerCase() : '';

        // Buscar en TODOS los campos
        return (
          title.includes(searchQuery) ||
          description.includes(searchQuery) ||
          skills.includes(searchQuery) ||
          location.includes(searchQuery) ||
          remuneration.includes(searchQuery) ||
          modality.includes(searchQuery) ||
          duration.includes(searchQuery) ||
          companyName.includes(searchQuery) ||
          companyEmail.includes(searchQuery) ||
          companyCity.includes(searchQuery) ||
          companySector.includes(searchQuery)
        );
      });
    }

    console.log("📝 Datos reales de proyectos:", projects.map(project => ({
      title: project.title,
      company: project.company?.nombreEmpresa,
      location: project.location,
      skills: project.skills
    })));

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

    console.log(`✅ ${formatted.length} proyectos enviados`);

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error obteniendo proyectos:", error);
    res.status(500).json({ error: "Error obteniendo proyectos" });
  }
}

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