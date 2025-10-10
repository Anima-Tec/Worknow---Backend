import { prisma } from "../database/prismaClient.js";

// 🟣 Controlador: usuario se postula a un proyecto
export const applyToProjectController = async (req, res) => {
  try {
    const { name, email } = req.body;
    const projectId = Number(req.params.id);

    if (!name || !email || !projectId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Verificar si el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    // Crear la postulación
    const application = await prisma.projectApplication.create({
      data: {
        projectId,
        applicantName: name,
        applicantEmail: email,
        status: "En revisión",
      },
    });

    console.log("✅ Nueva postulación creada:", application);
    res.status(201).json(application);
  } catch (error) {
    console.error("❌ Error creando postulación:", error);
    res.status(500).json({ error: "Error al crear postulación" });
  }
};

// 🟣 Controlador: listar postulaciones de la empresa
export const listCompanyApplicationsController = async (req, res) => {
  try {
    // Ahora tomamos el ID desde la URL, no desde el token
    const companyId = Number(req.params.id);

    if (!companyId) {
      return res.status(400).json({ error: "ID de empresa inválido" });
    }

    const applications = await prisma.projectApplication.findMany({
      where: { project: { companyId } },
      include: { project: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Si no hay postulaciones
    if (!applications || applications.length === 0) {
      return res.json([]); // devolvemos array vacío, el front lo maneja
    }

    // Formateo de respuesta
    const formatted = applications.map((a) => ({
      id: a.id,
      projectTitle: a.project.title,
      applicantName: a.applicantName,
      applicantEmail: a.applicantEmail,
      status: a.status ?? "En revisión",
      createdAt: a.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error listando postulaciones:", error);
    res.status(500).json({ error: "Error listando postulaciones" });
  }
};

// 🟣 Controlador: actualizar estado de postulación (Aceptar, Rechazar, En revisión)
export const updateApplicationStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Aceptado", "Rechazado", "En revisión"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const application = await prisma.projectApplication.update({
      where: { id: Number(id) },
      data: { status },
    });

    console.log(`✅ Estado actualizado a "${status}" para la postulación ${id}`);
    res.json(application);
  } catch (error) {
    console.error("❌ Error actualizando estado:", error);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
};
