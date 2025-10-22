import { prisma } from "../database/prismaClient.js";

// 🟣 Usuario se postula a un proyecto
export const applyToProjectController = async (req, res) => {
  try {
    console.log("🚀 === INICIO APLICAR A PROYECTO ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);
    console.log("📦 Datos del body:", req.body);
    console.log("📋 Params:", req.params);

    const projectId = Number(req.params.id || req.params.projectId);
    const userId = req.user?.id;
    const { name, email } = req.body;

    console.log("✅ Datos extraídos:", { userId, projectId, name, email });

    if (!userId) {
      console.warn("⚠️ Usuario no autenticado");
      return res.status(401).json({ 
        success: false,
        message: "Usuario no autenticado" 
      });
    }
    if (!projectId) {
      console.warn("⚠️ ID de proyecto requerido");
      return res.status(400).json({ 
        success: false,
        message: "ID de proyecto requerido" 
      });
    }

    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma project:", !!prisma?.project);
    console.log("📊 Prisma application:", !!prisma?.application);

    // Verificar que el proyecto exista
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      console.warn("❌ Proyecto no encontrado:", projectId);
      return res.status(404).json({ 
        success: false,
        message: "Proyecto no encontrado" 
      });
    }

    console.log("✅ Proyecto encontrado:", project.title);

    // Evitar duplicados
    const existing = await prisma.application.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (existing) {
      console.warn("❌ Ya existe postulación:", { userId, projectId });
      return res.status(409).json({ 
        success: false,
        message: "Ya te postulaste a este proyecto" 
      });
    }

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
    console.log("💾 Creando postulación en la base de datos...");
    const application = await prisma.application.create({
      data: {
        userId,
        projectId,
        status: "PENDIENTE",
      },
      include: {
        user: { select: { nombre: true, email: true } },
        project: { select: { title: true } },
      },
    });

    console.log("✅ Postulación creada:", application);
    console.log(`✅ Postulación ${application.id} creada correctamente`);
    console.log("🏁 === FIN APLICAR A PROYECTO ===");

    return res.status(201).json({
      success: true,
      message: "Postulación creada correctamente",
      data: application,
    });
  } catch (error) {
    console.error("❌ === ERROR APLICAR A PROYECTO ===");
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

// 🟣 Empresa ve SOLO las postulaciones a sus proyectos
export const getCompanyApplicationsController = async (req, res) => {
  try {
    console.log("🚀 === INICIO OBTENER APLICACIONES DE PROYECTOS DE EMPRESA ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);

    const companyId = req.user?.id;
    if (!companyId) {
      console.warn("⚠️ No hay companyId en el token");
      return res.status(401).json({ 
        success: false,
        message: "No autorizado" 
      });
    }

    console.log("✅ CompanyId validado:", companyId);

    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma application:", !!prisma?.application);

    // Obtener SOLO aplicaciones de proyectos de la empresa autenticada
    const projectApplications = await prisma.application.findMany({
      where: { 
        project: { 
          companyId: companyId 
        } 
      },
      include: {
        project: { select: { title: true } },
        user: { select: { nombre: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    
    console.log("📊 Aplicaciones de proyectos encontradas:", projectApplications.length);

    // Formatear aplicaciones de proyectos con estructura requerida
    const formattedApplications = projectApplications.map((app) => ({
      id: app.id,
      status: app.status,
      createdAt: app.createdAt,
      applicantName: app.user?.nombre || "Sin nombre",
      applicantEmail: app.user?.email || "Email no disponible",
      projectId: app.projectId,
      projectTitle: app.project.title,
    }));

    console.log(`📋 Total de aplicaciones de proyectos: ${formattedApplications.length}`);
    console.log("🏁 === FIN OBTENER APLICACIONES DE PROYECTOS DE EMPRESA ===");

    return res.status(200).json({
      success: true,
      message: "Aplicaciones de proyectos obtenidas correctamente",
      data: formattedApplications
    });
  } catch (error) {
    console.error("❌ === ERROR OBTENER APLICACIONES DE PROYECTOS DE EMPRESA ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : "Error interno"
    });
  }
};

// 🟣 Empresa ve SOLO las postulaciones a sus trabajos
export const getCompanyJobApplicationsController = async (req, res) => {
  try {
    console.log("🚀 === INICIO OBTENER APLICACIONES DE TRABAJOS DE EMPRESA ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);

    const companyId = req.user?.id;
    if (!companyId) {
      console.warn("⚠️ No hay companyId en el token");
      return res.status(401).json({ 
        success: false,
        message: "No autorizado" 
      });
    }

    console.log("✅ CompanyId validado:", companyId);

    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma jobApplication:", !!prisma?.jobApplication);

    // Obtener SOLO aplicaciones de trabajos de la empresa autenticada
    const jobApplications = await prisma.jobApplication.findMany({
      where: { 
        job: { 
          companyId: companyId 
        } 
      },
      include: {
        job: { select: { title: true } },
        user: { select: { nombre: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("📊 Aplicaciones de trabajos encontradas:", jobApplications.length);

    // Formatear aplicaciones de trabajos con estructura requerida
    const formattedApplications = jobApplications.map((app) => ({
      id: app.id,
      status: app.status,
      createdAt: app.createdAt,
      applicantName: app.user?.nombre || "Sin nombre",
      applicantEmail: app.user?.email || "Email no disponible",
      jobId: app.jobId,
      jobTitle: app.job.title,
    }));

    console.log(`📋 Total de aplicaciones de trabajos: ${formattedApplications.length}`);
    console.log("🏁 === FIN OBTENER APLICACIONES DE TRABAJOS DE EMPRESA ===");

    return res.status(200).json({
      success: true,
      message: "Aplicaciones de trabajos obtenidas correctamente",
      data: formattedApplications
    });
  } catch (error) {
    console.error("❌ === ERROR OBTENER APLICACIONES DE TRABAJOS DE EMPRESA ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : "Error interno"
    });
  }
};

// 🟣 Empresa ve las postulaciones a sus proyectos Y trabajos (COMBINADO - OBSOLETO)
export const getCompanyApplicationsControllerCombined = async (req, res) => {
  try {
    console.log("🚀 === INICIO OBTENER APLICACIONES DE EMPRESA ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);

    const companyId = req.user?.id;
    if (!companyId) {
      console.warn("⚠️ No hay companyId en el token");
      return res.status(401).json({ 
        success: false,
        message: "No autorizado" 
      });
    }

    console.log("✅ CompanyId validado:", companyId);

    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma application:", !!prisma?.application);
    console.log("📊 Prisma jobApplication:", !!prisma?.jobApplication);

    // Obtener aplicaciones de proyectos Y trabajos
    const [projectApplications, jobApplications] = await Promise.all([
      prisma.application.findMany({
        where: { project: { companyId: companyId } },
        include: {
          project: { select: { title: true } },
          user: { select: { nombre: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.jobApplication.findMany({
        where: { job: { companyId: companyId } },
        include: {
          job: { select: { title: true } },
          user: { select: { nombre: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    ]);

    console.log("📊 Aplicaciones de proyectos encontradas:", projectApplications.length);
    console.log("📊 Aplicaciones de trabajos encontradas:", jobApplications.length);

    // Formatear aplicaciones de proyectos (mantener estructura original)
    const formattedProjects = projectApplications.map((a) => ({
        id: a.id,
        projectTitle: a.project.title,
      applicantName: a.user?.nombre || "Sin nombre",
      applicantEmail: a.user?.email || "Email no disponible",
      createdAt: a.createdAt,
      status: a.status,
      type: "project", // Campo para identificar el tipo
    }));

    // Formatear aplicaciones de trabajos (mantener estructura original)
    const formattedJobs = jobApplications.map((a) => ({
      id: a.id,
      projectTitle: a.job.title, // Usar projectTitle para mantener compatibilidad
      applicantName: a.user?.nombre || "Sin nombre",
      applicantEmail: a.user?.email || "Email no disponible",
        createdAt: a.createdAt,
        status: a.status,
      type: "job", // Campo para identificar el tipo
    }));

    // Combinar y ordenar por fecha
    const allApplications = [...formattedProjects, ...formattedJobs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`📋 Total de aplicaciones: ${allApplications.length} (${formattedProjects.length} proyectos + ${formattedJobs.length} trabajos)`);
    console.log("🏁 === FIN OBTENER APLICACIONES DE EMPRESA ===");

    // Devolver en formato original para mantener compatibilidad
    return res.status(200).json(allApplications);
  } catch (error) {
    console.error("❌ === ERROR OBTENER APLICACIONES DE EMPRESA ===");
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

// 🟣 Actualizar estado (PARA EMPRESAS) - VERSIÓN CORREGIDA CON LÓGICA AUTOMÁTICA
export const updateApplicationStatusController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const companyId = req.user?.id;

    console.log(`🏢 Empresa actualizando aplicación ${id} a estado: ${status}`);

    if (!status) return res.status(400).json({ 
      success: false,
      message: "Falta el nuevo estado" 
    });

    // 1. Primero obtener la aplicación para verificar permisos y datos
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            companyId: true,
            title: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ 
        success: false,
        message: "Postulación no encontrada" 
      });
    }

    // 2. Verificar que la empresa es dueña del proyecto
    if (application.project.companyId !== companyId) {
      return res.status(403).json({ 
        success: false,
        message: "No autorizado para modificar esta postulación" 
      });
    }

    // 3. VALIDACIÓN ESTRICTA: Solo permitir cambios si está PENDIENTE o EN_REVISION
    if (application.status !== "PENDIENTE" && application.status !== "EN_REVISION") {
      console.warn("❌ Intento de modificar aplicación en estado final:", id, application.status);
      return res.status(400).json({ 
        success: false,
        message: `No se puede modificar una postulación que está ${application.status === "ACEPTADO" ? "aceptada" : "rechazada"}. Solo se pueden modificar postulaciones pendientes o en revisión.` 
      });
    }

    let updatedApplication;

    // 3. LÓGICA PRINCIPAL: Si se acepta una, rechazar las demás automáticamente
    if (status === "ACEPTADO") {
      await prisma.$transaction(async (tx) => {
        // a) Rechazar TODAS las otras postulaciones al mismo proyecto
        await tx.application.updateMany({
          where: {
            projectId: application.projectId, // Mismo proyecto
            id: { not: id }, // Excluir la actual
            status: { not: "ACEPTADO" } // No modificar las ya aceptadas
          },
          data: { 
            status: "RECHAZADO"
          }
        });

        // b) Actualizar la postulación actual a ACEPTADO
        updatedApplication = await tx.application.update({
          where: { id },
          data: { status },
          include: {
            user: { select: { nombre: true, email: true } },
            project: { select: { title: true } },
          }
        });
      });

      console.log(`✅ Aceptada postulación ${id} y RECHAZADAS automáticamente las demás del proyecto ${application.projectId}`);

    } else {
      // Para otros estados (RECHAZADO, PENDIENTE), solo actualizar esta postulación
      updatedApplication = await prisma.application.update({
        where: { id },
        data: { status },
        include: {
          user: { select: { nombre: true, email: true } },
          project: { select: { title: true } },
        }
      });
    }

    console.log(`✅ Empresa actualizó estado de aplicación ${id} a: ${status}`);

    return res.status(200).json({ 
      success: true,
      message: "Estado de postulación actualizado correctamente",
      data: updatedApplication
    });

  } catch (error) {
    console.error("❌ Error actualizando estado:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : "Error interno"
    });
  }
};

// 🟣 Obtener postulaciones del usuario actual
export const getMyApplicationsController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    console.log(`👤 Usuario ${userId} viendo sus postulaciones`);

    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            company: { select: { nombreEmpresa: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      createdAt: app.createdAt,
      projectTitle: app.project.title,
      companyName: app.project.company.nombreEmpresa,
    }));

    console.log(`📋 Usuario tiene ${formattedApplications.length} postulaciones`);

    return res.status(200).json({
      success: true,
      message: "Postulaciones obtenidas correctamente",
      data: formattedApplications
    });
  } catch (error) {
    console.error("❌ Error obteniendo mis postulaciones:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : "Error interno"
    });
  }
};


// 🟣 Marcar postulación como leída
export const markAsReadController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.id;

    console.log(`👤 Usuario ${userId} marcando como leída aplicación ${id}`);

    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const application = await prisma.application.findFirst({ where: { id, userId } });
    if (!application) return res.status(404).json({ message: "Postulación no encontrada" });

    const updated = await prisma.application.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    console.log(`✅ Aplicación ${id} marcada como leída`);
    res.json({ message: "✅ Postulación marcada como leída", application: updated });
  } catch (error) {
    console.error("❌ Error marcando como leído:", error);
    res.status(500).json({ message: "Error marcando como leído" });
  }
};

// 🟣 Contar notificaciones no leídas
export const getNotificationCountController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const count = await prisma.application.count({
      where: {
        userId,
        status: { in: ["ACEPTADO", "RECHAZADO"] },
      },
    });

    console.log(`🔔 Usuario ${userId} tiene ${count} notificaciones no leídas`);
    res.json({ count });
  } catch (error) {
    console.error("❌ Error contando notificaciones:", error);
    res.status(500).json({ message: "Error contando notificaciones" });
  }
};

// 🟣 Usuario actualiza su propia postulación (Hecho/No hecho)
// 🟣 Usuario actualiza su propia postulación (Hecho/No hecho) - VERSIÓN CORREGIDA
export const updateMyApplicationStatusController = async (req, res) => {
  try {
    console.log("🚀 === INICIO ACTUALIZAR ESTADO POSTULACIÓN USUARIO ===");
    const id = Number(req.params.id);
    const { status } = req.body;
    const userId = req.user?.id;

    console.log(`👤 Usuario ${userId} actualizando su postulación ${id} a ${status}`);

    // Validaciones básicas
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Falta el nuevo estado"
      });
    }

    // Validar que el estado sea válido
    if (status !== "HECHO" && status !== "NO_HECHO") {
      return res.status(400).json({
        success: false,
        message: "Estado inválido. Solo se permiten estados 'HECHO' o 'NO_HECHO'"
      });
    }

    // Obtener la aplicación con datos del proyecto y empresa
    const application = await prisma.application.findFirst({
      where: { id, userId },
      include: { 
        project: { 
          include: { 
            company: true 
          } 
        } 
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Postulación no encontrada"
      });
    }

    // Verificar que la postulación esté en estado ACEPTADO
    if (application.status !== "ACEPTADO") {
      return res.status(400).json({
        success: false,
        message: "Solo se puede actualizar el estado de postulaciones que están ACEPTADAS"
      });
    }

    // Actualizar estado de la postulación
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
    });

    // 🆕 LÓGICA CORREGIDA: Si marca como "Hecho", se agrega al perfil del usuario
    if (status.toUpperCase() === "HECHO") {
      console.log(`🎯 Marcando proyecto como completado: ${application.project.title}`);

      try {
        // Verificar si ya existe en completedProjects para evitar duplicados
        const existingCompleted = await prisma.completedProject.findFirst({
          where: {
            userId: userId,
            projectId: application.project.id
          }
        });

        if (!existingCompleted) {
          // Crear el proyecto completado con todos los datos
          await prisma.completedProject.create({
            data: {
              title: application.project.title,
              description: application.project.description,
              skills: application.project.skills,
              duration: application.project.duration,
              modality: application.project.modality,
              remuneration: application.project.remuneration,
              companyName: application.project.company.nombreEmpresa,
              userId: userId,
              projectId: application.project.id,
              startDate: application.createdAt, // Fecha de postulación como inicio
              endDate: new Date() // Fecha actual como finalización
            },
          });

          console.log(`✅ Proyecto "${application.project.title}" agregado al perfil del usuario`);
        } else {
          console.log(`ℹ️ Proyecto ya estaba en completedProjects`);
        }

      } catch (err) {
        console.error("❌ Error creando completed project:", err);
        // No devolver error al usuario, solo log
      }
    }

    // 🆕 LÓGICA: Si cambia a "NO_HECHO", eliminar de completedProjects
    if (status.toUpperCase() === "NO_HECHO") {
      console.log(`🗑️ Eliminando proyecto de completados: ${application.project.title}`);
      
      try {
        await prisma.completedProject.deleteMany({
          where: {
            userId: userId,
            projectId: application.project.id
          }
        });
        
        console.log(`✅ Proyecto eliminado de completados`);
      } catch (err) {
        console.error("❌ Error eliminando de completed projects:", err);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Estado actualizado correctamente",
      data: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        updatedAt: updatedApplication.updatedAt
      }
    });
  } catch (error) {
    console.error("❌ Error actualizando estado de postulación:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : "Error interno"
    });
  }
};

// 🟣 Usuario se postula a un trabajo
export const applyToJobController = async (req, res) => {
  try {
    console.log("🚀 === INICIO APLICAR A TRABAJO ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);
    console.log("📦 Datos del body:", req.body);
    console.log("📋 Params:", req.params);

    // Manejar ambos casos: /job/:id/apply y /job-applications/:jobId
    const jobId = Number(req.params.id || req.params.jobId);
    const userId = req.user?.id;
    const { name, email } = req.body;

    console.log("✅ Datos extraídos:", { userId, jobId, name, email });

    // Validaciones básicas
    if (!userId) {
      console.warn("⚠️ Usuario no autenticado");
      return res.status(401).json({ 
        success: false,
        message: "Usuario no autenticado" 
      });
    }

    if (!jobId) {
      console.warn("⚠️ ID de trabajo requerido");
      return res.status(400).json({ 
        success: false,
        message: "ID de trabajo requerido" 
      });
    }

    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma job:", !!prisma?.job);
    console.log("📊 Prisma jobApplication:", !!prisma?.jobApplication);

    // Verificar que el trabajo exista y pertenezca a una empresa
    const job = await prisma.job.findUnique({ 
      where: { id: jobId },
      include: {
        company: { select: { id: true, nombreEmpresa: true } }
      }
    });
    
    if (!job) {
      console.warn("❌ Trabajo no encontrado:", jobId);
      return res.status(404).json({ 
        success: false,
        message: "Trabajo no encontrado" 
      });
    }

    console.log("✅ Trabajo encontrado:", job.title, "Empresa:", job.company.nombreEmpresa);

    // Validar constraint único [userId, jobId] - evitar duplicados
    const existing = await prisma.jobApplication.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    
    if (existing) {
      console.warn("❌ Ya existe postulación:", { userId, jobId });
      return res.status(409).json({ 
        success: false,
        message: "Ya te postulaste a este trabajo" 
      });
    }

    // Actualizar nombre/email del usuario si se proporcionan
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

    // Crear postulación con status PENDIENTE
    console.log("💾 Creando postulación en la base de datos...");
    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobId,
        status: "PENDIENTE",
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      }
    });

    console.log("✅ Postulación creada:", application);
    console.log(`✅ Postulación ${application.id} creada correctamente`);
    console.log("🏁 === FIN APLICAR A TRABAJO ===");

    return res.status(201).json({
      success: true,
      message: "Postulación enviada correctamente",
      data: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt
      }
    });

  } catch (error) {
    console.error("❌ === ERROR APLICAR A TRABAJO ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : "Error interno"
    });
  }
};
// 🟣 Contar notificaciones no leídas de empresa
export const getCompanyNotificationCountController = async (req, res) => {
  try {
    console.log("🚀 === INICIO CONTAR NOTIFICACIONES EMPRESA ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);

    const companyId = req.user?.id;
    if (!companyId) {
      console.warn("⚠️ No hay companyId en el token");
      return res.status(401).json({ 
        success: false,
        message: "No autorizado" 
      });
    }

    console.log("✅ CompanyId validado:", companyId);

    // Verificar conexión a la base de datos
    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma projectApplication:", !!prisma?.projectApplication);
    console.log("📊 Prisma jobApplication:", !!prisma?.jobApplication);

    // Contar postulaciones pendientes (que son las "notificaciones" para la empresa)
    const [projectsCount, jobsCount] = await Promise.all([
      prisma.application.count({
        where: {
          project: { companyId },
          status: "PENDIENTE",
        },
      }),
      prisma.jobApplication.count({
        where: {
          job: { companyId },
          status: "PENDIENTE",
        },
      }),
    ]);

    const total = projectsCount + jobsCount;

    console.log(`🔔 Empresa ${companyId} tiene ${total} notificaciones (${projectsCount} proyectos + ${jobsCount} trabajos)`);
    console.log("🏁 === FIN CONTAR NOTIFICACIONES EMPRESA ===");

    return res.status(200).json({
      success: true,
      count: total,
      projectsCount,
      jobsCount
    });
  } catch (error) {
    console.error("❌ === ERROR CONTAR NOTIFICACIONES EMPRESA ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : "Algo salió mal al contar notificaciones"
    });
  }
};

