import { prisma } from "../database/prismaClient.js";

// =====================================================
// 🟣 USUARIO SE POSTULA A UN TRABAJO
// =====================================================
export const applyToJobController = async (req, res) => {
  try {
    // Manejar ambos casos: /job/:id/apply y /:jobId
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

    // Verificar que el trabajo exista y pertenezca a una empresa
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { 
        company: { select: { id: true, nombreEmpresa: true } }
      },
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
    console.log("🚀 === INICIO ACTUALIZAR ESTADO APLICACIÓN TRABAJO ===");
    const id = Number(req.params.id);
    const { status } = req.body;
    const companyId = req.user?.id;

    console.log(`🏢 Empresa actualizando aplicación de trabajo ${id} a estado: ${status}`);

    if (!status) {
      return res.status(400).json({ 
        success: false,
        message: "Falta el nuevo estado" 
      });
    }

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
      return res.status(404).json({ 
        success: false,
        message: "Aplicación de trabajo no encontrada" 
      });
    }

    // 2. Verificar que la empresa es dueña del trabajo
    if (jobApplication.job.companyId !== companyId) {
      return res.status(403).json({ 
        success: false,
        message: "No autorizado para modificar esta aplicación" 
      });
    }

    // 3. VALIDACIÓN ESTRICTA: Solo permitir cambios si está PENDIENTE o EN_REVISION
    if (jobApplication.status !== "PENDIENTE" && jobApplication.status !== "EN_REVISION") {
      console.warn("❌ Intento de modificar aplicación en estado final:", id, jobApplication.status);
      return res.status(400).json({ 
        success: false,
        message: `No se puede modificar una postulación que está ${jobApplication.status === "ACEPTADO" ? "aceptada" : "rechazada"}. Solo se pueden modificar postulaciones pendientes o en revisión.` 
      });
    }

    // 4. Actualizar la aplicación con transacción si es ACEPTADO
    let updatedApplication;
    if (status === "ACEPTADO") {
      // Usar transacción para rechazar otras aplicaciones al mismo trabajo
      await prisma.$transaction(async (tx) => {
        // Rechazar todas las demás aplicaciones al mismo trabajo
        await tx.jobApplication.updateMany({
          where: {
            jobId: jobApplication.jobId,
            id: { not: id },
            status: { not: "ACEPTADO" }
          },
          data: { status: "RECHAZADO" }
        });

        // Actualizar la aplicación seleccionada
        updatedApplication = await tx.jobApplication.update({
          where: { id },
          data: { status },
          include: {
            user: { select: { nombre: true, email: true } },
            job: { select: { title: true } }
          }
        });
      });
    } else {
      // Para otros estados, actualizar directamente
      updatedApplication = await prisma.jobApplication.update({
        where: { id },
        data: { status },
        include: {
          user: { select: { nombre: true, email: true } },
          job: { select: { title: true } }
        }
      });
    }

    console.log("✅ Estado de aplicación actualizado correctamente");
    return res.status(200).json({
      success: true,
      message: "Estado de aplicación actualizado correctamente",
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
      status: a.status,
      createdAt: a.createdAt,
      jobTitle: a.job?.title || "Trabajo sin título",
      companyName: a.job?.company?.nombreEmpresa || "Desconocida",
    }));

    return res.status(200).json({
      success: true,
      message: "Postulaciones a trabajos obtenidas correctamente",
      data: formatted
    });
  } catch (error) {
    console.error("❌ Error obteniendo postulaciones de usuario:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : "Error interno"
    });
  }
};
