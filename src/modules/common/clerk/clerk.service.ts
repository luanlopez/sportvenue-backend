import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class ClerkService {
  private readonly clerkApiUrl: string;
  private readonly clerkApiKey: string;

  constructor() {
    this.clerkApiUrl = 'https://api.clerk.dev/v1';
    this.clerkApiKey = process.env.CLERK_API_KEY;
  }

  async getUserDetails(userId: string): Promise<any> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.clerkApiUrl}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${this.clerkApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching user details from Clerk:`, error);
      throw new InternalServerErrorException({
        message: `Error fetching user details for userId ${userId}: ${error.message}`,
        cause: error.stack,
      });
    }
  }
}
