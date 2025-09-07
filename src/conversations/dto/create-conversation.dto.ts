// src/conversations/dto/create-conversation.dto.ts

import {
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';

class MessageDto {
  @IsString()
  role: string; // "user" | "assistant"

  @IsString()
  content: string;
}

export class CreateConversationDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  source: string; // "chatgpt", "claude", etc.
  @IsString()
  conversationLink: string; // URL to the conversation
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
}
