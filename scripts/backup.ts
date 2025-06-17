import { exec } from 'child_process';
import { promisify } from 'util';
import { S3 } from 'aws-sdk';
import { format } from 'date-fns';
import { captureException } from '../src/lib/sentry';

const execAsync = promisify(exec);

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_BACKUP_BUCKET!;
const DATABASE_URL = process.env.DATABASE_URL!;

async function createBackup() {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm');
  const filename = `backup-${timestamp}.sql`;

  try {
    // Create backup using pg_dump
    const { stdout, stderr } = await execAsync(
      `pg_dump "${DATABASE_URL}" > ${filename}`
    );

    if (stderr) {
      throw new Error(`pg_dump error: ${stderr}`);
    }

    // Upload to S3
    const fileContent = await require('fs').promises.readFile(filename);
    await s3
      .upload({
        Bucket: BUCKET_NAME,
        Key: `backups/${filename}`,
        Body: fileContent,
      })
      .promise();

    // Clean up local file
    await require('fs').promises.unlink(filename);

    console.log(`Backup completed successfully: ${filename}`);
  } catch (error) {
    captureException(error as Error, {
      context: 'database-backup',
      filename,
    });
    throw error;
  }
}

// Run backup
createBackup().catch((error) => {
  console.error('Backup failed:', error);
  process.exit(1);
}); 