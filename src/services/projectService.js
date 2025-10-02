import prisma from "../database/prismaClient.js";

export async function createProject(data, companyId) {
  return await prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      duration: data.duration,
      modality: data.modality,
      remuneration: data.remuneration,
      skills: data.skills,
      format: data.format,
      criteria: data.criteria,
      companyId,
    },
  });
}

export async function getProjects() {
  return await prisma.project.findMany({
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectById(id) {
  return await prisma.project.findUnique({
    where: { id },
    include: { company: true },
  });
}
