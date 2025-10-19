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
    console.log("🚀 === INICIO OBTENER PROYECTOS COMPLETADOS ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);

    const userId = req.user?.id;
    if (!userId) {
      console.warn("⚠️ No hay userId en el token");
      return res.status(401).json({ 
        success: false,
        message: "Usuario no autenticado" 
      });
    }

    console.log("✅ UserId validado:", userId);

    // Verificar conexión a la base de datos
    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma completedProject:", !!prisma?.completedProject);

    const completedProjects = await prisma.completedProject.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    console.log("📊 Proyectos completados encontrados:", completedProjects.length);
    console.log("📋 Proyectos completados raw:", completedProjects);

    console.log(`📋 Usuario ${userId} tiene ${completedProjects.length} proyectos completados`);
    console.log("🏁 === FIN OBTENER PROYECTOS COMPLETADOS ===");

    return res.status(200).json({
      success: true,
      data: completedProjects
    });
  } catch (error) {
    console.error("❌ === ERROR OBTENER PROYECTOS COMPLETADOS ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : "Algo salió mal al obtener proyectos completados"
    });
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