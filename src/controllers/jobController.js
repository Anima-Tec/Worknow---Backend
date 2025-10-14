import { prisma } from "../database/prismaClient.js";

// ✅ Obtener todos los trabajos disponibles (público) - BUSCA EN TODOS LOS CAMPOS
export async function getJobsController(req, res) {
  try {
    const userId = req.user?.id;
    const { query } = req.query;
    
    console.log("🔍 Buscando trabajos...", { query });

    let jobs = await prisma.job.findMany({
      where: { 
        isActive: true, 
        isCompleted: false,
        hasAccepted: false // 🆕 Solo mostrar trabajos sin aceptados
      },
      include: {
        company: { select: { nombreEmpresa: true, email: true, ciudad: true, sector: true } },
        applications: {
          where: { userId: userId || undefined },
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 👇 BUSCAR EN TODOS LOS CAMPOS DEL TRABAJO Y EMPRESA
    if (query && query.trim() !== '') {
      const searchQuery = query.trim().toLowerCase();
      jobs = jobs.filter(job => {
        // Campos del trabajo
        const title = job.title ? job.title.toLowerCase() : '';
        const description = job.description ? job.description.toLowerCase() : '';
        const skills = job.skills ? String(job.skills).toLowerCase() : '';
        const location = job.location ? job.location.toLowerCase() : '';
        const remuneration = job.remuneration ? job.remuneration.toLowerCase() : '';
        const modality = job.modality ? job.modality.toLowerCase() : '';
        
        // Campos de la empresa
        const companyName = job.company?.nombreEmpresa ? job.company.nombreEmpresa.toLowerCase() : '';
        const companyEmail = job.company?.email ? job.company.email.toLowerCase() : '';
        const companyCity = job.company?.ciudad ? job.company.ciudad.toLowerCase() : '';
        const companySector = job.company?.sector ? job.company.sector.toLowerCase() : '';

        // Buscar en TODOS los campos
        return (
          title.includes(searchQuery) ||
          description.includes(searchQuery) ||
          skills.includes(searchQuery) ||
          location.includes(searchQuery) ||
          remuneration.includes(searchQuery) ||
          modality.includes(searchQuery) ||
          companyName.includes(searchQuery) ||
          companyEmail.includes(searchQuery) ||
          companyCity.includes(searchQuery) ||
          companySector.includes(searchQuery)
        );
      });
    }

    console.log("📝 Datos reales encontrados:", jobs.map(job => ({
      title: job.title,
      company: job.company?.nombreEmpresa,
      location: job.location,
      skills: job.skills,
      hasAccepted: job.hasAccepted // 🆕 Mostrar si tiene aceptado
    })));

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      skills: job.skills,
      location: job.location,
      remuneration: job.remuneration,
      modality: job.modality,
      isActive: job.isActive,
      isCompleted: job.isCompleted,
      hasAccepted: job.hasAccepted, // 🆕 Incluir información de aceptado
      createdAt: job.createdAt,
      company: job.company?.nombreEmpresa || job.company?.email || "WorkNow",
      userStatus: job.applications[0]?.status || "NONE",
    }));

    console.log(`📊 ${formattedJobs.length} trabajos encontrados`);
    return res.json(formattedJobs);
  } catch (error) {
    console.error("❌ Error obteniendo trabajos:", error);
    return res.status(500).json({ error: "Error obteniendo trabajos" });
  }
}

// ✅ Obtener trabajos públicos - BUSCA EN TODOS LOS CAMPOS
export const listPublicJobsController = async (req, res) => {
  try {
    const { query } = req.query;
    
    console.log("🔍 Buscando trabajos públicos...", { query });

    let jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        hasAccepted: false // 🆕 Solo mostrar trabajos sin aceptados
      },
      include: {
        company: {
          select: { nombreEmpresa: true, email: true, ciudad: true, sector: true },
        },
        applications: {
          where: { status: "ACCEPTED" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 👇 BUSCAR EN TODOS LOS CAMPOS DEL TRABAJO Y EMPRESA
    if (query && query.trim() !== '') {
      const searchQuery = query.trim().toLowerCase();
      jobs = jobs.filter(job => {
        const title = job.title ? job.title.toLowerCase() : '';
        const description = job.description ? job.description.toLowerCase() : '';
        const skills = job.skills ? String(job.skills).toLowerCase() : '';
        const location = job.location ? job.location.toLowerCase() : '';
        const remuneration = job.remuneration ? job.remuneration.toLowerCase() : '';
        const modality = job.modality ? job.modality.toLowerCase() : '';
        const companyName = job.company?.nombreEmpresa ? job.company.nombreEmpresa.toLowerCase() : '';
        const companyEmail = job.company?.email ? job.company.email.toLowerCase() : '';
        const companyCity = job.company?.ciudad ? job.company.ciudad.toLowerCase() : '';
        const companySector = job.company?.sector ? job.company.sector.toLowerCase() : '';

        return (
          title.includes(searchQuery) ||
          description.includes(searchQuery) ||
          skills.includes(searchQuery) ||
          location.includes(searchQuery) ||
          remuneration.includes(searchQuery) ||
          modality.includes(searchQuery) ||
          companyName.includes(searchQuery) ||
          companyEmail.includes(searchQuery) ||
          companyCity.includes(searchQuery) ||
          companySector.includes(searchQuery)
        );
      });
    }

    // 🔥 Filtrar trabajos que NO tengan ninguna aplicación aceptada
    const availableJobs = jobs.filter((job) => job.applications.length === 0);

    console.log(`🎯 Trabajos disponibles: ${availableJobs.length}`);

    const formattedJobs = availableJobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company?.nombreEmpresa || "WorkNow",
      area: j.area || "General",
      jobType: j.jobType || "N/A",
      contractType: j.contractType || "Contrato indefinido",
      modality: j.modality || "No especificada",
      location: j.location || "Ubicación no especificada",
      salary: j.salary || "A convenir",
      hasAccepted: j.hasAccepted, // 🆕 Incluir información de aceptado
    }));

    res.json(formattedJobs);
  } catch (error) {
    console.error("❌ Error listando trabajos:", error);
    res.status(500).json({ error: "Error obteniendo trabajos" });
  }
};

