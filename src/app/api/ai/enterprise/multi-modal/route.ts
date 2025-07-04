/**
 * Advanced Enterprise AI Platform - Multi-Modal Processing API
 * Handles text, image, video, audio, and document processing requests
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { multiModalProcessor } from '@/lib/ai/advanced/multi-modal-processor';

// Request schemas
const TextProcessingRequestSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
  taskType: z.enum(['summarization', 'translation', 'sentiment', 'classification', 'extraction']),
  parameters: z.record(z.any()).optional(),
});

const ImageProcessingRequestSchema = z.object({
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().optional(),
  taskType: z.enum(['analysis', 'ocr', 'classification', 'generation', 'enhancement']),
  parameters: z.record(z.any()).optional(),
});

const VideoProcessingRequestSchema = z.object({
  videoUrl: z.string().url(),
  taskType: z.enum(['transcription', 'analysis', 'summarization', 'scene_detection', 'content_moderation']),
  parameters: z.record(z.any()).optional(),
});

const AudioProcessingRequestSchema = z.object({
  audioUrl: z.string().url().optional(),
  audioBase64: z.string().optional(),
  taskType: z.enum(['transcription', 'translation', 'enhancement', 'classification', 'generation']),
  parameters: z.record(z.any()).optional(),
});

const DocumentProcessingRequestSchema = z.object({
  documentUrl: z.string().url().optional(),
  documentBase64: z.string().optional(),
  documentType: z.enum(['pdf', 'docx', 'txt', 'html', 'csv', 'xlsx']),
  taskType: z.enum(['extraction', 'analysis', 'classification', 'summarization', 'translation']),
  parameters: z.record(z.any()).optional(),
});

const BatchProcessingRequestSchema = z.object({
  requests: z.array(z.object({
    id: z.string(),
    type: z.enum(['text', 'image', 'video', 'audio', 'document']),
    request: z.any(),
    priority: z.number().optional(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...requestData } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Processing type is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'text':
        const textRequest = TextProcessingRequestSchema.parse(requestData);
        result = await multiModalProcessor.processText(textRequest);
        break;

      case 'image':
        const imageRequest = ImageProcessingRequestSchema.parse(requestData);
        // Convert base64 to buffer if provided
        if (requestData.imageBase64) {
          const buffer = Buffer.from(requestData.imageBase64, 'base64');
          result = await multiModalProcessor.processImage({
            ...imageRequest,
            imageUrl: undefined,
            imageBuffer: buffer,
          });
        } else {
          result = await multiModalProcessor.processImage(imageRequest);
        }
        break;

      case 'video':
        const videoRequest = VideoProcessingRequestSchema.parse(requestData);
        result = await multiModalProcessor.processVideo(videoRequest);
        break;

      case 'audio':
        const audioRequest = AudioProcessingRequestSchema.parse(requestData);
        // Convert base64 to buffer if provided
        if (requestData.audioBase64) {
          const buffer = Buffer.from(requestData.audioBase64, 'base64');
          result = await multiModalProcessor.processAudio({
            ...audioRequest,
            audioUrl: undefined,
            audioBuffer: buffer,
          });
        } else {
          result = await multiModalProcessor.processAudio(audioRequest);
        }
        break;

      case 'document':
        const documentRequest = DocumentProcessingRequestSchema.parse(requestData);
        // Convert base64 to buffer if provided
        if (requestData.documentBase64) {
          const buffer = Buffer.from(requestData.documentBase64, 'base64');
          result = await multiModalProcessor.processDocument({
            ...documentRequest,
            documentUrl: undefined,
            documentBuffer: buffer,
          });
        } else {
          result = await multiModalProcessor.processDocument(documentRequest);
        }
        break;

      case 'batch':
        const batchRequest = BatchProcessingRequestSchema.parse(requestData);
        result = await multiModalProcessor.processBatch(batchRequest.requests);
        // Convert Map to object for JSON response
        result = Object.fromEntries(result);
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported processing type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Multi-modal processing error:', error);

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

    switch (action) {
      case 'metrics':
        const metrics = multiModalProcessor.getModelPerformanceMetrics();
        return NextResponse.json({
          success: true,
          metrics,
          timestamp: new Date().toISOString(),
        });

      case 'usage':
        const usage = multiModalProcessor.getResourceUsage();
        return NextResponse.json({
          success: true,
          usage,
          timestamp: new Date().toISOString(),
        });

      case 'capabilities':
        return NextResponse.json({
          success: true,
          capabilities: {
            text: ['summarization', 'translation', 'sentiment', 'classification', 'extraction'],
            image: ['analysis', 'ocr', 'classification', 'generation', 'enhancement'],
            video: ['transcription', 'analysis', 'summarization', 'scene_detection', 'content_moderation'],
            audio: ['transcription', 'translation', 'enhancement', 'classification', 'generation'],
            document: ['extraction', 'analysis', 'classification', 'summarization', 'translation'],
          },
          supportedFormats: {
            image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            video: ['mp4', 'mov', 'avi', 'mkv'],
            audio: ['mp3', 'wav', 'ogg', 'm4a'],
            document: ['pdf', 'docx', 'txt', 'html', 'csv', 'xlsx'],
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Multi-modal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}