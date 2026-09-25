import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @Matches(/^[\u0621-\u064A\s]+$/, { message: 'First name must contain Arabic letters only' })
  @Matches(/^[^\s].*[^\s]$|^[^\s]$/, { message: 'First name must not start or end with a space' })
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @Matches(/^[\u0621-\u064A\s]+$/, { message: 'Last name must contain Arabic letters only' })
  @Matches(/^[^\s].*[^\s]$|^[^\s]$/, { message: 'Last name must not start or end with a space' })
  lastName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[A-Za-z0-9_]+$/, { message: 'Username must contain English letters, numbers, or underscores only' })
  username!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+9665\d{8}$/, {
    message: 'Phone number must start with +9665 followed by 8 digits'
  })
  phone!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Please enter a valid email address (e.g., example@gmail.com)',
  })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and no spaces',
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Business name is required' })
  @MinLength(3, { message: 'Business name must be at least 3 characters long' })
  @Matches(/^[^\s].*[^\s]$|^[^\s]$/, { message: 'Business name must not start or end with a space' })
  businessName!: string;
}