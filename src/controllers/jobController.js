import { prisma } from "../database/prismaClient.js";

// ===========================
// 💼 CREAR TRABAJO
// ===========================
export const createJobController = async (req, res) => {
  try {
    console.log("🚀 === INICIO CREAR TRABAJO ===");
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
      area,
      tipoTrabajo,
      jobType,
      modalidad,
      modality,
      ubicacion,
      location,
      salario,
      remuneration,
      empresaId,
      skills,
      projectUrl
    } = req.body;

    // Validar campos obligatorios
    const requiredFields = {
      titulo: titulo || title,
      descripcion: descripcion || description,
      area: area,
      tipoTrabajo: tipoTrabajo || jobType,
      modalidad: modalidad || modality,
      ubicacion: ubicacion || location,
      empresaId: empresaId || companyId
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

    // Preparar datos para crear el trabajo
    const jobData = {
      title: requiredFields.titulo,
      description: requiredFields.descripcion,
      area: requiredFields.area,
      jobType: requiredFields.tipoTrabajo,
      modality: requiredFields.modalidad,
      location: requiredFields.ubicacion,
      remuneration: salario || remuneration || null,
      skills: skills ? (typeof skills === 'object' ? JSON.stringify(skills) : skills) : null,
      projectUrl: projectUrl || null,
      companyId: companyId
    };

    console.log("📝 Datos preparados para crear trabajo:", jobData);

    // Verificar conexión a la base de datos
    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma job:", !!prisma?.job);

    // Crear el trabajo
    console.log("💾 Creando trabajo en la base de datos...");
    const job = await prisma.job.create({
      data: jobData,
    });

    console.log("✅ Trabajo creado exitosamente:", job);
    console.log("🏁 === FIN CREAR TRABAJO ===");

    return res.status(201).json({
      success: true,
      message: "Trabajo creado exitosamente",
      data: job
    });

  } catch (error) {
    console.error("❌ === ERROR CREAR TRABAJO ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : "Algo salió mal al crear el trabajo"
    });
  }
};

// ===========================
// 🌍 OBTENER TRABAJOS PÚBLICOS
// ===========================
export const getJobsController = async (req, res) => {
  try {
    console.log("🚀 === INICIO OBTENER TRABAJOS ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);

    const userId = req.user?.id;
    const { query } = req.query;
    console.log("🔍 Buscando trabajos...", { query, userId });

    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma job:", !!prisma?.job);

    let jobs = await prisma.job.findMany({
      include: {
        company: { select: { nombreEmpresa: true, email: true, telefono: true, ciudad: true, sector: true } },
        jobApplications: {
          where: { userId: userId || undefined },
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("📊 Trabajos encontrados en DB:", jobs.length);

    if (query && query.trim() !== "") {
      console.log("🔍 Aplicando filtro de búsqueda:", query);
      const searchQuery = query.trim().toLowerCase();
      jobs = jobs.filter(job => {
        const allFields = [
          job.title, job.description, job.skills, job.location, job.remuneration,
          job.modality, job.area, job.jobType, job.contractType,
          job.company?.nombreEmpresa, job.company?.email,
          job.company?.ciudad, job.company?.sector
        ].map(v => (v || "").toLowerCase());
        return allFields.some(field => field.includes(searchQuery));
      });
      console.log("📊 Trabajos después del filtro:", jobs.length);
    }

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      area: job.area,
      jobType: job.jobType,
      contractType: job.contractType,
      modality: job.modality,
      location: job.location,
      remuneration: job.remuneration,
      skills: job.skills,
      projectUrl: job.projectUrl,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      company: {
        id: job.company?.id,
        nombreEmpresa: job.company?.nombreEmpresa,
        email: job.company?.email,
        telefono: job.company?.telefono,
        ciudad: job.company?.ciudad,
        sector: job.company?.sector
      },
      userStatus: job.jobApplications[0]?.status || "NONE",
    }));

    console.log(`📊 ${formattedJobs.length} trabajos encontrados`);
    console.log("🏁 === FIN OBTENER TRABAJOS ===");

    return res.status(200).json({
      success: true,
      message: "Trabajos obtenidos correctamente",
      data: formattedJobs
    });
  } catch (error) {
    console.error("❌ === ERROR OBTENER TRABAJOS ===");
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
