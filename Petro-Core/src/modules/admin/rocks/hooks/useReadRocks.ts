import { Q_KEYS } from '@/shared/qkeys';
import { useQuery } from '@tanstack/react-query';
import type { IRock, RockCategory } from '../rock.interface';
import { fetchRocks } from '../services';

export function useReadRocks(category: string | RockCategory) {
  return useQuery({
    queryKey: [Q_KEYS.ROCKS, category],
    queryFn: () => fetchRocks(category),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
} 