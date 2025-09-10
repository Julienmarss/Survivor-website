import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
    @IsIn(['direct', 'group'])
    type: 'direct' | 'group';

    @IsArray()
    @IsString({ each: true })
    participantIds: string[];

    @IsOptional()
    @IsString()
    name?: string | null;
}
