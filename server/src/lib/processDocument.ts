import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from './prisma.js';
import { bufferToText, extractWithOptionalLlm } from './ragExtract.js';
import { evaluateGlosa } from './glosaEngine.js';

const TECHNICAL_CATEGORIES = new Set(['relatorio_tecnico', 'plano_trabalho']);

export async function processDocumentIntelligence(documentId: string, uploadDir: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { project: true },
  });
  if (!doc) return;

  const shouldRun = TECHNICAL_CATEGORIES.has(doc.category) || /\.pdf$/i.test(doc.name);
  if (!shouldRun) return;

  const extraction = await prisma.documentExtraction.upsert({
    where: { documentId: doc.id },
    update: { status: 'pending', error: null },
    create: {
      documentId: doc.id,
      projectId: doc.projectId,
      status: 'pending',
      model: 'pending',
    },
  });

  try {
    const fullPath = path.join(uploadDir, doc.storagePath);
    const buffer = await readFile(fullPath);
    const text = bufferToText(buffer, doc.mimeType, doc.name);
    const result = await extractWithOptionalLlm(text);

    await prisma.documentExtraction.update({
      where: { id: extraction.id },
      data: {
        status: 'done',
        model: result.model,
        activitiesJson: JSON.stringify(result.activities),
        timesheetJson: JSON.stringify(result.timesheet),
        expensesJson: JSON.stringify(result.expenses),
        rawPreview: result.rawPreview,
        error: null,
      },
    });

    await prisma.glosaRisk.deleteMany({ where: { documentId: doc.id } });
    const findings = evaluateGlosa(result, doc.project.description);
    if (findings.length) {
      await prisma.glosaRisk.createMany({
        data: findings.map((f) => ({
          projectId: doc.projectId,
          documentId: doc.id,
          code: f.code,
          severity: f.severity,
          message: f.message,
          detailsJson: JSON.stringify(f.details),
        })),
      });
    }
  } catch (err) {
    await prisma.documentExtraction.update({
      where: { id: extraction.id },
      data: {
        status: 'failed',
        error: err instanceof Error ? err.message : 'Falha na extração',
      },
    });
  }
}
