import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Le titre doit contenir au moins 3 caractères' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
} 