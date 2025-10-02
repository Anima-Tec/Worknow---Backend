import prisma from "../database/prismaClient.js";

// Obtener todos los proyectos
export const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un proyecto por ID
export const getProjectById = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    });
    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear un nuevo proyecto
export const createProject = async (req, res) => {
  try {
    const newProject = await prisma.project.create({
      data: {
        title: req.body.title,
        description: req.body.description
      }
    });
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
