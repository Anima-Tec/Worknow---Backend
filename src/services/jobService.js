import { prisma } from "../database/prismaClient.js";


export async function createJob(data) {
  return prisma.job.create({ data });
}

export async function getAllJobs() {
  return prisma.job.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobById(id) {
  return prisma.job.findUnique({ where: { id } });
}

export async function updateJob(id, data) {
  return prisma.job.update({ where: { id }, data });
}

export async function deleteJob(id) {
  return prisma.job.delete({ where: { id } });
}

