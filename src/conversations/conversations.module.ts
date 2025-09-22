import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { OpenAIModule } from './openai/openai.module';

@Module({
  imports: [SupabaseModule, OpenAIModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
