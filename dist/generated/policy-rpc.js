import protobuf from "protobufjs";
import schema from "./policy-rpc.schema.js";
const root = protobuf.Root.fromJSON(schema);
const conversionOptions = {
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
function serialize(type, value) {
    return Buffer.from(type.encode(type.fromObject(value)).finish());
}
function deserialize(type, bytes) {
    return type.toObject(type.decode(bytes), conversionOptions);
}
export const policyServiceDefinition = {
    RunPolicy: {
        path: "/policy.v1.PolicyService/RunPolicy",
        requestStream: false,
        responseStream: false,
        requestSerialize: (value) => serialize(runPolicyRequestType, value),
        requestDeserialize: (bytes) => deserialize(runPolicyRequestType, bytes),
        responseSerialize: (value) => serialize(runResponseType, value),
        responseDeserialize: (bytes) => deserialize(runResponseType, bytes),
        originalName: "runPolicy",
    },
};
export const flowServiceDefinition = {
    RunFlow: {
        path: "/policy.v1.FlowService/RunFlow",
        requestStream: false,
        responseStream: false,
        requestSerialize: (value) => serialize(runFlowRequestType, value),
        requestDeserialize: (bytes) => deserialize(runFlowRequestType, bytes),
        responseSerialize: (value) => serialize(flowResponseType, value),
        responseDeserialize: (bytes) => deserialize(flowResponseType, bytes),
        originalName: "runFlow",
    },
};
