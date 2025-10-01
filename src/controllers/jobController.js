import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} from "../services/jobService.js";

export async function createJobController(req, res) {
  try {
    const job = await createJob(req.body);
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Error creando trabajo" });
  }
}

export async function getJobsController(req, res) {
  try {
    const jobs = await getAllJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo trabajos" });
  }
}

export async function getJobByIdController(req, res) {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: "Trabajo no encontrado" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo trabajo" });
  }
}

export async function updateJobController(req, res) {
  try {
    const job = await updateJob(req.params.id, req.body);
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando trabajo" });
  }
}

export async function deleteJobController(req, res) {
  try {
    await deleteJob(req.params.id);
    res.json({ message: "Trabajo eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando trabajo" });
  }
}