// ✅ Crear un nuevo trabajo
export async function createJobController(req, res) {
  try {
    const companyId = req.user?.id;

    if (!companyId) {
      console.warn("⚠️ No hay companyId en el token");
      return res.status(401).json({ error: "Empresa no autenticada" });
    }

    const {
      title,
      description,
      skills,
      location,
      remuneration,
      modality,
    } = req.body;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        skills,
        location,
        remuneration,
        modality,
        isActive: true,
        isCompleted: false,
        hasAccepted: false, // 🆕 Por defecto no tiene aceptados
        companyId,
      },
    });

    console.log(`✅ Trabajo creado: ${job.title} (empresa ID ${companyId})`);
    return res.status(201).json(job);
  } catch (error) {
    console.error("❌ Error creando trabajo:", error);
    return res.status(500).json({ error: "Error creando trabajo" });
  }
}

// ✅ Obtener un trabajo por ID
export async function getJobByIdController(req, res) {
  try {
    const jobId = Number(req.params.id);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: { select: { nombreEmpresa: true, email: true } },
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Trabajo no encontrado" });
    }

    console.log(`📄 Trabajo obtenido: ${job.title}`);
    return res.json(job);
  } catch (error) {
    console.error("❌ Error obteniendo trabajo:", error);
    return res.status(500).json({ error: "Error obteniendo trabajo" });
  }
}

// ✅ Empresa autenticada ve solo sus trabajos
export async function getCompanyJobsController(req, res) {
  try {
    const companyId = req.user?.id;

    if (!companyId) {
      return res.status(401).json({ error: "Empresa no autenticada" });
    }

    const jobs = await prisma.job.findMany({
      where: { companyId },
      include: {
        company: {
          select: { nombreEmpresa: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const activeJobs = jobs.filter(
      (job) => job.isCompleted === false && job.isActive === true
    );

    console.log(
      `🏢 Empresa ${companyId} ve ${activeJobs.length} trabajos activos`
    );
    return res.json(activeJobs);
  } catch (error) {
    console.error("❌ Error obteniendo trabajos de empresa:", error);
    return res
      .status(500)
      .json({ error: "Error obteniendo trabajos de empresa" });
  }
}

// ✅ Actualizar un trabajo
export async function updateJobController(req, res) {
  try {
    const companyId = req.user?.id;
    const jobId = Number(req.params.id);
    const { title, description, skills, location, remuneration, modality } =
      req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job || job.companyId !== companyId) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para editar este trabajo" });
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { title, description, skills, location, remuneration, modality },
    });

    console.log(`✏️ Trabajo actualizado: ${updated.title}`);
    return res.json(updated);
  } catch (error) {
    console.error("❌ Error actualizando trabajo:", error);
    return res.status(500).json({ error: "Error actualizando trabajo" });
  }
}

// ✅ Eliminar un trabajo
export async function deleteJobController(req, res) {
  try {
    const companyId = req.user?.id;
    const jobId = Number(req.params.id);

    if (!companyId) {
      return res.status(401).json({ error: "Empresa no autenticada" });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job || job.companyId !== companyId) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este trabajo" });
    }

    await prisma.job.delete({ where: { id: jobId } });
    console.log(`🗑️ Trabajo eliminado: ${jobId}`);
    return res.json({ message: "Trabajo eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando trabajo:", error);
    return res.status(500).json({ error: "Error eliminando trabajo" });
  }
}