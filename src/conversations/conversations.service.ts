import { Inject, Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE } from '../supabase/supabase.provider';
import OpenAI from 'openai';
@Injectable()
export class ConversationsService {
  constructor(
    @Inject(SUPABASE) private readonly supabase: SupabaseClient,
    @Inject('OPENAI_CLIENT') private readonly openai: OpenAI,
  ) {}
  async upsertConversation(dto: CreateConversationDto) {
    // 1. Upsert conversation
    const { error: convError } = await this.supabase
      .from('conversations')
      .upsert(
        [
          {
            conversation_link: dto.conversationLink,
            title: dto.title,
            id: dto.conversationId,
            source: dto.source,
          },
        ],
        { onConflict: 'id' },
      );

    if (convError) throw new Error(convError.message);

    // 2. Insert messages

    const promises = dto.messages.map((m) =>
      this.storeMessageWithEmbedding(m.role, m.content, dto.conversationId),
    );
    const data = await Promise.all(promises);

    return { conversationId: dto.conversationId, messages: data };
  }
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } 
  // Then store in Supabase with pgvector
  async storeMessageWithEmbedding(
    role: string,
    message: string,
    conversationId: string,
  ) {
    //TODO: only embedd messages that need embedding (i.e. user messages)
    const embedding = await this.generateEmbedding(message);

    const { data, error } = await this.supabase
      .from('messages')
      .upsert(
        {
          role: role,
          content: message,
          conversation_id: conversationId,
          embedding: embedding, // pgvector column
        },
        { onConflict: 'conversation_id,content' },
      )
      .select('content');

    if (error) throw new Error(error.message);
    return data;
  }
  async getSimilarMessages(searchText: string){
    const embedding = await this.generateEmbedding(searchText);
    const { data: documents } = await this.supabase.rpc('match_messages', {
      query_embedding: embedding, // pass the query embedding
      match_threshold: 0.78, // choose an appropriate threshold for your data
      match_count: 10, // choose the number of matches
    });
    console.log({documents})
    return documents;
  }

  async getSimilarMessagesInConversation(searchText: string){
    const embedding = await this.generateEmbedding(searchText);
    const { data: documents } = await this.supabase.rpc('match_messages_per_conversation', {
      query_embedding: embedding, // pass the query embedding
      match_threshold: 0.78, // choose an appropriate threshold for your data
      match_count: 10, // choose the number of matches
    });
    console.log({documents})
    return documents;
  }

  //TODO: We are going to need to update this to use user id as well
  async getConversation(conversationId: string) {
    const { data, error } = await this.supabase
      .from('conversations')
      .select(
        `
        source,
        conversation_link,
        messages (
          role,
          content,
          created_at
        )
      `,
      )
      .eq('id', conversationId)
      .single();
    return data;
  }
}
