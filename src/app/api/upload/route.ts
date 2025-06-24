import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { googleCloudStorage, generateFileName, validateFileSize, validateFileType } from '@/lib/google-cloud-storage';
import * as Sentry from '@sentry/nextjs';

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/json',
];

const MAX_FILE_SIZE_MB = 50; // 50MB limit

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isPublic = formData.get('public') === 'true';
    const prefix = formData.get('prefix') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (!validateFileSize(file.size, MAX_FILE_SIZE_MB)) {
      return NextResponse.json({ 
        error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit` 
      }, { status: 400 });
    }

    // Validate file type
    if (!validateFileType(file.type, ALLOWED_FILE_TYPES)) {
      return NextResponse.json({ 
        error: 'File type not allowed' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileName = generateFileName(file.name, prefix);

    // Upload to Google Cloud Storage
    const uploadResult = await googleCloudStorage.uploadFile({
      bucketName: 'zenith-fresh',
      fileName,
      buffer,
      mimeType: file.type,
      isPublic,
      metadata: {
        originalName: file.name,
        uploadedBy: session.user.email,
        uploadedAt: new Date().toISOString(),
      },
    });

    if (!uploadResult.success) {
      return NextResponse.json({
        error: 'Upload failed',
        details: uploadResult.error,
      }, { status: 500 });
    }

    // Store file metadata in database (optional)
    // You can add Prisma code here to store file information

    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        publicUrl: uploadResult.publicUrl,
        signedUrl: uploadResult.signedUrl,
        isPublic,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    Sentry.captureException(error as Error, {
      extra: {
        context: 'file-upload',
        userEmail: (await getServerSession(authOptions))?.user?.email,
      }
    });
    
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || undefined;
    const bucketName = searchParams.get('bucket') || undefined;

    const result = await googleCloudStorage.listFiles(prefix, bucketName);

    if (!result.success) {
      return NextResponse.json({
        error: 'Failed to list files',
        details: result.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      files: result.files,
    });
  } catch (error) {
    console.error('File list error:', error);
    Sentry.captureException(error as Error, {
      extra: {
        context: 'file-list',
        userEmail: (await getServerSession(authOptions))?.user?.email,
      }
    });
    
    return NextResponse.json({
      error: 'Failed to list files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const bucketName = searchParams.get('bucket') || undefined;

    if (!fileName) {
      return NextResponse.json({ error: 'File name required' }, { status: 400 });
    }

    const result = await googleCloudStorage.deleteFile(fileName, bucketName);

    if (!result.success) {
      return NextResponse.json({
        error: 'Failed to delete file',
        details: result.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('File delete error:', error);
    Sentry.captureException(error as Error, {
      extra: {
        context: 'file-delete',
        userEmail: (await getServerSession(authOptions))?.user?.email,
      }
    });
    
    return NextResponse.json({
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}