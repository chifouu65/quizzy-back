import { IsString, IsNotEmpty } from 'class-validator';



export class UpdateQuizDto {
    @IsString()
    @IsNotEmpty()
    op : string;

    @IsString()
    @IsNotEmpty()
    path : string;
    
    @IsString()
    @IsNotEmpty()
    value:string;
}