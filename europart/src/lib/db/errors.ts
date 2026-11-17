export class DataUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Данные временно недоступны.");
    this.name = "DataUnavailableError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export async function withDatabase<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof DataUnavailableError) {
      throw error;
    }
    throw new DataUnavailableError(error);
  }
}
