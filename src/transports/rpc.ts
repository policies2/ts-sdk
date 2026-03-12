import {
  AuthenticationError,
  AuthorizationError,
  ConfigurationError,
  ServerError,
  TransportError,
} from "../errors.js";
import type {
  ExecuteFlowRequest,
  ExecutePolicyRequest,
  ExecutionClientConfig,
  FlowExecutionResult,
  JsonObject,
  PolicyExecutionResult,
  RpcTransportConfig,
} from "../types.js";

const PROTO_PATH = new URL("../../proto/policy.proto", import.meta.url);

type RpcMetadata = {
  add: (key: string, value: string) => void;
};

type GrpcModule = {
  credentials: {
    createInsecure: () => unknown;
    createSsl: () => unknown;
  };
  Metadata: new () => RpcMetadata;
  status: {
    UNAUTHENTICATED: number;
    PERMISSION_DENIED: number;
  };
  loadPackageDefinition: (definition: unknown) => unknown;
};

type ProtoLoaderModule = {
  load: (path: string, options: Record<string, unknown>) => Promise<unknown>;
};

type PolicyServiceClient = {
  RunPolicy: (
    request: { policyId?: string; baseId?: string; data: JsonObject },
    metadata: RpcMetadata,
    callback: (error: RpcServiceError | null, response?: RpcPolicyResponse) => void,
  ) => void;
};

type FlowServiceClient = {
  RunFlow: (
    request: { flowId?: string; baseId?: string; data: JsonObject },
    metadata: RpcMetadata,
    callback: (error: RpcServiceError | null, response?: RpcFlowResponse) => void,
  ) => void;
};

type RpcServiceError = Error & { code?: number };

type RpcPolicyResponse = Omit<PolicyExecutionResult, "kind">;
type RpcFlowResponse = Omit<FlowExecutionResult, "kind">;

type PolicyServiceCtor = new (address: string, credentials: unknown) => PolicyServiceClient;
type FlowServiceCtor = new (address: string, credentials: unknown) => FlowServiceClient;

export class RpcExecutionTransport {
  readonly kind = "rpc";
  private policyClientPromise?: Promise<PolicyServiceClient>;
  private flowClientPromise?: Promise<FlowServiceClient>;

  constructor(
    private readonly config: ExecutionClientConfig,
    private readonly transport: RpcTransportConfig,
  ) {}

  async executePolicy(request: ExecutePolicyRequest): Promise<PolicyExecutionResult> {
    const client = await this.getPolicyClient();
    const response = await this.invokePolicy(client, request);
    return {
      ...response,
      kind: "policy",
    };
  }

  async executeFlow(request: ExecuteFlowRequest): Promise<FlowExecutionResult> {
    const client = await this.getFlowClient();
    const response = await this.invokeFlow(client, request);
    return {
      ...response,
      kind: "flow",
    };
  }

  private getPolicyClient(): Promise<PolicyServiceClient> {
    this.policyClientPromise ??= this.createPolicyClient();
    return this.policyClientPromise;
  }

  private getFlowClient(): Promise<FlowServiceClient> {
    this.flowClientPromise ??= this.createFlowClient();
    return this.flowClientPromise;
  }

  private async createPolicyClient(): Promise<PolicyServiceClient> {
    const { grpcModule, packageDefinition } = await this.loadModules();
    const loaded = grpcModule.loadPackageDefinition(packageDefinition) as {
      policy: {
        v1: {
          PolicyService: PolicyServiceCtor;
        };
      };
    };
    return new loaded.policy.v1.PolicyService(this.transport.address, await this.credentials(grpcModule));
  }

  private async createFlowClient(): Promise<FlowServiceClient> {
    const { grpcModule, packageDefinition } = await this.loadModules();
    const loaded = grpcModule.loadPackageDefinition(packageDefinition) as {
      policy: {
        v1: {
          FlowService: FlowServiceCtor;
        };
      };
    };
    return new loaded.policy.v1.FlowService(this.transport.address, await this.credentials(grpcModule));
  }

  private async loadModules(): Promise<{ grpcModule: GrpcModule; packageDefinition: unknown }> {
    try {
      const [grpcImport, loaderImport] = await Promise.all([
        import("@grpc/grpc-js"),
        import("@grpc/proto-loader"),
      ]);

      const grpcModule = grpcImport as unknown as GrpcModule;
      const protoLoader = loaderImport as unknown as ProtoLoaderModule;
      const packageDefinition = await protoLoader.load(PROTO_PATH.pathname, {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      return { grpcModule, packageDefinition };
    } catch (error) {
      throw new ConfigurationError("failed to load gRPC runtime dependencies", {
        cause: error,
      });
    }
  }

  private async credentials(grpcModule: GrpcModule): Promise<unknown> {
    if (this.transport.grpcCredentialsFactory) {
      return this.transport.grpcCredentialsFactory();
    }

    return this.transport.tls ? grpcModule.credentials.createSsl() : grpcModule.credentials.createInsecure();
  }

  private async invokePolicy(
    client: PolicyServiceClient,
    request: ExecutePolicyRequest,
  ): Promise<RpcPolicyResponse> {
    const grpcModule = (await import("@grpc/grpc-js")) as unknown as GrpcModule;
    const metadata = new grpcModule.Metadata();
    metadata.add("x-api-key", this.config.apiKey);
    const rpcRequest =
      (request.reference ?? "version") === "base"
        ? { baseId: request.id, data: request.data }
        : { policyId: request.id, data: request.data };

    return new Promise((resolve, reject) => {
      client.RunPolicy(rpcRequest, metadata, (error, response) => {
        if (error) {
          reject(this.mapRpcError(error, grpcModule));
          return;
        }

        resolve(response ?? { result: false, trace: null, rule: [], data: null, error: null, labels: null });
      });
    });
  }

  private async invokeFlow(
    client: FlowServiceClient,
    request: ExecuteFlowRequest,
  ): Promise<RpcFlowResponse> {
    const grpcModule = (await import("@grpc/grpc-js")) as unknown as GrpcModule;
    const metadata = new grpcModule.Metadata();
    metadata.add("x-api-key", this.config.apiKey);
    const rpcRequest =
      (request.reference ?? "version") === "base"
        ? { baseId: request.id, data: request.data }
        : { flowId: request.id, data: request.data };

    return new Promise((resolve, reject) => {
      client.RunFlow(rpcRequest, metadata, (error, response) => {
        if (error) {
          reject(this.mapRpcError(error, grpcModule));
          return;
        }

        resolve(response ?? { result: null, nodeResponse: [] });
      });
    });
  }

  private mapRpcError(error: RpcServiceError, grpcModule: GrpcModule): Error {
    if (error.code === grpcModule.status.UNAUTHENTICATED) {
      return new AuthenticationError(error.message, { cause: error });
    }

    if (error.code === grpcModule.status.PERMISSION_DENIED) {
      return new AuthorizationError(error.message, { cause: error });
    }

    if (error.code !== undefined) {
      return new ServerError(error.message, { cause: error });
    }

    return new TransportError("RPC execution request failed", { cause: error });
  }
}
