/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { useAddStudent } from './hooks/useAddStudent';
import UserForm from './user-form';
import { userSchema, defaultValues } from './user.types';
import type { UserFormValues } from './user.types';

const UserContentForm = () => {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    mode: 'onTouched',
    defaultValues,
  });

  const { isAddingUser, createUser } = useAddStudent();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const resetForm = () => {
    form.reset(defaultValues);
  };

  const onSubmit: SubmitHandler<UserFormValues> = async (data) => {
    try {
      console.log('📤 Submitting form with data:', data);

      if (!data) {
        throw new Error('Received undefined data in onSubmit!');
      }

      // Validate password for creation (required for new users)
      if (!data.password || data.password.trim().length < 6) {
        alert('Password is required and must be at least 6 characters long.');
        return;
      }

      // Create the request body
      const requestBody = {
        ...data,
      };

      console.log('📨 Sending request body:', requestBody);
      console.log(
        '📸 Profile URL being sent:',
        requestBody.profile_url || 'No profile URL'
      );

      const response = await createUser(requestBody);
      console.log('✅ User created successfully!', response);

      resetForm();
      setIsOpen(false);
    } catch (err: any) {
      console.error('❌ Error in onSubmit:', err);
      alert(`Error: ${err.message || 'Unknown error occurred'}`);
    }
  };

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <Button className="h-8 gap-1" size="sm" variant="default">
          <PlusCircleIcon className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Student
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent className="p-0 flex flex-col h-full md:max-w-[40rem]">
        <header className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
          <div>
                          <h3 className="text-lg font-medium">Adding Student</h3>
            <p className="text-xs text-muted-foreground">
              Fill in the details.
            </p>
          </div>
        </header>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-grow overflow-y-auto"
        >
          <UserForm form={form} />
          <SheetFooter className="flex-shrink-0 px-6 py-4 bg-overlay-bg border-t border-overlay-border">
            <Button type="submit" disabled={isAddingUser}>
              {isAddingUser ? 'Creating Student...' : 'Create Student'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default UserContentForm;