export const markCompanyApplicationsAsReadController = async (req, res) => {
  try {
    console.log("🚀 === INICIO MARCAR NOTIFICACIONES COMO LEÍDAS ===");
    
    const companyId = req.user?.id;
    if (!companyId) {
      console.warn("⚠️ No hay companyId en el token");
      return res.status(401).json({ 
        success: false,
        message: "No autorizado" 
      });
    }

    console.log("✅ CompanyId validado:", companyId);

    // Como no tenemos campo vistoCompany, simplemente devolvemos éxito
    // En una implementación futura se podría agregar este campo al schema
    console.log(`✅ Empresa ${companyId} marcó notificaciones como leídas`);

    return res.status(200).json({
      success: true,
      message: "✅ Notificaciones marcadas como vistas",
      updated: 0 // Por ahora no hay campo para marcar como leídas
    });
  } catch (error) {
    console.error("❌ Error marcando notificaciones como vistas:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// 🟣 Actualizar estado de aplicación de trabajo (PARA EMPRESAS) - USANDO LÓGICA DE PROYECTOS
export const updateJobApplicationStatusController = async (req, res) => {
  try {
    console.log("🚀 === INICIO ACTUALIZAR ESTADO APLICACIÓN TRABAJO ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);
    console.log("📦 Datos del body:", req.body);
    console.log("📋 Params:", req.params);

    const id = Number(req.params.id);
    const { status } = req.body;
    const companyId = req.user?.id;

    console.log("✅ Datos extraídos:", { id, status, companyId });

    if (!status) {
      console.warn("⚠️ Falta el nuevo estado");
      return res.status(400).json({ 
        success: false,
        message: "Falta el nuevo estado" 
      });
    }

    console.log("🔌 Verificando conexión a Prisma...");
    console.log("📊 Prisma client:", !!prisma);
    console.log("📊 Prisma jobApplication:", !!prisma?.jobApplication);

    // 1. Primero obtener la aplicación para verificar permisos y datos
    const jobApplication = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            companyId: true,
            title: true
          }
        }
      }
    });

    if (!jobApplication) {
      console.warn("❌ Aplicación de trabajo no encontrada:", id);
      return res.status(404).json({ 
        success: false,
        message: "Aplicación de trabajo no encontrada" 
      });
    }

    console.log("✅ Aplicación de trabajo encontrada:", jobApplication.job.title);

    // 2. Verificar que la empresa es dueña del trabajo
    if (jobApplication.job.companyId !== companyId) {
      console.warn("❌ No autorizado para modificar esta aplicación:", { id, companyId, jobCompanyId: jobApplication.job.companyId });
      return res.status(403).json({ 
        success: false,
        message: "No autorizado para modificar esta aplicación" 
      });
    }

    // 3. VALIDACIÓN ESTRICTA: Solo permitir cambios si está PENDIENTE
    if (jobApplication.status !== "PENDIENTE") {
      console.warn("❌ Intento de modificar aplicación no pendiente:", id, jobApplication.status);
      return res.status(400).json({ 
        success: false,
        message: `No se puede modificar una postulación que está ${jobApplication.status === "ACEPTADO" ? "aceptada" : "rechazada"}. Solo se pueden modificar postulaciones pendientes.` 
      });
    }

    let updatedApplication;

    // 4. LÓGICA PRINCIPAL: Si se acepta una, rechazar las demás automáticamente
    if (status === "ACEPTADO") {
      console.log("🔄 Aceptando aplicación y rechazando las demás...");
      await prisma.$transaction(async (tx) => {
        // a) Rechazar TODAS las otras aplicaciones al mismo trabajo
        await tx.jobApplication.updateMany({
        where: {
            jobId: jobApplication.jobId, // Mismo trabajo
            id: { not: id }, // Excluir la actual
            status: { not: "ACEPTADO" } // No modificar las ya aceptadas
          },
          data: { 
            status: "RECHAZADO"
          }
        });

        // b) Actualizar la aplicación actual a ACEPTADO
        updatedApplication = await tx.jobApplication.update({
          where: { id },
          data: { status },
          include: {
            user: { select: { nombre: true, email: true } },
            job: { select: { title: true } },
          }
        });
      });

      console.log(`✅ Aceptada aplicación ${id} y RECHAZADAS automáticamente las demás del trabajo ${jobApplication.jobId}`);

    } else {
      // Para otros estados (RECHAZADO, PENDIENTE), solo actualizar esta aplicación
      console.log("🔄 Actualizando aplicación individual...");
      updatedApplication = await prisma.jobApplication.update({
        where: { id },
        data: { status },
        include: {
          user: { select: { nombre: true, email: true } },
          job: { select: { title: true } },
        }
      });
    }

    console.log("✅ Aplicación de trabajo actualizada:", updatedApplication);
    console.log("🏁 === FIN ACTUALIZAR ESTADO APLICACIÓN TRABAJO ===");

    return res.status(200).json({
      success: true,
      message: "Estado de aplicación actualizado correctamente",
      data: updatedApplication
    });

  } catch (error) {
    console.error("❌ === ERROR ACTUALIZAR ESTADO APLICACIÓN TRABAJO ===");
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
// 🟣 Marcar TODAS las notificaciones del usuario como leídas
export const markAllAsReadForUserController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const [updatedProjects, updatedJobs] = await Promise.all([
      prisma.application.updateMany({
        where: {
          userId,
          status: { in: ["ACEPTADO", "RECHAZADO"] },
        },
        data: { updatedAt: new Date() },
      }),
      prisma.jobApplication.updateMany({
        where: {
          userId,
          status: { in: ["ACEPTADO", "RECHAZADO"] },
        },
        data: { updatedAt: new Date() },
      }),
    ]);

    const total = updatedProjects.count + updatedJobs.count;

    console.log(`✅ Usuario ${userId} marcó ${total} notificaciones como leídas`);
    res.json({ message: "✅ Notificaciones marcadas como leídas", updated: total });
  } catch (error) {
    console.error("❌ Error marcando notificaciones de usuario como leídas:", error);
    res.status(500).json({ message: "Error marcando notificaciones" });
  }
};

