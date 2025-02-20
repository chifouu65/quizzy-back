import { IsString, IsNotEmpty, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
} 