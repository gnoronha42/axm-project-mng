import type { RhNivel } from '../../types';

export const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export const VINCULO_OPTIONS = [
  { value: 'interno', label: 'Interno' },
  { value: 'externo', label: 'Externo' },
  { value: 'intercambio', label: 'Intercâmbio' },
];

export function brl(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const NIVEL_COLOR: Record<RhNivel, string> = {
  COMPROVADO: 'green',
  RELATADO: 'blue',
  LACUNA: 'red',
};

export const RECON_LABEL: Record<string, { color: string; text: string }> = {
  matched: { color: 'green', text: 'Conferido' },
  divergent: { color: 'red', text: 'Divergente' },
  pending: { color: 'default', text: 'Pendente' },
};
