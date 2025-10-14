import { prisma } from "../database/prismaClient.js";

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

// ✅ Obtener todos los trabajos disponibles (público)
export async function getJobsController(req, res) {
  try {
    const userId = req.user?.id; // si el usuario está logueado
    console.log("🔍 Buscando trabajos activos...");

    const jobs = await prisma.job.findMany({
      where: { isActive: true, isCompleted: false },
      include: {
        company: { select: { nombreEmpresa: true, email: true } },
        applications: {
          where: { userId: userId || undefined },
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

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
      userStatus: job.applications[0]?.status || "NONE", // 👈 NUEVO CAMPO
    }));

    console.log(`📊 ${formattedJobs.length} trabajos disponibles encontrados`);
    return res.json(formattedJobs);
  } catch (error) {
    console.error("❌ Error obteniendo trabajos:", error);
    return res.status(500).json({ error: "Error obteniendo trabajos" });
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
