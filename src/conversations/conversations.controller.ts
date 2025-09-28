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

    @Get('search-all-messages')
    getSimilarMessages(@Query('searchInput') searchText: string) {
        return this.conversationsService.getSimilarMessages(searchText);
    }

    @Get('search-messages-per-conversation')
    getSimilarMessagesInConversation(@Query('searchInput') searchText: string) {
        return this.conversationsService.getSimilarMessagesInConversation(searchText);
    }
}
