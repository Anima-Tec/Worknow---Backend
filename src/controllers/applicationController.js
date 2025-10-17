import { prisma } from "../database/prismaClient.js";

// 🟣 Usuario se postula a un proyecto
export const applyToProjectController = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user?.id;
    const { name, email } = req.body;

    console.log(`📝 Usuario ${userId} postulándose a proyecto ${projectId}`);

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
        status: "PENDIENTE",
        message: name && email ? `Postulación de ${name} (${email})` : "Postulación realizada",
      },
      include: {
        user: { select: { nombre: true, email: true } },
        project: { select: { title: true } },
      },
    });

    console.log(`✅ Postulación ${application.id} creada correctamente`);

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

    console.log(`🏢 Empresa ${companyId} viendo sus postulaciones`);

    const applications = await prisma.projectApplication.findMany({
      where: { project: { companyId: companyId } },
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

    console.log(`📋 Empresa ve ${formatted.length} postulaciones`);

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error obteniendo postulaciones de empresa:", error);
    res.status(500).json({ message: "Error obteniendo postulaciones" });
  }
};

// 🟣 Actualizar estado (PARA EMPRESAS) - VERSIÓN CORREGIDA CON LÓGICA AUTOMÁTICA
export const updateApplicationStatusController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const companyId = req.user?.id;

    console.log(`🏢 Empresa actualizando aplicación ${id} a estado: ${status}`);

    if (!status) return res.status(400).json({ message: "Falta el nuevo estado" });

    // 1. Primero obtener la aplicación para verificar permisos y datos
    const application = await prisma.projectApplication.findUnique({
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
      return res.status(404).json({ message: "Postulación no encontrada" });
    }

    // 2. Verificar que la empresa es dueña del proyecto
    if (application.project.companyId !== companyId) {
      return res.status(403).json({ message: "No autorizado para modificar esta postulación" });
    }

    let updatedApplication;

    // 3. LÓGICA PRINCIPAL: Si se acepta una, rechazar las demás automáticamente
    if (status === "ACEPTADO") {
      await prisma.$transaction(async (tx) => {
        // a) Rechazar TODAS las otras postulaciones al mismo proyecto
        await tx.projectApplication.updateMany({
          where: {
            projectId: application.projectId, // Mismo proyecto
            id: { not: id }, // Excluir la actual
            status: { not: "ACEPTADO" } // No modificar las ya aceptadas
          },
          data: { 
            status: "RECHAZADO",
            visto: false // Marcar como no leído para notificar
          }
        });

        // b) Actualizar la postulación actual a ACEPTADO
        updatedApplication = await tx.projectApplication.update({
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
      updatedApplication = await prisma.projectApplication.update({
        where: { id },
        data: { status },
        include: {
          user: { select: { nombre: true, email: true } },
          project: { select: { title: true } },
        }
      });
    }

    console.log(`✅ Empresa actualizó estado de aplicación ${id} a: ${status}`);

    res.json({ 
      message: "✅ Estado actualizado", 
      application: updatedApplication,
      autoRejected: status === "ACEPTADO" // Indicar que se rechazaron otras automáticamente
    });

  } catch (error) {
    console.error("❌ Error actualizando estado:", error);
    res.status(500).json({ message: "Error actualizando estado" });
  }
};

// 🟣 Obtener postulaciones del usuario actual
export const getMyApplicationsController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    console.log(`👤 Usuario ${userId} viendo sus postulaciones`);

    const applications = await prisma.projectApplication.findMany({
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
      projectTitle: app.project.title,
      companyName: app.project.company.nombreEmpresa,
      status: app.status,
      visto: app.visto,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    console.log(`📋 Usuario tiene ${formattedApplications.length} postulaciones`);

    res.json(formattedApplications);
  } catch (error) {
    console.error("❌ Error obteniendo mis postulaciones:", error);
    res.status(500).json({ message: "Error obteniendo postulaciones" });
  }
};

// 🟣 Marcar postulación como leída
export const markAsReadController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.id;

    console.log(`👤 Usuario ${userId} marcando como leída aplicación ${id}`);

    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const application = await prisma.projectApplication.findFirst({ where: { id, userId } });
    if (!application) return res.status(404).json({ message: "Postulación no encontrada" });

    const updated = await prisma.projectApplication.update({
      where: { id },
      data: { visto: true },
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

    const count = await prisma.projectApplication.count({
      where: {
        userId,
        visto: false,
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
export const updateMyApplicationStatusController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const userId = req.user?.id;

    console.log(`👤 Usuario ${userId} actualizando su postulación ${id} a ${status}`);

    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const application = await prisma.projectApplication.findFirst({
      where: { id, userId },
      include: { project: { include: { company: true } } },
    });

    if (!application) return res.status(404).json({ message: "Postulación no encontrada" });

    // Actualizar estado de la postulación
    const updatedApplication = await prisma.projectApplication.update({
      where: { id },
      data: { status },
    });

    // 🆕 Si marca como "Hecho", se agrega al perfil del usuario
    if (status.toUpperCase() === "HECHO") {
      console.log(`🎯 Marcando proyecto como completado: ${application.project.title}`);

      try {
        await prisma.project.update({
          where: { id: application.project.id },
          data: { isCompleted: true },
        });

        const projectDetails = await prisma.project.findUnique({
          where: { id: application.project.id },
          include: { company: true },
        });

        if (projectDetails) {
          await prisma.completedProject.create({
            data: {
              projectTitle: projectDetails.title,
              companyName: projectDetails.company.nombreEmpresa,
              description: `Proyecto completado para ${projectDetails.company.nombreEmpresa}: ${projectDetails.description}`,
              skills: JSON.stringify(projectDetails.skills) || "No especificadas",
              duration: projectDetails.duration || "No especificada",
              modality: projectDetails.modality || "No especificada",
              remuneration: projectDetails.remuneration || "No especificada",
              userId: userId,
              applicationId: id,
            },
          });

          console.log(`✅ Proyecto agregado al perfil del usuario`);
        }
      } catch (err) {
        console.error("❌ Error marcando proyecto como completado:", err);
      }
    }

    res.json({
      message: "✅ Estado de postulación actualizado",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("❌ Error actualizando estado de postulación:", error);
    res.status(500).json({ message: "Error actualizando estado de postulación" });
  }
};

// 🟣 Usuario se postula a un trabajo
export const applyToJobController = async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const userId = req.user?.id;
    const { name, email } = req.body;

    console.log(`📝 Usuario ${userId} postulándose al trabajo ${jobId}`);

    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });
    if (!jobId) return res.status(400).json({ message: "ID de trabajo requerido" });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ message: "Trabajo no encontrado" });

    const existing = await prisma.jobApplication.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (existing) return res.status(409).json({ message: "Ya te postulaste a este trabajo" });

    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobId,
        status: "PENDIENTE",
        message: name && email ? `Postulación de ${name} (${email})` : "Postulación realizada",
      },
      include: {
        user: { select: { nombre: true, email: true } },
        job: { select: { title: true } },
      },
    });

    console.log("✅ Postulación creada correctamente:", application.id);
    res.status(201).json({ message: "✅ Postulación creada correctamente", application });
  } catch (error) {
    console.error("❌ Error creando postulación de trabajo:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
// 🟣 Contar notificaciones no leídas de empresa
export const getCompanyNotificationCountController = async (req, res) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(401).json({ message: "No autorizado" });

    // ✅ Corregido: el endpoint devuelve solo el contador
    const [projectsCount, jobsCount] = await Promise.all([
      prisma.projectApplication.count({
        where: {
          project: { companyId },
          vistoCompany: false,
          status: { in: ["ACEPTADO", "HECHO"] },
        },
      }),
      prisma.jobApplication.count({
        where: {
          job: { companyId },
          vistoCompany: false,
          status: { in: ["ACEPTADO", "HECHO"] },
        },
      }),
    ]);

    const total = projectsCount + jobsCount;

    console.log(`🔔 Empresa ${companyId} tiene ${total} notificaciones no leídas`);
    res.json({ count: total }); // 🔹 solo count, no lista completa
  } catch (error) {
    console.error("❌ Error contando notificaciones para empresa:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const markCompanyApplicationsAsReadController = async (req, res) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(401).json({ message: "No autorizado" });

    // 🔁 Marcar todas como leídas
    const [updatedProjects, updatedJobs] = await Promise.all([
      prisma.projectApplication.updateMany({
        where: {
          project: { companyId },
          vistoCompany: false,
        },
        data: { vistoCompany: true },
      }),
      prisma.jobApplication.updateMany({
        where: {
          job: { companyId },
          vistoCompany: false,
        },
        data: { vistoCompany: true },
      }),
    ]);

    console.log(`✅ Empresa ${companyId} marcó ${updatedProjects.count + updatedJobs.count} como leídas`);

    res.json({
      message: "✅ Postulaciones marcadas como vistas",
      updated: updatedProjects.count + updatedJobs.count,
    });
  } catch (error) {
    console.error("❌ Error marcando postulaciones de empresa como vistas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
// 🟣 Marcar TODAS las notificaciones del usuario como leídas
export const markAllAsReadForUserController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const [updatedProjects, updatedJobs] = await Promise.all([
      prisma.projectApplication.updateMany({
        where: {
          userId,
          visto: false,
          status: { in: ["ACEPTADO", "RECHAZADO"] },
        },
        data: { visto: true },
      }),
      prisma.jobApplication.updateMany({
        where: {
          userId,
          visto: false,
          status: { in: ["ACEPTADO", "RECHAZADO"] },
        },
        data: { visto: true },
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

