import { Router } from "express";
import { createProject, getProjects, getProjectById } from "../controllers/projectController.js";

const router = Router();

// Crear un proyecto
router.post("/", createProject);

// Obtener todos los proyectos
router.get("/", getProjects);

// Obtener un proyecto específico
router.get("/:id", getProjectById);

export default router;
