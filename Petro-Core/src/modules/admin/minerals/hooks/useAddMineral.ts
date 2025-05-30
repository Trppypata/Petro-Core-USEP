import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addMineral } from '../services/minerals.service';
import type { IMineral } from '../mineral.interface';

export const useAddMineral = () => {
  const mutation = useMutation({
    mutationFn: (mineralData: Omit<IMineral, 'id'>) => {
      return addMineral(mineralData);
    },
    onSuccess: () => {
      toast.success('Mineral added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add mineral');
    },
  });

  return {
    addMineral: mutation.mutate,
    addMineralAsync: mutation.mutateAsync,
    isAdding: mutation.isPending,
    error: mutation.error,
  };
}; 