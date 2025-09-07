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

  @IsISO8601()
  timestamp: string; // e.g. "2025-09-06T20:30:12.143Z"
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
