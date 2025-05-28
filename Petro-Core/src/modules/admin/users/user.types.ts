import { z } from 'zod';

// Schema definition for validation (this is a value, not a type)
export const userSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: 'First name must be at least 2 characters.' })
    .max(30),
  last_name: z
    .string()
    .min(2, { message: 'Last name must be at least 2 characters.' })
    .max(30),
  middle_name: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
  position: z.string().default('student'),
  team: z.string().default('BSIT'),
  salary: z.coerce.number().default(0),
  allowance: z.coerce.number().default(0),
  contact: z.string().min(11, { message: 'Invalid contact number' }).max(11),
  profile_url: z.string().optional(),
  address: z.string().optional(),
  status: z.string().optional().default('active'),
});

// Type definition (type only)
export type UserFormValues = z.infer<typeof userSchema>;

// Default values (this is a value, not a type)
export const defaultValues: UserFormValues = {
  first_name: '',
  last_name: '',
  middle_name: '',
  email: '',
  password: '',
  position: 'student',
  team: 'BSIT',
  salary: 0,
  allowance: 0,
  contact: '',
  profile_url: '',
  address: '',
  status: 'active',
}; 