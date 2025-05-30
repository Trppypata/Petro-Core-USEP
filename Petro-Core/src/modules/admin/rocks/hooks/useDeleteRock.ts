import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Q_KEYS } from '@/shared/qkeys';
import { toast } from 'sonner';
import { deleteRock } from '../services';

export function useDeleteRock() {
  const queryClient = useQueryClient();

  const { isPending: isDeleting, mutateAsync: deleteRockAsync } = useMutation({
    mutationFn: async (id: string) => {
      return await deleteRock(id);
    },
    onSuccess: () => {
      toast.success('Rock has been successfully deleted.');
      queryClient.invalidateQueries({ 
        queryKey: [Q_KEYS.ROCKS] 
      });
    },
    onError: (err: Error) => toast.error(`Failed to delete rock: ${err.message}`),
  });

  return { isDeleting, deleteRock: deleteRockAsync };
} 