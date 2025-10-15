import { prisma } from "../database/prismaClient.js";

// ===========================
// 💼 CREAR TRABAJO
// ===========================
export const createJobController = async (req, res) => {
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
      salary,
      modality,
    } = req.body;

    console.log("📩 Datos recibidos:", req.body);

    const job = await prisma.job.create({
      data: {
        title,
        description,
        skills,
        location,
        remuneration: remuneration || salary || null,
        modality,
        isActive: true,
        isCompleted: false,
        hasAccepted: false,
        companyId,
      },
    });

    console.log(`✅ Trabajo creado: ${job.title} (empresa ID ${companyId})`);
    return res.status(201).json(job);
  } catch (error) {
    console.error("❌ Error creando trabajo:", error);
    return res.status(500).json({ error: "Error creando trabajo" });
  }
};

// ===========================
// 🌍 OBTENER TRABAJOS PÚBLICOS
// ===========================
export const getJobsController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { query } = req.query;
    console.log("🔍 Buscando trabajos...", { query });

    let jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        isCompleted: false,
        hasAccepted: false,
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

    if (query && query.trim() !== "") {
      const searchQuery = query.trim().toLowerCase();
      jobs = jobs.filter(job => {
        const allFields = [
          job.title, job.description, job.skills, job.location, job.remuneration,
          job.modality, job.company?.nombreEmpresa, job.company?.email,
          job.company?.ciudad, job.company?.sector
        ].map(v => (v || "").toLowerCase());
        return allFields.some(field => field.includes(searchQuery));
      });
    }

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      skills: job.skills,
      location: job.location,
      remuneration: job.remuneration,
      modality: job.modality,
      isActive: job.isActive,
      isCompleted: job.isCompleted,
      hasAccepted: job.hasAccepted,
      createdAt: job.createdAt,
      company: job.company?.nombreEmpresa || job.company?.email || "WorkNow",
      userStatus: job.applications[0]?.status || "NONE",
    }));

    console.log(`📊 ${formattedJobs.length} trabajos encontrados`);
    res.json(formattedJobs);
  } catch (error) {
    console.error("❌ Error obteniendo trabajos:", error);
    res.status(500).json({ error: "Error obteniendo trabajos" });
  }
};

// ===========================
// 🔎 OBTENER TRABAJO POR ID
// ===========================
export const getJobByIdController = async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            nombreEmpresa: true,
            email: true,
            ciudad: true,
            sector: true,
            sitioWeb: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Trabajo no encontrado" });
    }

    res.json(job);
  } catch (error) {
    console.error("❌ Error obteniendo trabajo por ID:", error);
    res.status(500).json({ error: "Error obteniendo trabajo por ID" });
  }
};

// ===========================
// 🏢 TRABAJOS DE UNA EMPRESA
// ===========================
export const getCompanyJobsController = async (req, res) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(401).json({ error: "Empresa no autenticada" });

    const jobs = await prisma.job.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    res.json(jobs);
  } catch (error) {
    console.error("❌ Error obteniendo trabajos de empresa:", error);
    res.status(500).json({ error: "Error obteniendo trabajos de empresa" });
  }
};

// ===========================
// ✏️ ACTUALIZAR TRABAJO
// ===========================
export const updateJobController = async (req, res) => {
  try {
    const companyId = req.user?.id;
    const jobId = Number(req.params.id);

    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existingJob) return res.status(404).json({ error: "Trabajo no encontrado" });
    if (existingJob.companyId !== companyId)
      return res.status(403).json({ error: "No autorizado para modificar este trabajo" });

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: req.body,
    });

    res.json(updatedJob);
  } catch (error) {
    console.error("❌ Error actualizando trabajo:", error);
    res.status(500).json({ error: "Error actualizando trabajo" });
  }
};

// ===========================
// 🗑️ ELIMINAR TRABAJO
// ===========================
export const deleteJobController = async (req, res) => {
  try {
    const companyId = req.user?.id;
    const jobId = Number(req.params.id);

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Trabajo no encontrado" });
    if (job.companyId !== companyId)
      return res.status(403).json({ error: "No autorizado para eliminar este trabajo" });

    await prisma.job.delete({ where: { id: jobId } });
    res.json({ message: "Trabajo eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando trabajo:", error);
    res.status(500).json({ error: "Error eliminando trabajo" });
  }
};

// ===========================
// 🌐 LISTAR TRABAJOS PÚBLICOS
// ===========================
export const listPublicJobsController = async (req, res) => {
  try {
    const { query } = req.query;
    let jobs = await prisma.job.findMany({
      where: { isActive: true, hasAccepted: false },
      include: {
        company: { select: { nombreEmpresa: true, email: true, ciudad: true, sector: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (query && query.trim() !== "") {
      const searchQuery = query.trim().toLowerCase();
      jobs = jobs.filter(job => {
        const title = job.title?.toLowerCase() || "";
        const company = job.company?.nombreEmpresa?.toLowerCase() || "";
        return title.includes(searchQuery) || company.includes(searchQuery);
      });
    }

    res.json(jobs);
  } catch (error) {
    console.error("❌ Error listando trabajos públicos:", error);
    res.status(500).json({ error: "Error listando trabajos públicos" });
  }
};
