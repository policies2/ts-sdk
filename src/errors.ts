export class SDKError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = new.target.name;

    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export class ConfigurationError extends SDKError {}

export class TransportError extends SDKError {}

export class AuthenticationError extends SDKError {}

export class AuthorizationError extends SDKError {}

export class UnsupportedFeatureError extends SDKError {}

export class ServerError extends SDKError {
  readonly status?: number;

  constructor(message: string, options?: { cause?: unknown; status?: number }) {
    super(message, options);
    this.status = options?.status;
  }
}
