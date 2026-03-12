import type { ExecuteFlowRequest, ExecutePolicyRequest, ExecutionClientConfig, FlowExecutionResult, PolicyExecutionResult, RpcTransportConfig } from "../types.js";
export declare class RpcExecutionTransport {
    private readonly config;
    private readonly transport;
    readonly kind = "rpc";
    private policyClientPromise?;
    private flowClientPromise?;
    private static readonly DEFAULT_TIMEOUT_MS;
    constructor(config: ExecutionClientConfig, transport: RpcTransportConfig);
    executePolicy(request: ExecutePolicyRequest): Promise<PolicyExecutionResult>;
    executeFlow(request: ExecuteFlowRequest): Promise<FlowExecutionResult>;
    private getPolicyClient;
    private getFlowClient;
    private createPolicyClient;
    private createFlowClient;
    private loadModules;
    private credentials;
    private invokePolicy;
    private invokeFlow;
    private mapRpcError;
}
