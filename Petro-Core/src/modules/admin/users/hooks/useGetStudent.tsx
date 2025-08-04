import { Q_KEYS } from '@/shared/qkeys';
import { useQuery } from '@tanstack/react-query';
import { getStudent } from '../services/student.service';

export function useGetStudent(studentId?: string) {
  console.log("🔍 useGetStudent - studentId:", studentId);
  
  const { 
    data: student, 
    isLoading: isLoadingStudent, 
    error,
    refetch: refetchStudent 
  } = useQuery({
    queryKey: [Q_KEYS.STUDENTS, studentId],
    queryFn: () => {
      console.log("🚀 useGetStudent - calling getStudent with ID:", studentId);
      return getStudent(studentId!);
    },
    enabled: !!studentId, // Only run query if studentId exists
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  console.log("🔍 useGetStudent - result:", { student, isLoadingStudent, error });

  return { 
    student, 
    isLoadingStudent, 
    error,
    refetchStudent 
  };
}