import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Q_KEYS } from '@/shared/qkeys';
import { toast } from 'sonner';
import { updateRock } from '../services/rock.service';
import type { IRock } from '../rock.interface';

export const useUpdateRock = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, rockData }: { id: string; rockData: Partial<IRock> }) => {
      console.log('useUpdateRock mutation called with:', { id, rockData: { ...rockData } });
      
      try {
        // Show loading toast
        toast.loading('Updating rock...');
        
        // Fetch the original rock to get its rock_code
        const originalRock = await queryClient.getQueryData<IRock>(['rock', id]);
        
        // If we're changing rock_code, check if we have the original code to preserve
        if (rockData.rock_code && originalRock && originalRock.rock_code) {
          // Ensure we're not changing the rock_code to prevent unique constraint violations
          console.log(`Preserving original rock_code: ${originalRock.rock_code}`);
          rockData = {
            ...rockData,
            rock_code: originalRock.rock_code
          };
        }
        
        // The rock.service updateRock function already handles data cleaning
        const result = await updateRock(id, rockData);
        
        // Dismiss the loading toast
        toast.dismiss();
        
        return result;
      } catch (error) {
        // Dismiss the loading toast
        toast.dismiss();
        throw error;
      }
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
      toast.error(`Failed to update rock: ${error.message}`);
    }
  });

  return {
    updateRock: mutateAsync,
    isUpdating
  };
}; 