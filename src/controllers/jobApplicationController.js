import { prisma } from "../database/prismaClient.js";

// =====================================================
// 🟣 USUARIO SE POSTULA A UN TRABAJO
// =====================================================
export const applyToJobController = async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const userId = req.user?.id;
    const { name, email } = req.body;

    if (!userId)
      return res.status(401).json({ message: "Usuario no autenticado" });

    // Verificar que el trabajo exista
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });
    if (!job)
      return res.status(404).json({ message: "Trabajo no encontrado" });

    // Evitar duplicados
    const existing = await prisma.jobApplication.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (existing)
      return res
        .status(409)
        .json({ message: "Ya te postulaste a este trabajo" });

    // Crear postulación
    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobId,
        status: "PENDING",
        message: `Postulación de ${name} (${email})`,
      },
      include: {
        user: { select: { nombre: true, email: true } },
        job: {
          select: { title: true, company: { select: { nombreEmpresa: true } } },
        },
      },
    });

    console.log(
      `✅ Usuario ${userId} se postuló al trabajo "${job.title}" de ${job.company?.nombreEmpresa}`
    );

    res.status(201).json({ message: "Postulación enviada", application });
  } catch (error) {
    console.error("❌ Error aplicando a trabajo:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

// =====================================================
// 🟣 EMPRESA VE LAS POSTULACIONES A SUS TRABAJOS
// =====================================================
export const getCompanyJobApplicationsController = async (req, res) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(401).json({ message: "No autorizado" });

    const applications = await prisma.jobApplication.findMany({
      where: { job: { companyId: companyId } },
      include: {
        job: { select: { title: true } },
        user: { select: { nombre: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = applications.map((a) => ({
      id: a.id,
      jobTitle: a.job?.title || "Trabajo sin título",
      applicantName: a.user?.nombre || "Sin nombre",
      applicantEmail: a.user?.email || "Sin email",
      status: a.status,
      createdAt: a.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error obteniendo postulaciones de trabajos:", error);
    res.status(500).json({ message: "Error obteniendo postulaciones" });
  }
};

// =====================================================
// 🟣 EMPRESA ACTUALIZA EL ESTADO (aceptar / rechazar / revisión)
// =====================================================
export const updateJobApplicationStatusController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { nombre: true, email: true } },
        job: {
          select: { title: true, company: { select: { nombreEmpresa: true } } },
        },
      },
    });

    console.log(
      `✅ Estado actualizado: ${status} para aplicación ${id} (${updated.job.title})`
    );

    res.json({ message: "Estado actualizado", application: updated });
  } catch (error) {
    console.error("❌ Error actualizando estado:", error);
    res.status(500).json({ message: "Error actualizando estado" });
  }
};

// =====================================================
// 🟣 USUARIO VE SUS POSTULACIONES A TRABAJOS
// =====================================================
export const getMyJobApplicationsController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: "Usuario no autenticado" });

    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            company: { select: { nombreEmpresa: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = applications.map((a) => ({
      id: a.id,
      jobTitle: a.job?.title || "Trabajo sin título",
      companyName: a.job?.company?.nombreEmpresa || "Desconocida",
      status: a.status,
      createdAt: a.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error obteniendo postulaciones de usuario:", error);
    res.status(500).json({ message: "Error interno" });
  }
};
