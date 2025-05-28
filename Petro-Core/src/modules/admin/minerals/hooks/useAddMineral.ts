import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Q_KEYS } from '@/shared/qkeys';
import { toast } from 'sonner';
import { addMineral } from '../services/minerals.service';
import type { IMineral } from '../mineral.interface';

export function useAddMineral() {
  const queryClient = useQueryClient();

  const { isPending: isAdding, mutateAsync: addMineralAsync } = useMutation({
    mutationFn: async (mineralData: Omit<IMineral, 'id'>) => {
      return await addMineral(mineralData);
    },
    onSuccess: (data, variables) => {
      toast.success(`Success! The ${variables.type} has been added to the database.`);
      queryClient.invalidateQueries({ 
        queryKey: [Q_KEYS.MINERALS, variables.category, variables.type] 
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { isAdding, addMineral: addMineralAsync };
} 