import type { ServiceDefinition } from "@grpc/grpc-js";
export type GeneratedPolicyRequest = {
    policyId?: string;
    baseId?: string;
    data: Record<string, unknown>;
};
export type GeneratedFlowRequest = {
    flowId?: string;
    baseId?: string;
    data: Record<string, unknown>;
};
export declare const policyServiceDefinition: ServiceDefinition;
export declare const flowServiceDefinition: ServiceDefinition;
