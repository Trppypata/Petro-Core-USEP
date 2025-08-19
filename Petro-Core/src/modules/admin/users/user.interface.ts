export interface IStudent {
  id?: string; // Primary key from database
  user_id?: string; // Legacy field
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  password?: string;
  position: string;
  team: string;
  salary: number;
  allowance: number;
  profile_url?: string;
  address?: string;
  status?: string;
  student_name?: string;
} 