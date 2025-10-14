// src/controllers/completedProjectController.js
import { prisma } from "../database/prismaClient.js";

// 🟣 Agregar proyecto completado al perfil del usuario
export const addCompletedProjectController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { 
      projectTitle, 
      companyName, 
      description, 
      applicationId,
      skills,
      duration,
      modality,
      remuneration
    } = req.body;

    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const completedProject = await prisma.completedProject.create({
      data: {
        projectTitle,
        companyName,
        description: description || `Proyecto completado para ${companyName}`,
        skills: skills || "No especificadas",
        duration: duration || "No especificada", 
        modality: modality || "No especificada",
        remuneration: remuneration || "No especificada",
        userId,
        applicationId: applicationId || null,
      },
    });

    console.log(`✅ Proyecto agregado al perfil del usuario ${userId}: "${projectTitle}"`);

    res.status(201).json({
      message: "✅ Proyecto agregado a tu perfil",
      completedProject,
    });
  } catch (error) {
    console.error("❌ Error agregando proyecto completado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 🟣 Obtener proyectos completados del usuario
export const getMyCompletedProjectsController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const completedProjects = await prisma.completedProject.findMany({
      where: { userId },
      orderBy: { completionDate: "desc" },
    });

    console.log(`📋 Usuario ${userId} tiene ${completedProjects.length} proyectos completados`);

    res.json(completedProjects);
  } catch (error) {
    console.error("❌ Error obteniendo proyectos completados:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 🟣 Eliminar proyecto completado (opcional)
export const deleteCompletedProjectController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const projectId = Number(req.params.id);

    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    // Verificar que el proyecto pertenezca al usuario
    const project = await prisma.completedProject.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    await prisma.completedProject.delete({
      where: { id: projectId }
    });

    console.log(`🗑️ Proyecto ${projectId} eliminado del perfil del usuario ${userId}`);

    res.json({ message: "✅ Proyecto eliminado de tu perfil" });
  } catch (error) {
    console.error("❌ Error eliminando proyecto completado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};