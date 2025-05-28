import { Q_KEYS } from '@/shared/qkeys';
import { useQuery } from '@tanstack/react-query';
import { getAllStudents } from '../services/student.service';

const useReadStudents = () => {
  return useQuery({
    queryFn: async () => {
      try {
        const response = await getAllStudents();
        console.log('🎯 useReadStudents received:', response);

        if (!response) {
          console.warn('⚠️ No response from getAllStudents');
          return [];
        }

        if (!Array.isArray(response)) {
          console.warn('⚠️ Response is not an array:', response);
          return [];
        }

        return response;
      } catch (error) {
        console.error('❌ Error in useReadStudents:', error);
        throw error;
      }
    },
    queryKey: [Q_KEYS.STUDENTS],
    refetchOnWindowFocus: false,
  });
};

export default useReadStudents; 