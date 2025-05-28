import { useQuery } from '@tanstack/react-query';
import { Q_KEYS } from '@/shared/qkeys';
import { getMinerals } from '../services/minerals.service';

export function useReadMinerals(category: string) {
  return useQuery({
    queryKey: [Q_KEYS.MINERALS, category],
    queryFn: () => getMinerals(category),
  });
} 