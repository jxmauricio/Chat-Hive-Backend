import { Module } from '@nestjs/common';
import { ConversationsModule } from './conversations/conversations.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConversationsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
