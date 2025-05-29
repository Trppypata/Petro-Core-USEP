import { useQuery } from '@tanstack/react-query';
import { Q_KEYS } from '@/shared/qkeys';
import { getMinerals } from '../services/minerals.service';

export function useReadMinerals(category: string) {
  return useQuery({
    queryKey: [Q_KEYS.MINERALS, category],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching minerals for category:', category);
        const response = await getMinerals(category);
        console.log('✅ useReadMinerals received:', response);

        if (!response) {
          console.warn('⚠️ No response from getMinerals');
          return [];
        }

        if (!Array.isArray(response)) {
          console.warn('⚠️ Response is not an array:', response);
          return [];
        }

        return response;
      } catch (error) {
        console.error('❌ Error in useReadMinerals:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });
} 