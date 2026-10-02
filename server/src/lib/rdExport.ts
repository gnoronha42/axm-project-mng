import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { RDA_ANEXO_V_FIELDS } from './rdTemplate.js';
import { RD_STEPS } from './rdPrompts.js';

type ExportClaim = {
  text: string;
  level: string;
  question: string | null;
  sources: { title: string; excerpt: string; url?: string | null }[];
};
type ExportSection = { step: string; title: string; summary: string; claims: ExportClaim[] };
type ExportReport = {
  title: string;
  enquadramento: string;
  version: number;
  projectTitle: string;
  projectClient: string;
  sections: ExportSection[];
};

function p(text: string, opts?: { bold?: boolean; size?: number; color?: string }) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [
      new TextRun({
        text,
        font: 'Calibri',
        size: opts?.size ?? 22,
        bold: opts?.bold,
        color: opts?.color,
      }),
    ],
  });
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 280, after: 160 }, children: [new TextRun({ text, font: 'Calibri' })] });
}

function claimBlocks(claim: ExportClaim) {
  const color =
    claim.level === 'COMPROVADO' ? '1A7F37' : claim.level === 'RELATADO' ? '0958D9' : claim.level === 'PLANEJADO' ? 'D4A017' : 'CF1322';
  const blocks = [
    p(`[${claim.level}] ${claim.text}`),
  ];
  if (claim.level === 'LACUNA' && claim.question) {
    blocks.push(p(`⚠ Pendente de validação — questão: ${claim.question}`, { color: '8C8C8C' }));
  }
  for (const src of claim.sources) {
    const loc = src.url ? ` · ${src.url}` : '';
    blocks.push(p(`Fonte: ${src.title}${loc}`, { size: 18, color: '595959' }));
    if (src.excerpt) blocks.push(p(`Trecho: ${src.excerpt.slice(0, 500)}`, { size: 18, color: '8C8C8C' }));
  }
  return blocks;
}

export async function buildRdDocx(report: ExportReport): Promise<Buffer> {
  const isSuframa = report.enquadramento === 'suframa';
  const templateNote = isSuframa
    ? 'Estrutura alinhada ao Anexo V do RDA (ICT credenciada Capda / Suframa).'
    : 'Template genérico da Lei de Informática — layout oficial ainda pendente de validação na Biblioteca.';

  const children: Paragraph[] = [
    heading(report.title),
    p(`Projeto: ${report.projectTitle} · Cliente: ${report.projectClient}`),
    p(`Enquadramento: ${isSuframa ? 'Suframa PD&I (Anexo V)' : 'Lei de Informática'} · Versão ${report.version}`),
    p(templateNote, { color: '8C8C8C' }),
  ];

  if (isSuframa) {
    children.push(heading('Campos do Anexo V (referência)', HeadingLevel.HEADING_2));
    for (const field of RDA_ANEXO_V_FIELDS) {
      children.push(p(`• ${field.label}`, { size: 20 }));
    }
  }

  for (const step of RD_STEPS) {
    const section = report.sections.find((s) => s.step === step.step);
    if (!section) continue;
    children.push(heading(`${step.ordinal}. ${section.title}`, HeadingLevel.HEADING_1));
    if (section.summary) children.push(p(section.summary));
    if (!section.claims.length) {
      children.push(p('Nenhuma afirmação gerada neste passo.', { color: '8C8C8C' }));
      continue;
    }
    for (const claim of section.claims) children.push(...claimBlocks(claim));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}
