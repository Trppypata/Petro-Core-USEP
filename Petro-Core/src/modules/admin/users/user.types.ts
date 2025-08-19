import { z } from 'zod';

// Unified schema with optional password (validation handled at form level)
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
    .optional()
    .or(z.literal('')), // Allow empty for updates, validate at form level for creates
  position: z.string().min(1, { message: 'Position is required' }),
  team: z.string().min(1, { message: 'Team is required' }),
  salary: z.coerce.number().min(0),
  allowance: z.coerce.number().min(0),
  profile_url: z.string().optional(),
  address: z.string().optional(),
  status: z.string().min(1, { message: 'Status is required' }),
});

// Type definition
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
  profile_url: '',
  address: '',
  status: 'active',
}; 