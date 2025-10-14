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
        isCompleted: false 
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
      skills: job.skills
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
    }));

    res.json(formattedJobs);
  } catch (error) {
    console.error("❌ Error listando trabajos:", error);
    res.status(500).json({ error: "Error obteniendo trabajos" });
  }
};

// ... (MANTENER EL RESTO DEL CÓDIGO IGUAL)