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
    console.log("🚀 === INICIO CREAR PROYECTO ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);
    console.log("📦 Datos del body:", req.body);
    console.log("📦 Tipo de datos body:", typeof req.body);

    // Validar autenticación
    const companyId = req.user?.id;
    if (!companyId) {
      console.warn("⚠️ No hay companyId en el token");
      return res.status(401).json({ 
        success: false,
        error: "Empresa no autenticada" 
      });
    }

    console.log("✅ CompanyId validado:", companyId);

    // Extraer datos del body
    const {
      titulo,
      title,
      descripcion,
      description,
      skills,
      duration,
      modalidad,
      modality,
      remuneracion,
      remuneration,
      area,
      tipoTrabajo,
      jobType
    } = req.body;

    // Validar campos obligatorios
    const requiredFields = {
      titulo: titulo || title,
      descripcion: descripcion || description
    };

    console.log("🔍 Campos obligatorios extraídos:", requiredFields);

    const missingFields = [];
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.toString().trim() === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      console.warn("❌ Campos faltantes:", missingFields);
      return res.status(400).json({
        success: false,
        error: "Campos obligatorios faltantes",
        details: `Faltan los siguientes campos: ${missingFields.join(', ')}`
      });
    }

    console.log("✅ Validación de campos completada");

    // Preparar datos para crear el proyecto
    const projectData = {
      title: requiredFields.titulo,
      description: requiredFields.descripcion,
      skills: skills ? (typeof skills === 'object' ? JSON.stringify(skills) : skills) : null,
      duration: duration || null,
      modality: modalidad || modality || null,
      remuneration: remuneracion || remuneration || null,
      companyId: companyId
    };

    console.log("📝 Datos preparados para crear proyecto:", projectData);

    // Verificar conexión a la base de datos
    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma project:", !!prisma?.project);

    // Crear el proyecto
    console.log("💾 Creando proyecto en la base de datos...");
    const project = await prisma.project.create({
      data: projectData,
    });

    console.log("✅ Proyecto creado exitosamente:", project);
    console.log("🏁 === FIN CREAR PROYECTO ===");

    return res.status(201).json({
      success: true,
      message: "Proyecto creado exitosamente",
      data: project
    });

  } catch (error) {
    console.error("❌ === ERROR CREAR PROYECTO ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : "Algo salió mal al crear el proyecto"
    });
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
    console.log("🚀 === INICIO OBTENER PROYECTOS DE EMPRESA ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);

    // Validar autenticación
    const companyId = req.user?.id;
    if (!companyId) {
      console.warn("⚠️ No hay companyId en el token");
      return res.status(401).json({ 
        success: false,
        error: "No autorizado" 
      });
    }

    console.log("✅ CompanyId validado:", companyId);

    // Verificar conexión a la base de datos
    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma project:", !!prisma?.project);

    console.log(`🏢 Empresa ${companyId} viendo sus proyectos`);

    // Buscar proyectos de la empresa
    console.log("🔍 Buscando proyectos en la base de datos...");
    const projects = await prisma.project.findMany({
      where: { companyId },
      include: {
        company: { select: { nombreEmpresa: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("📊 Proyectos encontrados en DB:", projects.length);
    console.log("📋 Proyectos raw:", projects);

    // Formatear respuesta
    const formatted = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      skills: p.skills,
      duration: p.duration,
      modality: p.modality,
      remuneration: p.remuneration,
      projectUrl: p.projectUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      companyName: p.company?.nombreEmpresa || "WorkNow",
    }));

    console.log("✅ Proyectos formateados:", formatted);
    console.log(`📋 ${formatted.length} proyectos de empresa`);
    console.log("🏁 === FIN OBTENER PROYECTOS DE EMPRESA ===");

    return res.status(200).json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error("❌ === ERROR OBTENER PROYECTOS DE EMPRESA ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : "Algo salió mal al obtener proyectos"
    });
  }
}

// ===========================
// 🌍 OBTENER PROYECTOS PÚBLICOS
// ===========================
export const getProjectsController = async (req, res) => {
  try {
    console.log("🚀 === INICIO OBTENER PROYECTOS ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);

    const userId = req.user?.id;
    const { query } = req.query;
    console.log("🔍 Buscando proyectos...", { query, userId });

    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma project:", !!prisma?.project);

    let projects = await prisma.project.findMany({
      include: {
        company: { select: { nombreEmpresa: true, email: true, telefono: true, ciudad: true, sector: true } },
        applications: {
          where: { userId: userId || undefined },
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("📊 Proyectos encontrados en DB:", projects.length);

    if (query && query.trim() !== "") {
      console.log("🔍 Aplicando filtro de búsqueda:", query);
      const searchQuery = query.trim().toLowerCase();
      projects = projects.filter(project => {
        const allFields = [
          project.title, project.description, project.skills, project.modality,
          project.duration, project.remuneration, project.projectUrl,
          project.company?.nombreEmpresa, project.company?.email,
          project.company?.ciudad, project.company?.sector
        ].map(v => (v || "").toLowerCase());
        return allFields.some(field => field.includes(searchQuery));
      });
      console.log("📊 Proyectos después del filtro:", projects.length);
    }

    const formattedProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      skills: project.skills,
      duration: project.duration,
      modality: project.modality,
      remuneration: project.remuneration,
      projectUrl: project.projectUrl,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      company: {
        id: project.company?.id,
        nombreEmpresa: project.company?.nombreEmpresa,
        email: project.company?.email,
        telefono: project.company?.telefono,
        ciudad: project.company?.ciudad,
        sector: project.company?.sector
      },
      userStatus: project.applications[0]?.status || "NONE",
    }));

    console.log(`📊 ${formattedProjects.length} proyectos encontrados`);
    console.log("🏁 === FIN OBTENER PROYECTOS ===");

    return res.status(200).json({
      success: true,
      message: "Proyectos obtenidos correctamente",
      data: formattedProjects
    });
  } catch (error) {
    console.error("❌ === ERROR OBTENER PROYECTOS ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      details: "Error interno del servidor"
    });
  }
};
