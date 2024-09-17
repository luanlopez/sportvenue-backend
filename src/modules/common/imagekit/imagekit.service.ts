import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ImageKit = require('imagekit');
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageKitService {
  private readonly imagekit: ImageKit;

  constructor() {
    this.imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }

  async uploadFiles(files: Express.Multer.File[]): Promise<any[]> {
    const uploadPromises = files.map(async (file) => {
      const fileId = uuidv4();
      try {
        const response = await this.imagekit.upload({
          file: file.buffer,
          fileName: file.originalname,
          folder: 'uploads',
          tags: ['upload', fileId],
        });
        return response;
      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
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
      const response = await this.imagekit.getFileDetails(fileId);
      return response;
    } catch (error) {
      console.error('Error fetching file details:', error);
      throw new InternalServerErrorException({
        message: `Error fetching file details for fileId ${fileId}: ${error.message}`,
        cause: error.stack,
      });
    }
  }

  async deleteFile(fileId: string): Promise<any> {
    try {
      const response = await this.imagekit.deleteFile(fileId);
      return response;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new InternalServerErrorException({
        message: `Error deleting file with fileId ${fileId}: ${error.message}`,
        cause: error.stack,
      });
    }
  }
}
