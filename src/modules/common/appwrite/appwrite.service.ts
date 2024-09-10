import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Client, Storage } from 'appwrite';
import axios from 'axios';
import * as FormData from 'form-data';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AppwriteService {
  private readonly endpoint: string;
  private readonly projectId: string;
  private readonly bucketId: string;
  private readonly client: Client;
  private readonly storage: Storage;
  private jwtToken: string;

  constructor() {
    this.endpoint = process.env.APPWRITE_ENDPOINT;
    this.projectId = process.env.APPWRITE_PROJECT_ID;
    this.bucketId = process.env.BUCKET_ID;

    this.client = new Client()
      .setEndpoint(this.endpoint)
      .setProject(this.projectId);

    this.storage = new Storage(this.client);
  }

  async uploadFiles(files: Express.Multer.File[]): Promise<any[]> {
    const uploadPromises = files.map(async (file) => {
      const fileId = uuidv4();
      const form = new FormData();
      form.append('file', Readable.from(file.buffer), {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      form.append('fileId', fileId);

      try {
        const response = await axios.post(
          `${this.endpoint}/storage/buckets/${this.bucketId}/files`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              'X-Appwrite-Project': this.projectId,
            },
          },
        );
        return response.data;
      } catch (error) {
        console.log(error);
        throw new InternalServerErrorException({
          message: `Error uploading file ${file.originalname}: ${error.message}`,
          cause: error.stack,
        });
      }
    });

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new InternalServerErrorException({
        message: `Error uploading files: ${error.message}`,
        cause: error.stack,
      });
    }
  }

  async getFileDetails(fileId: string): Promise<any> {
    try {
      const response = await this.storage.getFile(this.bucketId, fileId);
      return response;
    } catch (error) {
      console.error('Error fetching file details:', error);
      throw new InternalServerErrorException({
        message: `Error fetching file details for fileId ${fileId}: ${error.message}`,
        cause: error.stack,
      });
    }
  }
}
