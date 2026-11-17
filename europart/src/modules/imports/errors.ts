export class ImportFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportFlowError";
  }
}
