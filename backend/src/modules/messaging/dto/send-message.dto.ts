import { IsIn, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
    @IsString()
    content: string;

    @IsIn(['text', 'image', 'file'])
    messageType: 'text' | 'image' | 'file';

    // optionnels pour pièces jointes (à étendre plus tard)
    @IsOptional() @IsString() attachmentUrl?: string;
    @IsOptional() @IsString() attachmentName?: string;
}