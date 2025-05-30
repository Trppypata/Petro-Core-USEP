import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateMineral } from '../services/minerals.service';
import type { IMineral } from '../mineral.interface';

export const useUpdateMineral = () => {
  const mutation = useMutation({
    mutationFn: ({ id, mineralData }: { id: string; mineralData: Partial<IMineral> }) => {
      return updateMineral(id, mineralData);
    },
    onSuccess: () => {
      toast.success('Mineral updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update mineral');
    },
  });

  return {
    updateMineral: mutation.mutate,
    updateMineralAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}; 