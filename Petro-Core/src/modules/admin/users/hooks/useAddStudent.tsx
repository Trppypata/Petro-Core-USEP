import { Q_KEYS } from '@/shared/qkeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addStudent } from '../services/student.service';
import type { UserFormValues } from '../user.types';

export function useAddStudent() {
  const queryClient = useQueryClient();

  const { isPending: isAddingUser, mutateAsync: createUser } = useMutation({
    mutationFn: async (studentData: UserFormValues) => {
      return await addStudent(studentData);
    },

    onSuccess: () => {
      toast.success(`Success! The student has been created successfully.`);
      queryClient.invalidateQueries({ queryKey: [Q_KEYS.STUDENTS] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { isAddingUser, createUser };
} 