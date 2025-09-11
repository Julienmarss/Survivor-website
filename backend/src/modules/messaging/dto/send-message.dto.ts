import { IsIn, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
    @IsString()
    content: string;

    @IsIn(['text', 'image', 'file'])
    messageType: 'text' | 'image' | 'file';

    @IsOptional() @IsString() attachmentUrl?: string;
    @IsOptional() @IsString() attachmentName?: string;
}