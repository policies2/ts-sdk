export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface OrchestratorTiming {
  go: string;
  database: string;
  total: string;
}

export interface ExecutionTiming {
  orchestrator: OrchestratorTiming;
  engine: string;
  total: string;
}

export interface PolicyExecutionResult {
  kind: "policy";
  result: boolean;
  trace: unknown;
  rule: string[];
  data: unknown;
  error: unknown;
  labels: unknown;
  execution?: ExecutionTiming;
}

export interface FlowNodeExecution {
  database: string;
  engine: string;
  total: string;
}

export interface FlowNodeResponse {
  nodeId: string;
  nodeType: string;
  response: Omit<PolicyExecutionResult, "kind">;
  execution?: FlowNodeExecution;
}

export interface FlowExecutionTiming {
  orchestrator: string;
  database: string;
  engine: string;
  total: string;
}

export interface FlowExecutionResult {
  kind: "flow";
  result: unknown;
  nodeResponse: FlowNodeResponse[];
  execution?: FlowExecutionTiming;
}

export interface ExecutePolicyRequest {
  id: string;
  data: JsonObject;
  reference?: "base" | "version";
}

export interface ExecuteFlowRequest {
  id: string;
  data: JsonObject;
  reference?: "base" | "version";
}

export interface RestTransportConfig {
  kind: "rest";
  baseUrl: string;
  fetch?: typeof fetch;
}

export interface RpcTransportConfig {
  kind: "rpc";
  address: string;
  tls?: boolean;
  grpcCredentialsFactory?: () => Promise<unknown> | unknown;
}

export type TransportConfig = RestTransportConfig | RpcTransportConfig;

export interface ExecutionClientConfig {
  apiKey: string;
  transport: TransportConfig;
  timeoutMs?: number;
  userAgent?: string;
}
