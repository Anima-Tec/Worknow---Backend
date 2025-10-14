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
    console.log("🔍 Buscando proyectos activos NO completados...");

    // OPCIÓN ROBUSTA: Doble filtro
    const projects = await prisma.project.findMany({
      where: { 
        isActive: true
      },
      include: {
        company: {
          select: { 
            nombreEmpresa: true,
            email: true 
          },
        },
        applications: {
          where: {
            status: {
              in: ["Hecho", "HECHO"]
            }
          },
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Filtrar proyectos que NO estén completados Y NO tengan aplicaciones "Hecho"
    const availableProjects = projects.filter(project => 
      project.isCompleted === false && 
      project.applications.length === 0
    );

    console.log(`📊 PROYECTOS ENCONTRADOS: ${projects.length}`);
    console.log(`🎯 PROYECTOS DISPONIBLES: ${availableProjects.length}`);
    
    console.log("📋 Lista completa de proyectos:");
    projects.forEach(p => {
      console.log(`   - "${p.title}" | ID: ${p.id} | isCompleted: ${p.isCompleted} | Aplicaciones "Hecho": ${p.applications.length}`);
    });

    const formattedProjects = availableProjects.map((p) => ({
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
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      company: p.company?.nombreEmpresa || p.company?.email || "WorkNow",
    }));

    console.log(`🎯 Enviando ${formattedProjects.length} proyectos disponibles al frontend`);

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
