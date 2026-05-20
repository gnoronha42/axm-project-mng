import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { ProjectPhase } from '../types';

export function useChecklist(projectId: string, phase?: ProjectPhase) {
  return useQuery({
    queryKey: ['checklist', projectId, phase ?? 'all'],
    queryFn: () => api.getChecklist(projectId, phase),
    enabled: !!projectId,
  });
}

export function useAddChecklistItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phase, label }: { phase: ProjectPhase; label: string }) =>
      api.addChecklistItem(projectId, phase, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', projectId] });
    },
  });
}

export function useUpdateChecklistItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: { done?: boolean; label?: string } }) =>
      api.updateChecklistItem(itemId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', projectId] });
    },
  });
}

export function useDeleteChecklistItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.deleteChecklistItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', projectId] });
    },
  });
}
