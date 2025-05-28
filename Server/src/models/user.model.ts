interface IUser {
  user_id?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  password?: string;
  position: string; // e.g., "student"
  team: string; // e.g., "BSIT", "BSCS", etc.
  salary: number; // can be used for tuition
  allowance: number;
  contact: string;
  profile_url?: string;
  address?: string;
  status?: string;
  student_name?: string; // full name
}

export default IUser; 