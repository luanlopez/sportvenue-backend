export class UserProfileDto {
  id: number;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  phone: string;
  userType: string;
  picture?: string;
  googleId?: string;
}
