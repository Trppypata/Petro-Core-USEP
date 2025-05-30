import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Q_KEYS } from '@/shared/qkeys';
import { toast } from 'sonner';
import { updateRock } from '../services/rock.service';
import type { IRock } from '../rock.interface';

export const useUpdateRock = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, rockData }: { id: string; rockData: Partial<IRock> }) => {
      return await updateRock(id, rockData);
    },
    onSuccess: (updatedRock) => {
      // Invalidate the rocks query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [Q_KEYS.ROCKS] });
      
      // Show success message
      toast.success(`${updatedRock.name} has been updated successfully.`);
      
      return updatedRock;
    },
    onError: (error: Error) => {
      console.error('Error updating rock:', error);
      toast.error('Failed to update rock. Please try again.');
    }
  });

  return {
    updateRock: mutateAsync,
    isUpdating
  };
}; 