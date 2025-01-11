export class CustomApiError extends Error {
  constructor(
    public title: string,
    public message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'CustomApiError';
  }
}
