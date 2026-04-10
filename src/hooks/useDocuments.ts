import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Comment } from '../types';

export function useDocuments(projectId: string) {
  return useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => api.getDocuments(projectId),
    enabled: !!projectId,
  });
}

export function useAllDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: api.getAllDocuments,
  });
}

export function useComments(projectId: string) {
  return useQuery({
    queryKey: ['comments', projectId],
    queryFn: () => api.getComments(projectId),
    enabled: !!projectId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comment: Omit<Comment, 'id' | 'createdAt'>) => api.addComment(comment),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.projectId] });
    },
  });
}

export function useReports(projectId: string) {
  return useQuery({
    queryKey: ['reports', projectId],
    queryFn: () => api.getReports(projectId),
    enabled: !!projectId,
  });
}
