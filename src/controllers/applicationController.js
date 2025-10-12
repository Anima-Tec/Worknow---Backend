import { prisma } from "../database/prismaClient.js";

// ✅ Usuario se postula a un proyecto
export const applyToProjectController = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user?.id;
    const { name, email } = req.body;

    console.log("📩 Datos recibidos:", { userId, projectId, name, email });
    console.log("🔍 DEBUG - req.user:", req.user);
    console.log("🔍 DEBUG - Headers:", req.headers);

    // 🔍 Verificar que el usuario esté autenticado
    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!projectId) {
      return res.status(400).json({ message: "ID de proyecto requerido" });
    }

    // 🔍 Verificar que el proyecto exista
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    // 🔍 Evitar duplicados
    const existing = await prisma.projectApplication.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (existing) {
      return res.status(409).json({ message: "Ya te postulaste a este proyecto" });
    }

    // ✅ Crear postulación
    const application = await prisma.projectApplication.create({
      data: {
        userId,
        projectId,
        status: "PENDING",
        message: name && email ? `Postulación de ${name} (${email})` : "Postulación realizada",
      },
      include: {
        user: { select: { nombre: true, email: true } },
        project: { select: { title: true } },
      },
    });

    console.log("✅ Postulación creada:", application);
    res.status(201).json({ 
      message: "✅ Postulación creada correctamente", 
      application 
    });
  } catch (error) {
    console.error("❌ Error creando postulación:", error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({ message: "Usuario o proyecto no válido" });
    }
    
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ✅ Empresa ve las postulaciones a sus proyectos
export const getCompanyApplicationsController = async (req, res) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(401).json({ message: "No autorizado" });

    const applications = await prisma.projectApplication.findMany({
      where: { project: { companyId } },
      include: {
        project: { select: { title: true } },
        user: { select: { nombre: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = applications.map((a) => ({
      id: a.id,
      projectTitle: a.project.title,
      applicantName: a.user?.nombre || "Sin nombre",
      applicantEmail: a.user?.email,
      createdAt: a.createdAt,
      status: a.status,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error obteniendo postulaciones de empresa:", error);
    res.status(500).json({ message: "Error obteniendo postulaciones" });
  }
};

// ✅ Actualizar estado de una postulación
export const updateApplicationStatusController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status)
      return res.status(400).json({ message: "Falta el nuevo estado" });

    const updated = await prisma.projectApplication.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { nombre: true, email: true } },
        project: { select: { title: true } },
      },
    });

    res.json({ message: "✅ Estado actualizado", application: updated });
  } catch (error) {
    console.error("❌ Error actualizando estado:", error);
    res.status(500).json({ message: "Error actualizando estado" });
  }
};