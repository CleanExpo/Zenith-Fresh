/**
 * Advanced Enterprise AI Platform - Conversational AI API
 * Handles chatbot creation, conversations, and voice interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { conversationalAIPlatform } from '@/lib/ai/advanced/conversational-ai-platform';

// Request schemas
const CreateChatbotRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  personality: z.object({
    tone: z.enum(['professional', 'friendly', 'casual', 'formal', 'empathetic']),
    style: z.enum(['concise', 'detailed', 'conversational', 'technical']),
    expertise: z.array(z.string()),
    restrictions: z.array(z.string()).optional(),
  }),
  capabilities: z.object({
    textChat: z.boolean().default(true),
    voiceChat: z.boolean().default(false),
    multiLanguage: z.boolean().default(false),
    knowledgeBase: z.boolean().default(false),
    apiIntegration: z.boolean().default(false),
    workflowTriggers: z.boolean().default(false),
    sentiment: z.boolean().default(false),
    contextAwareness: z.boolean().default(true),
  }).optional(),
  configuration: z.object({
    model: z.string().default('gpt-4'),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().default(2048),
    responseTimeout: z.number().default(30000),
    fallbackMessages: z.array(z.string()),
    welcomeMessage: z.string(),
    languages: z.array(z.string()).default(['en']),
  }).optional(),
  knowledgeBase: z.object({
    sources: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['document', 'url', 'database', 'api']),
      source: z.string(),
      metadata: z.record(z.any()).optional(),
    })),
  }).optional(),
  createdBy: z.string(),
});

const StartConversationRequestSchema = z.object({
  userId: z.string(),
  botId: z.string(),
  language: z.string().default('en'),
});

const SendMessageRequestSchema = z.object({
  conversationId: z.string(),
  content: z.string(),
  type: z.enum(['text', 'voice', 'image', 'file', 'structured']).default('text'),
  metadata: z.record(z.any()).optional(),
});

const VoiceConfigRequestSchema = z.object({
  botId: z.string(),
  enabled: z.boolean().default(false),
  provider: z.enum(['openai', 'azure', 'google', 'aws']).default('openai'),
  voice: z.string().default('alloy'),
  language: z.string().default('en-US'),
  speed: z.number().min(0.25).max(4).default(1),
  pitch: z.number().min(-20).max(20).default(0),
  volume: z.number().min(0).max(1).default(0.8),
  speechToText: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['openai', 'azure', 'google', 'aws']).default('openai'),
    language: z.string().default('en-US'),
    continuous: z.boolean().default(false),
    noiseReduction: z.boolean().default(true),
  }),
  textToSpeech: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['openai', 'azure', 'google', 'aws']).default('openai'),
    voice: z.string().default('alloy'),
    speed: z.number().min(0.25).max(4).default(1),
    format: z.enum(['mp3', 'wav', 'ogg']).default('mp3'),
  }),
});

const AddIntentRequestSchema = z.object({
  botId: z.string(),
  intent: z.object({
    name: z.string(),
    description: z.string(),
    examples: z.array(z.string()),
    entities: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
    })),
    responses: z.array(z.object({
      condition: z.string().optional(),
      templates: z.array(z.string()),
      actions: z.array(z.object({
        type: z.string(),
        parameters: z.record(z.any()),
      })).optional(),
    })),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...requestData } = body;

    switch (action) {
      case 'create_chatbot':
        const chatbotRequest = CreateChatbotRequestSchema.parse(requestData);
        const botId = await conversationalAIPlatform.createChatbot(chatbotRequest);
        
        return NextResponse.json({
          success: true,
          botId,
          message: 'Chatbot created successfully',
          timestamp: new Date().toISOString(),
        });

      case 'start_conversation':
        const conversationRequest = StartConversationRequestSchema.parse(requestData);
        const conversationId = await conversationalAIPlatform.startConversation(
          conversationRequest.userId,
          conversationRequest.botId,
          conversationRequest.language
        );
        
        return NextResponse.json({
          success: true,
          conversationId,
          message: 'Conversation started successfully',
          timestamp: new Date().toISOString(),
        });

      case 'send_message':
        const messageRequest = SendMessageRequestSchema.parse(requestData);
        const processingResult = await conversationalAIPlatform.sendMessage(
          messageRequest.conversationId,
          messageRequest.content,
          messageRequest.type,
          messageRequest.metadata
        );
        
        return NextResponse.json({
          success: true,
          result: processingResult,
          timestamp: new Date().toISOString(),
        });

      case 'configure_voice':
        const voiceConfigRequest = VoiceConfigRequestSchema.parse(requestData);
        await conversationalAIPlatform.configureVoice(voiceConfigRequest.botId, voiceConfigRequest);
        
        return NextResponse.json({
          success: true,
          message: 'Voice configuration updated successfully',
          timestamp: new Date().toISOString(),
        });

      case 'process_voice_input':
        const { conversationId: voiceConversationId, audioUrl } = requestData;
        const voiceResult = await conversationalAIPlatform.processVoiceInput(voiceConversationId, audioUrl);
        
        return NextResponse.json({
          success: true,
          result: voiceResult,
          timestamp: new Date().toISOString(),
        });

      case 'add_intent':
        const intentRequest = AddIntentRequestSchema.parse(requestData);
        await conversationalAIPlatform.addIntent(intentRequest.botId, intentRequest.intent);
        
        return NextResponse.json({
          success: true,
          message: 'Intent added successfully',
          timestamp: new Date().toISOString(),
        });

      case 'update_intent':
        const { botId: updateBotId, intentName, updates } = requestData;
        await conversationalAIPlatform.updateIntent(updateBotId, intentName, updates);
        
        return NextResponse.json({
          success: true,
          message: 'Intent updated successfully',
          timestamp: new Date().toISOString(),
        });

      case 'delete_intent':
        const { botId: deleteBotId, intentName: deleteIntentName } = requestData;
        await conversationalAIPlatform.deleteIntent(deleteBotId, deleteIntentName);
        
        return NextResponse.json({
          success: true,
          message: 'Intent deleted successfully',
          timestamp: new Date().toISOString(),
        });

      case 'end_conversation':
        const { conversationId: endConversationId } = requestData;
        await conversationalAIPlatform.endConversation(endConversationId);
        
        return NextResponse.json({
          success: true,
          message: 'Conversation ended successfully',
          timestamp: new Date().toISOString(),
        });

      case 'translate_message':
        const { content, fromLanguage, toLanguage } = requestData;
        const translatedMessage = await conversationalAIPlatform.translateMessage(
          content,
          fromLanguage,
          toLanguage
        );
        
        return NextResponse.json({
          success: true,
          translatedMessage,
          timestamp: new Date().toISOString(),
        });

      case 'detect_language':
        const { content: detectContent } = requestData;
        const detectedLanguage = await conversationalAIPlatform.detectLanguage(detectContent);
        
        return NextResponse.json({
          success: true,
          detectedLanguage,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Conversational AI error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const getBotId = searchParams.get('botId');
    const getConversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    switch (action) {
      case 'list_chatbots':
        const chatbots = conversationalAIPlatform.listChatbots();
        return NextResponse.json({
          success: true,
          chatbots,
          timestamp: new Date().toISOString(),
        });

      case 'get_chatbot':
        if (!getBotId) {
          return NextResponse.json(
            { error: 'botId parameter is required' },
            { status: 400 }
          );
        }
        
        const chatbot = conversationalAIPlatform.getChatbot(getBotId);
        if (!chatbot) {
          return NextResponse.json(
            { error: 'Chatbot not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          chatbot,
          timestamp: new Date().toISOString(),
        });

      case 'list_conversations':
        const conversations = conversationalAIPlatform.listConversations(userId || undefined, getBotId || undefined);
        return NextResponse.json({
          success: true,
          conversations,
          timestamp: new Date().toISOString(),
        });

      case 'get_conversation':
        if (!getConversationId) {
          return NextResponse.json(
            { error: 'conversationId parameter is required' },
            { status: 400 }
          );
        }
        
        const conversation = conversationalAIPlatform.getConversation(getConversationId);
        if (!conversation) {
          return NextResponse.json(
            { error: 'Conversation not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          conversation,
          timestamp: new Date().toISOString(),
        });

      case 'get_messages':
        if (!getConversationId) {
          return NextResponse.json(
            { error: 'conversationId parameter is required' },
            { status: 400 }
          );
        }
        
        const messages = conversationalAIPlatform.getConversationMessages(getConversationId);
        return NextResponse.json({
          success: true,
          messages,
          timestamp: new Date().toISOString(),
        });

      case 'get_voice_config':
        if (!getBotId) {
          return NextResponse.json(
            { error: 'botId parameter is required' },
            { status: 400 }
          );
        }
        
        const voiceConfig = conversationalAIPlatform.getVoiceConfig(getBotId);
        return NextResponse.json({
          success: true,
          voiceConfig,
          timestamp: new Date().toISOString(),
        });

      case 'get_intents':
        if (!getBotId) {
          return NextResponse.json(
            { error: 'botId parameter is required' },
            { status: 400 }
          );
        }
        
        const intents = conversationalAIPlatform.getIntents(getBotId);
        return NextResponse.json({
          success: true,
          intents,
          timestamp: new Date().toISOString(),
        });

      case 'chatbot_analytics':
        if (!getBotId) {
          return NextResponse.json(
            { error: 'botId parameter is required' },
            { status: 400 }
          );
        }
        
        const analytics = conversationalAIPlatform.getChatbotAnalytics(getBotId);
        return NextResponse.json({
          success: true,
          analytics,
          timestamp: new Date().toISOString(),
        });

      case 'platform_analytics':
        const platformAnalytics = conversationalAIPlatform.getPlatformAnalytics();
        return NextResponse.json({
          success: true,
          analytics: platformAnalytics,
          timestamp: new Date().toISOString(),
        });

      case 'capabilities':
        const capabilities = {
          supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'ru'],
          voiceProviders: ['openai', 'azure', 'google', 'aws'],
          messageTypes: ['text', 'voice', 'image', 'file', 'structured'],
          intentSupport: true,
          knowledgeBase: true,
          multiLanguage: true,
          voiceChat: true,
          contextAwareness: true,
          sentiment: true,
          workflowIntegration: true,
          maxConversationLength: 1000,
          maxMessageLength: 4000,
        };
        
        return NextResponse.json({
          success: true,
          capabilities,
          timestamp: new Date().toISOString(),
        });

      case 'conversation_history':
        if (!getConversationId) {
          return NextResponse.json(
            { error: 'conversationId parameter is required' },
            { status: 400 }
          );
        }
        
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        
        const allMessages = conversationalAIPlatform.getConversationMessages(getConversationId);
        const paginatedMessages = allMessages.slice(offset, offset + limit);
        
        return NextResponse.json({
          success: true,
          messages: paginatedMessages,
          total: allMessages.length,
          limit,
          offset,
          timestamp: new Date().toISOString(),
        });

      case 'export_conversation':
        if (!getConversationId) {
          return NextResponse.json(
            { error: 'conversationId parameter is required' },
            { status: 400 }
          );
        }
        
        const format = searchParams.get('format') || 'json';
        const exportConversation = conversationalAIPlatform.getConversation(getConversationId);
        const exportMessages = conversationalAIPlatform.getConversationMessages(getConversationId);
        
        if (!exportConversation) {
          return NextResponse.json(
            { error: 'Conversation not found' },
            { status: 404 }
          );
        }
        
        const exportData = { conversation: exportConversation, messages: exportMessages };
        
        switch (format) {
          case 'csv':
            let csvData = 'timestamp,sender,content,type\n';
            exportMessages.forEach(msg => {
              csvData += `${msg.metadata.timestamp.toISOString()},"${msg.sender}","${msg.content.replace(/"/g, '""')}","${msg.type}"\n`;
            });
            
            return new NextResponse(csvData, {
              headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="conversation_${getConversationId}.csv"`,
              },
            });
            
          case 'txt':
            let txtData = `Conversation Export - ${exportConversation.id}\n`;
            txtData += `Created: ${exportConversation.createdAt.toISOString()}\n`;
            txtData += `Language: ${exportConversation.language}\n\n`;
            
            exportMessages.forEach(msg => {
              txtData += `[${msg.metadata.timestamp.toISOString()}] ${msg.sender}: ${msg.content}\n`;
            });
            
            return new NextResponse(txtData, {
              headers: {
                'Content-Type': 'text/plain',
                'Content-Disposition': `attachment; filename="conversation_${getConversationId}.txt"`,
              },
            });
            
          default:
            return NextResponse.json({
              success: true,
              format,
              data: exportData,
              timestamp: new Date().toISOString(),
            });
        }

      case 'search_conversations':
        const query = searchParams.get('query');
        const searchUserId = searchParams.get('userId');
        const searchBotId = searchParams.get('botId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        if (!query) {
          return NextResponse.json(
            { error: 'query parameter is required' },
            { status: 400 }
          );
        }
        
        let searchResults = conversationalAIPlatform.listConversations(searchUserId || undefined, searchBotId || undefined);
        
        // Filter by date range
        if (startDate) {
          const start = new Date(startDate);
          searchResults = searchResults.filter(conv => conv.createdAt >= start);
        }
        
        if (endDate) {
          const end = new Date(endDate);
          searchResults = searchResults.filter(conv => conv.createdAt <= end);
        }
        
        // Search in conversation messages
        searchResults = searchResults.filter(conv => {
          const messages = conversationalAIPlatform.getConversationMessages(conv.id);
          return messages.some(msg => 
            msg.content.toLowerCase().includes(query.toLowerCase())
          );
        });
        
        return NextResponse.json({
          success: true,
          query,
          results: searchResults,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Conversational AI API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { botId, updates } = body;

    if (!botId) {
      return NextResponse.json(
        { error: 'botId is required' },
        { status: 400 }
      );
    }

    await conversationalAIPlatform.updateChatbot(botId, updates);

    return NextResponse.json({
      success: true,
      message: 'Chatbot updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Chatbot update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json(
        { error: 'botId parameter is required' },
        { status: 400 }
      );
    }

    const deleted = await conversationalAIPlatform.deleteChatbot(botId);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Chatbot deleted successfully' : 'Chatbot not found',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Chatbot deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}