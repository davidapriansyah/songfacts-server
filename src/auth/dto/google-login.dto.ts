import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({ example: 'google-user-id-123' })
  @IsString()
  googleId: string;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'https://lh3.googleusercontent.com/...' })
  @IsString()
  @IsOptional()
  profileImage?: string;
}
