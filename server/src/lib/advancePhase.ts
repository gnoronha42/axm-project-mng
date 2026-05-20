import { prisma } from './prisma.js';
export async function advanceProjectPhase(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { phases: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!project) throw new Error('Projeto não encontrado');

  const currentIdx = project.phases.findIndex((p) => p.status === 'in_progress');
  if (currentIdx === -1) throw new Error('Nenhuma fase em andamento');

  const current = project.phases[currentIdx];
  const now = new Date();

  await prisma.projectPhaseRecord.update({
    where: { id: current.id },
    data: { status: 'completed', completedAt: now },
  });

  const next = project.phases[currentIdx + 1];
  if (next) {
    await prisma.projectPhaseRecord.update({
      where: { id: next.id },
      data: { status: 'in_progress', startedAt: next.startedAt ?? now },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { currentPhase: next.phase, updatedAt: now },
    });
  } else {
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: now },
    });
  }

  return prisma.project.findUnique({
    where: { id: projectId },
    include: { phases: { orderBy: { sortOrder: 'asc' } } },
  });
}
