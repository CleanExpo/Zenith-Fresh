import { Storage } from '@google-cloud/storage';
import { captureException } from './sentry';

interface UploadConfig {
  bucketName: string;
  fileName: string;
  buffer: Buffer;
  mimeType?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

interface UploadResult {
  success: boolean;
  fileName?: string;
  publicUrl?: string;
  signedUrl?: string;
  error?: string;
}

class GoogleCloudStorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || 'zenith-fresh';
    
    // Initialize Google Cloud Storage
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'green-diagram-463408-n5',
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Path to service account JSON
      credentials: process.env.GOOGLE_CLOUD_CREDENTIALS ? 
        JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS) : undefined,
    });
  }

  /**
   * Upload a file to Google Cloud Storage
   */
  async uploadFile(config: UploadConfig): Promise<UploadResult> {
    try {
      const bucket = this.storage.bucket(config.bucketName || this.bucketName);
      const file = bucket.file(config.fileName);

      // Create write stream
      const stream = file.createWriteStream({
        metadata: {
          contentType: config.mimeType || 'application/octet-stream',
          metadata: config.metadata || {},
        },
        public: config.isPublic || false,
        validation: 'md5',
      });

      return new Promise((resolve) => {
        stream.on('error', (error) => {
          console.error('Upload error:', error);
          captureException(error, { context: 'gcs-upload' });
          resolve({
            success: false,
            error: error.message,
          });
        });

        stream.on('finish', async () => {
          try {
            let publicUrl: string | undefined;
            let signedUrl: string | undefined;

            if (config.isPublic) {
              // Make file public and get public URL
              await file.makePublic();
              publicUrl = `https://storage.googleapis.com/${config.bucketName || this.bucketName}/${config.fileName}`;
            } else {
              // Generate signed URL for private files (valid for 1 hour)
              const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000, // 1 hour
              });
              signedUrl = url;
            }

            resolve({
              success: true,
              fileName: config.fileName,
              publicUrl,
              signedUrl,
            });
          } catch (error) {
            console.error('Post-upload error:', error);
            captureException(error as Error, { context: 'gcs-post-upload' });
            resolve({
              success: false,
              error: (error as Error).message,
            });
          }
        });

        // Write the buffer to the stream
        stream.end(config.buffer);
      });
    } catch (error) {
      console.error('GCS upload failed:', error);
      captureException(error as Error, { context: 'gcs-upload-init' });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Delete a file from Google Cloud Storage
   */
  async deleteFile(fileName: string, bucketName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const bucket = this.storage.bucket(bucketName || this.bucketName);
      const file = bucket.file(fileName);

      await file.delete();

      return { success: true };
    } catch (error) {
      console.error('GCS delete failed:', error);
      captureException(error as Error, { context: 'gcs-delete' });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileName: string, bucketName?: string) {
    try {
      const bucket = this.storage.bucket(bucketName || this.bucketName);
      const file = bucket.file(fileName);

      const [metadata] = await file.getMetadata();

      return {
        success: true,
        metadata,
      };
    } catch (error) {
      console.error('GCS metadata failed:', error);
      captureException(error as Error, { context: 'gcs-metadata' });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Generate signed URL for file access
   */
  async getSignedUrl(
    fileName: string, 
    action: 'read' | 'write' = 'read',
    expiresInHours: number = 1,
    bucketName?: string
  ) {
    try {
      const bucket = this.storage.bucket(bucketName || this.bucketName);
      const file = bucket.file(fileName);

      const [signedUrl] = await file.getSignedUrl({
        action,
        expires: Date.now() + expiresInHours * 60 * 60 * 1000,
      });

      return {
        success: true,
        signedUrl,
      };
    } catch (error) {
      console.error('GCS signed URL failed:', error);
      captureException(error as Error, { context: 'gcs-signed-url' });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * List files in bucket
   */
  async listFiles(prefix?: string, bucketName?: string) {
    try {
      const bucket = this.storage.bucket(bucketName || this.bucketName);

      const [files] = await bucket.getFiles({
        prefix,
        maxResults: 1000,
      });

      const fileList = files.map(file => ({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        created: file.metadata.timeCreated,
        updated: file.metadata.updated,
      }));

      return {
        success: true,
        files: fileList,
      };
    } catch (error) {
      console.error('GCS list files failed:', error);
      captureException(error as Error, { context: 'gcs-list-files' });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files: UploadConfig[]): Promise<UploadResult[]> {
    const results = await Promise.all(
      files.map(file => this.uploadFile(file))
    );

    return results;
  }

  /**
   * Create a new bucket
   */
  async createBucket(bucketName: string, location: string = 'US') {
    try {
      const [bucket] = await this.storage.createBucket(bucketName, {
        location,
        storageClass: 'STANDARD',
      });

      return {
        success: true,
        bucket: bucket.name,
      };
    } catch (error) {
      console.error('GCS create bucket failed:', error);
      captureException(error as Error, { context: 'gcs-create-bucket' });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(fileName: string, bucketName?: string) {
    try {
      const bucket = this.storage.bucket(bucketName || this.bucketName);
      const file = bucket.file(fileName);

      const [exists] = await file.exists();

      return {
        success: true,
        exists,
      };
    } catch (error) {
      console.error('GCS file exists check failed:', error);
      captureException(error as Error, { context: 'gcs-file-exists' });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

// Export singleton instance
export const googleCloudStorage = new GoogleCloudStorageService();

// Utility functions
export const generateFileName = (originalName: string, prefix?: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName.split('.').slice(0, -1).join('.');
  
  return `${prefix ? prefix + '/' : ''}${baseName}-${timestamp}-${randomString}.${extension}`;
};

export const getFileTypeFromMimeType = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'application/pdf': 'document',
    'application/msword': 'document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
    'application/vnd.ms-excel': 'spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
    'video/mp4': 'video',
    'video/mpeg': 'video',
    'audio/mpeg': 'audio',
    'audio/wav': 'audio',
    'text/plain': 'text',
    'text/csv': 'data',
    'application/json': 'data',
  };

  return typeMap[mimeType] || 'other';
};

export const validateFileSize = (size: number, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};

export const validateFileType = (mimeType: string, allowedTypes: string[] = []): boolean => {
  if (allowedTypes.length === 0) return true;
  return allowedTypes.includes(mimeType);
};