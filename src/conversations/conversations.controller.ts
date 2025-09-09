import { Body, Controller, Get, Post ,Query} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
@Controller('conversations')
export class ConversationsController {
    constructor(readonly conversationsService: ConversationsService) { }

    @Post()
    upsertConversation(@Body() createConversationDto: CreateConversationDto) {
        return this.conversationsService.upsertConversation(createConversationDto);
    }
    @Get()
    getConversation(@Query('id') conversationId: string) {
        return this.conversationsService.getConversation(conversationId);
    }
}
