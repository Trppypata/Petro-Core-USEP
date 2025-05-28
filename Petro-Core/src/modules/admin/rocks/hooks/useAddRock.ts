import { Q_KEYS } from '@/shared/qkeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { IRock } from '../rock.interface';

// Mock function to add rock - in a real app this would call an API
const addRockApi = async (rockData: IRock): Promise<IRock> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, we would make an API call to create the rock
  // For now, just return the data with a random ID
  return {
    ...rockData,
    id: `R-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
  };
};

export function useAddRock() {
  const queryClient = useQueryClient();

  const { isPending: isAdding, mutateAsync: addRock } = useMutation({
    mutationFn: async (rockData: IRock) => {
      return await addRockApi(rockData);
    },

    onSuccess: () => {
      toast.success(`Success! The rock has been added to the database.`);
      queryClient.invalidateQueries({ queryKey: [Q_KEYS.ROCKS] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { isAdding, addRock };
} 