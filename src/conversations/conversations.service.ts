import { Inject, Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE } from '../supabase/supabase.provider';
@Injectable()
export class ConversationsService {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {
  }
  async upsertConversation(dto: CreateConversationDto) {
    // 1. Check if conversation exists
    const { data: existing } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('id', dto.conversationId)
      .single();
    if (!existing) {
      // Create conversation
      const { error: convError } = await this.supabase
        .from('conversations')
        .insert([{ id: dto.conversationId, source: dto.source, }]);

      if (convError) throw new Error(convError.message);
    }

    // 2. Insert messages
    const { data, error } = await this.supabase
      .from('messages')
      .insert(
        dto.messages.map((m) => ({ ...m, conversation_id: dto.conversationId })),
      );

    if (error) throw new Error(error.message);

    return { conversationId: dto.conversationId, messages: data };
  }
}
