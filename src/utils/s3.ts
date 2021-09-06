import { GetObjectCommand, PutObjectCommand, PutObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const s3 = new S3Client({
    region: process.env.S3_BUCKET_REGION
});

interface File {
    path: string,
    filename: string
}

export async function moveFileToBucket(file: File, directory = ''): Promise<PutObjectCommandOutput> {
    try {
        const fileStream = fs.createReadStream(file.path);
        return s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: path.join(directory, file.filename),
            Body: fileStream
        }));
    } finally {
        await fs.promises.rm(file.path);
    }
}

export async function getFile(filename: string): Promise<Readable | null> {
    try {
        const data = await s3.send(new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: filename
        }));

        return data.Body as Readable;
    } catch (e) {
        return null;
    }
}

