import { IsOptional, IsIn, IsString } from 'class-validator';

export class UpdateMessageDto {
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsIn(['text', 'image', 'file'])
    messageType?: 'text' | 'image' | 'file';
}