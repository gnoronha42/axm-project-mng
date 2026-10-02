import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useRdList(projectId?: string) {
  return useQuery({
    queryKey: ['rd-list', projectId ?? 'all'],
    queryFn: () => api.listRdReports(projectId),
  });
}

export function useRdReport(id?: string) {
  return useQuery({
    queryKey: ['rd', id],
    queryFn: () => api.getRdReport(id!),
    enabled: !!id,
  });
}

export function useCreateRd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId: string; enquadramento: string; title?: string }) =>
      api.createRdReport(input.projectId, { enquadramento: input.enquadramento, title: input.title }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['rd-list'] });
      qc.setQueryData(['rd', data.id], data);
    },
  });
}

export function useGenerateRdStep(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { step: string; notes?: string; researchQuery?: string }) =>
      api.generateRdStep(id, input.step, { notes: input.notes, researchQuery: input.researchQuery }),
    onSuccess: (data) => {
      qc.setQueryData(['rd', id], data);
      qc.invalidateQueries({ queryKey: ['rd-list'] });
    },
  });
}

export function usePatchRdClaim(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { claimId: string; text?: string; level?: string; approved?: boolean; question?: string | null }) =>
      api.patchRdClaim(id, input.claimId, input),
    onSuccess: (data) => qc.setQueryData(['rd', id], data),
  });
}
