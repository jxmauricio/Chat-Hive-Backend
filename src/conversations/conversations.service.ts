import { Inject, Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE } from '../supabase/supabase.provider';
import OpenAI from 'openai';
import { createHash } from 'crypto';
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

    // 2. Check which messages already exist
    const existingMessages = await this.getExistingMessages(
      dto.conversationId,
      dto.messages,
    );

    // 3. Filter out messages that already exist
    const newMessages = dto.messages.filter(
      (message) =>
        !existingMessages.some(
          (existing) =>
            existing.content === message.content &&
            existing.role === message.role,
        ),
    );

    // 4. Only generate embeddings for new messages
    const promises = newMessages.map((m) =>
      this.storeMessageWithEmbedding(m.role, m.content, dto.conversationId),
    );

    const newData = await Promise.all(promises);

    return {
      conversationId: dto.conversationId,
      newMessages: newData,
      existingMessages: existingMessages,
    };
  }

  // Then store in Supabase with pgvector
  async storeMessageWithEmbedding(
    role: string,
    message: string,
    conversationId: string,
  ) {
    //TODO: only embedd messages that need embedding (i.e. user messages)
  
    const embedding = await this.generateEmbedding(message);
    const messageHash = createHash('sha256').update(message).digest('hex');
    const { data, error } = await this.supabase
      .from('messages')
      .upsert(
        {
          role: role,
          content: message,
          conversation_id: conversationId,
          embedding: embedding, // pgvector columns
          content_hash: messageHash,
        }
      )
      .select('content');

    if (error) throw new Error(error.message);
    return data;
  }
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  }
  private async getExistingMessages(
    conversationId: string,
    incomingMessages: any[],
  ) {
    const contents_hashed = incomingMessages.map((m) => {
      console.log(m.content);
      return createHash('sha256').update(m.content).digest('hex');
    });
    console.log("Content Length that we are about to check in messages table", contents_hashed.length);
    const { data, error } = await this.supabase
      .from('messages')
      .select('content, role')
      .eq('conversation_id', conversationId)
      .in('content_hash', contents_hashed);
    
    console.log({ data, error });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getSimilarMessages(searchText: string) {
    const embedding = await this.generateEmbedding(searchText);
    const { data: documents } = await this.supabase.rpc('match_messages', {
      query_embedding: embedding, // pass the query embedding
      match_threshold: 0.78, // choose an appropriate threshold for your data
      match_count: 10, // choose the number of matches
    });
    console.log({ documents });
    return documents;
  }

  async getSimilarMessagesInConversation(searchText: string) {
    const embedding = await this.generateEmbedding(searchText);
    const { data: documents } = await this.supabase.rpc(
      'match_messages_per_conversation',
      {
        query_embedding: embedding, // pass the query embedding
        match_threshold: 0.78, // choose an appropriate threshold for your data
        match_count: 10, // choose the number of matches
      },
    );
    console.log({ documents });
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
