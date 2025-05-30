import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteMineral } from '../services/minerals.service';

export const useDeleteMineral = () => {
  const mutation = useMutation({
    mutationFn: (id: string) => {
      return deleteMineral(id);
    },
    onSuccess: () => {
      toast.success('Mineral deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete mineral');
    },
  });

  return {
    deleteMineral: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}; 