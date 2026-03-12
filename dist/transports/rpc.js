import { AuthenticationError, AuthorizationError, ConfigurationError, ServerError, TransportError, } from "../errors.js";
const PROTO_PATH = new URL("../../proto/policy.proto", import.meta.url);
export class RpcExecutionTransport {
    config;
    transport;
    kind = "rpc";
    policyClientPromise;
    flowClientPromise;
    constructor(config, transport) {
        this.config = config;
        this.transport = transport;
    }
    async executePolicy(request) {
        const client = await this.getPolicyClient();
        const response = await this.invokePolicy(client, request);
        return {
            ...response,
            kind: "policy",
        };
    }
    async executeFlow(request) {
        const client = await this.getFlowClient();
        const response = await this.invokeFlow(client, request);
        return {
            ...response,
            kind: "flow",
        };
    }
    getPolicyClient() {
        this.policyClientPromise ??= this.createPolicyClient();
        return this.policyClientPromise;
    }
    getFlowClient() {
        this.flowClientPromise ??= this.createFlowClient();
        return this.flowClientPromise;
    }
    async createPolicyClient() {
        const { grpcModule, packageDefinition } = await this.loadModules();
        const loaded = grpcModule.loadPackageDefinition(packageDefinition);
        return new loaded.policy.v1.PolicyService(this.transport.address, await this.credentials(grpcModule));
    }
    async createFlowClient() {
        const { grpcModule, packageDefinition } = await this.loadModules();
        const loaded = grpcModule.loadPackageDefinition(packageDefinition);
        return new loaded.policy.v1.FlowService(this.transport.address, await this.credentials(grpcModule));
    }
    async loadModules() {
        try {
            const [grpcImport, loaderImport] = await Promise.all([
                import("@grpc/grpc-js"),
                import("@grpc/proto-loader"),
            ]);
            const grpcModule = grpcImport;
            const protoLoader = loaderImport;
            const packageDefinition = await protoLoader.load(PROTO_PATH.pathname, {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            });
            return { grpcModule, packageDefinition };
        }
        catch (error) {
            throw new ConfigurationError("failed to load gRPC runtime dependencies", {
                cause: error,
            });
        }
    }
    async credentials(grpcModule) {
        if (this.transport.grpcCredentialsFactory) {
            return this.transport.grpcCredentialsFactory();
        }
        return this.transport.tls ? grpcModule.credentials.createSsl() : grpcModule.credentials.createInsecure();
    }
    async invokePolicy(client, request) {
        const grpcModule = (await import("@grpc/grpc-js"));
        const metadata = new grpcModule.Metadata();
        metadata.add("x-api-key", this.config.apiKey);
        const rpcRequest = (request.reference ?? "version") === "base"
            ? { base_id: request.id, data: request.data }
            : { policy_id: request.id, data: request.data };
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
    async invokeFlow(client, request) {
        const grpcModule = (await import("@grpc/grpc-js"));
        const metadata = new grpcModule.Metadata();
        metadata.add("x-api-key", this.config.apiKey);
        const rpcRequest = (request.reference ?? "version") === "base"
            ? { base_id: request.id, data: request.data }
            : { flow_id: request.id, data: request.data };
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
    mapRpcError(error, grpcModule) {
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
