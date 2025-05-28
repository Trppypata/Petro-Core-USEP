import { Q_KEYS } from '@/shared/qkeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addUser } from '../services/user.service';
import type { UserFormValues } from '../user.types';

export function useAddUser() {
  const queryClient = useQueryClient();

  const { isPending: isAddingUser, mutateAsync: createUser } = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      return await addUser(userData);
    },

    onSuccess: () => {
      toast.success(`Success! The user has been created successfully.`);
      queryClient.invalidateQueries({ queryKey: [Q_KEYS.USERS] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { isAddingUser, createUser };
}
