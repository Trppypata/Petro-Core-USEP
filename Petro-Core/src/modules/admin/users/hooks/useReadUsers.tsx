import { Q_KEYS } from '@/shared/qkeys';
import { useQuery } from '@tanstack/react-query';
import { getAllUser } from '../services/user.service';

const useReadUsers = () => {
  return useQuery({
    queryFn: async () => {
      try {
        const response = await getAllUser();
        console.log('🎯 useReadUsers received:', response);

        if (!response) {
          console.warn('⚠️ No response from getAllUser');
          return [];
        }

        if (!Array.isArray(response)) {
          console.warn('⚠️ Response is not an array:', response);
          return [];
        }

        return response;
      } catch (error) {
        console.error('❌ Error in useReadUsers:', error);
        throw error;
      }
    },
    queryKey: [Q_KEYS.USERS],
    refetchOnWindowFocus: false,
  });
};

export default useReadUsers;
