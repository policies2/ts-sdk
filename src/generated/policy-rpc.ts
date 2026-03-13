import protobuf from "protobufjs";
import type { ServiceDefinition } from "@grpc/grpc-js";
import schema from "./policy-rpc.schema.js";

const root = protobuf.Root.fromJSON(schema as any);

const conversionOptions: protobuf.IConversionOptions = {
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  json: true,
};

const runPolicyRequestType = root.lookupType("policy.v1.RunPolicyRequest");
const runFlowRequestType = root.lookupType("policy.v1.RunFlowRequest");
const runResponseType = root.lookupType("policy.v1.RunResponse");
const flowResponseType = root.lookupType("policy.v1.FlowResponse");

function serialize(type: protobuf.Type, value: unknown): Buffer {
  return Buffer.from(type.encode(type.fromObject(value as Record<string, unknown>)).finish());
}

function deserialize(type: protobuf.Type, bytes: Buffer): unknown {
  return type.toObject(type.decode(bytes), conversionOptions);
}

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

export const policyServiceDefinition: ServiceDefinition = {
  RunPolicy: {
    path: "/policy.v1.PolicyService/RunPolicy",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GeneratedPolicyRequest) => serialize(runPolicyRequestType, value),
    requestDeserialize: (bytes: Buffer) => deserialize(runPolicyRequestType, bytes),
    responseSerialize: (value: unknown) => serialize(runResponseType, value),
    responseDeserialize: (bytes: Buffer) => deserialize(runResponseType, bytes),
    originalName: "runPolicy",
  },
};

export const flowServiceDefinition: ServiceDefinition = {
  RunFlow: {
    path: "/policy.v1.FlowService/RunFlow",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GeneratedFlowRequest) => serialize(runFlowRequestType, value),
    requestDeserialize: (bytes: Buffer) => deserialize(runFlowRequestType, bytes),
    responseSerialize: (value: unknown) => serialize(flowResponseType, value),
    responseDeserialize: (bytes: Buffer) => deserialize(flowResponseType, bytes),
    originalName: "runFlow",
  },
};
