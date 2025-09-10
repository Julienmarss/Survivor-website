import { PartialType } from '@nestjs/swagger';
import { CreateNewsDto } from './news.dto';

export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
