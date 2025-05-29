import { Q_KEYS } from '@/shared/qkeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { IRock } from '../rock.interface';
import { createRock } from '../services';

export function useAddRock() {
  const queryClient = useQueryClient();

  const { isPending: isAdding, mutateAsync: addRock } = useMutation({
    mutationFn: async (rockData: IRock) => {
      return await createRock(rockData);
    },

    onSuccess: () => {
      toast.success(`Success! The rock has been added to the database.`);
      queryClient.invalidateQueries({ queryKey: [Q_KEYS.ROCKS] });
    },
    onError: (err: Error) => toast.error(`Failed to add rock: ${err.message}`),
  });

  return { isAdding, addRock };
} 