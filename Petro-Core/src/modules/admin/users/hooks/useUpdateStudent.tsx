import { Q_KEYS } from '@/shared/qkeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateStudent } from '../services/student.service';
import type { UserFormValues } from '../user.types';

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  const { isPending: isUpdatingStudent, mutateAsync: updateStudentData } = useMutation({
    mutationFn: async ({ studentId, data }: { studentId: string; data: Partial<UserFormValues> }) => {
      return await updateStudent(studentId, data);
    },

    onSuccess: () => {
      toast.success(`Success! The student has been updated successfully.`);
      queryClient.invalidateQueries({ queryKey: [Q_KEYS.STUDENTS] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { isUpdatingStudent, updateStudentData };
}