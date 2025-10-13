import { prisma } from "../database/prismaClient.js";

// 🟣 Usuario se postula a un proyecto
export const applyToProjectController = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user?.id;
    const { name, email } = req.body;

    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });
    if (!projectId) return res.status(400).json({ message: "ID de proyecto requerido" });

    // Verificar que el proyecto exista
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    // Evitar duplicados
    const existing = await prisma.projectApplication.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (existing) return res.status(409).json({ message: "Ya te postulaste a este proyecto" });

    // Actualizar nombre/email del usuario si se mandan
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const updateData = {};
    if (name && !user.nombre) updateData.nombre = name;
    if (email && user.email !== email) updateData.email = email;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // Crear postulación
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

    res.status(201).json({
      message: "✅ Postulación creada correctamente",
      application,
    });
  } catch (error) {
    console.error("❌ Error creando postulación:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 🟣 Empresa ve las postulaciones a sus proyectos
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

    // 🔥 FIX: siempre extrae nombre/email del mensaje si el usuario no los tiene
    const formatted = applications.map((a) => {
      let name = a.user?.nombre;
      let email = a.user?.email;

      if ((!name || !email) && a.message?.includes("Postulación de")) {
        const match = a.message.match(/Postulación de (.+?) \((.+?)\)/);
        if (match) {
          name = match[1];
          email = match[2];
        }
      }

      return {
        id: a.id,
        projectTitle: a.project.title,
        applicantName: name || "Sin nombre",
        applicantEmail: email || "Email no disponible",
        createdAt: a.createdAt,
        status: a.status,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error obteniendo postulaciones de empresa:", error);
    res.status(500).json({ message: "Error obteniendo postulaciones" });
  }
};

// 🟣 Actualizar estado
export const updateApplicationStatusController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: "Falta el nuevo estado" });

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
