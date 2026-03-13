export declare class SDKError extends Error {
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
export declare class ConfigurationError extends SDKError {
}
export declare class TransportError extends SDKError {
}
export declare class AuthenticationError extends SDKError {
}
export declare class AuthorizationError extends SDKError {
}
export declare class UnsupportedFeatureError extends SDKError {
}
export declare class ServerError extends SDKError {
    readonly status?: number;
    constructor(message: string, options?: {
        cause?: unknown;
        status?: number;
    });
}
