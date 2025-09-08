import { Module } from '@nestjs/common';
import { ConversationsModule } from './conversations/conversations.module';
import { ConfigModule } from '@nestjs/config';
import { SupabaseProvider } from './supabase/supabase.provider';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConversationsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
  ],
  providers: [SupabaseProvider],
})
export class AppModule {}
