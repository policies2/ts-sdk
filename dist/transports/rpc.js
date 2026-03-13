import { AuthenticationError, AuthorizationError, ServerError, TransportError, } from "../errors.js";
import { flowServiceDefinition, policyServiceDefinition, } from "../generated/policy-rpc.js";
export class RpcExecutionTransport {
    config;
    transport;
    kind = "rpc";
    policyClientPromise;
    flowClientPromise;
    static DEFAULT_TIMEOUT_MS = 30_000;
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
        const grpcModule = await this.loadGrpcModule();
        const ClientCtor = grpcModule.makeGenericClientConstructor(policyServiceDefinition, "PolicyService");
        return new ClientCtor(this.transport.address, await this.credentials(grpcModule));
    }
    async createFlowClient() {
        const grpcModule = await this.loadGrpcModule();
        const ClientCtor = grpcModule.makeGenericClientConstructor(flowServiceDefinition, "FlowService");
        return new ClientCtor(this.transport.address, await this.credentials(grpcModule));
    }
    async loadGrpcModule() {
        try {
            return (await import("@grpc/grpc-js"));
        }
        catch (error) {
            throw new TransportError("failed to load gRPC runtime dependencies", {
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
        const options = {
            deadline: new Date(Date.now() + (this.config.timeoutMs ?? RpcExecutionTransport.DEFAULT_TIMEOUT_MS)),
        };
        const rpcRequest = (request.reference ?? "version") === "base"
            ? { baseId: request.id, data: request.data }
            : { policyId: request.id, data: request.data };
        return new Promise((resolve, reject) => {
            client.RunPolicy(rpcRequest, metadata, options, (error, response) => {
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
        const options = {
            deadline: new Date(Date.now() + (this.config.timeoutMs ?? RpcExecutionTransport.DEFAULT_TIMEOUT_MS)),
        };
        const rpcRequest = (request.reference ?? "version") === "base"
            ? { baseId: request.id, data: request.data }
            : { flowId: request.id, data: request.data };
        return new Promise((resolve, reject) => {
            client.RunFlow(rpcRequest, metadata, options, (error, response) => {
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
