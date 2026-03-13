import protobuf from "protobufjs";
const root = protobuf.Root.fromJSON({
    nested: {
        google: {
            nested: {
                protobuf: {
                    nested: {
                        NullValue: {
                            values: {
                                NULL_VALUE: 0,
                            },
                        },
                        Struct: {
                            fields: {
                                fields: {
                                    keyType: "string",
                                    type: "Value",
                                    id: 1,
                                },
                            },
                        },
                        Value: {
                            oneofs: {
                                kind: {
                                    oneof: [
                                        "nullValue",
                                        "numberValue",
                                        "stringValue",
                                        "boolValue",
                                        "structValue",
                                        "listValue",
                                    ],
                                },
                            },
                            fields: {
                                nullValue: {
                                    type: "NullValue",
                                    id: 1,
                                },
                                numberValue: {
                                    type: "double",
                                    id: 2,
                                },
                                stringValue: {
                                    type: "string",
                                    id: 3,
                                },
                                boolValue: {
                                    type: "bool",
                                    id: 4,
                                },
                                structValue: {
                                    type: "Struct",
                                    id: 5,
                                },
                                listValue: {
                                    type: "ListValue",
                                    id: 6,
                                },
                            },
                        },
                        ListValue: {
                            fields: {
                                values: {
                                    rule: "repeated",
                                    type: "Value",
                                    id: 1,
                                },
                            },
                        },
                    },
                },
            },
        },
        policy: {
            nested: {
                v1: {
                    nested: {
                        RunPolicyRequest: {
                            fields: {
                                policyId: {
                                    type: "string",
                                    id: 1,
                                },
                                data: {
                                    type: "google.protobuf.Struct",
                                    id: 2,
                                },
                                baseId: {
                                    type: "string",
                                    id: 3,
                                },
                            },
                        },
                        RunFlowRequest: {
                            fields: {
                                flowId: {
                                    type: "string",
                                    id: 1,
                                },
                                data: {
                                    type: "google.protobuf.Struct",
                                    id: 2,
                                },
                                baseId: {
                                    type: "string",
                                    id: 3,
                                },
                            },
                        },
                        OrchestratorTiming: {
                            fields: {
                                go: {
                                    type: "string",
                                    id: 1,
                                },
                                database: {
                                    type: "string",
                                    id: 2,
                                },
                                total: {
                                    type: "string",
                                    id: 3,
                                },
                            },
                        },
                        ExecutionTiming: {
                            fields: {
                                orchestrator: {
                                    type: "OrchestratorTiming",
                                    id: 1,
                                },
                                engine: {
                                    type: "string",
                                    id: 2,
                                },
                                total: {
                                    type: "string",
                                    id: 3,
                                },
                            },
                        },
                        RunResponse: {
                            fields: {
                                result: {
                                    type: "bool",
                                    id: 1,
                                },
                                trace: {
                                    type: "google.protobuf.Struct",
                                    id: 2,
                                },
                                rule: {
                                    rule: "repeated",
                                    type: "string",
                                    id: 3,
                                },
                                data: {
                                    type: "google.protobuf.Struct",
                                    id: 4,
                                },
                                error: {
                                    type: "google.protobuf.Struct",
                                    id: 5,
                                },
                                labels: {
                                    type: "google.protobuf.Struct",
                                    id: 6,
                                },
                                execution: {
                                    type: "ExecutionTiming",
                                    id: 7,
                                },
                            },
                        },
                        FlowNodeExecution: {
                            fields: {
                                database: {
                                    type: "string",
                                    id: 1,
                                },
                                engine: {
                                    type: "string",
                                    id: 2,
                                },
                                total: {
                                    type: "string",
                                    id: 3,
                                },
                            },
                        },
                        FlowExecutionTiming: {
                            fields: {
                                orchestrator: {
                                    type: "string",
                                    id: 1,
                                },
                                database: {
                                    type: "string",
                                    id: 2,
                                },
                                engine: {
                                    type: "string",
                                    id: 3,
                                },
                                total: {
                                    type: "string",
                                    id: 4,
                                },
                            },
                        },
                        FlowNodeResponse: {
                            fields: {
                                nodeId: {
                                    type: "string",
                                    id: 1,
                                },
                                nodeType: {
                                    type: "string",
                                    id: 2,
                                },
                                response: {
                                    type: "RunResponse",
                                    id: 3,
                                },
                                execution: {
                                    type: "FlowNodeExecution",
                                    id: 4,
                                },
                            },
                        },
                        FlowResponse: {
                            fields: {
                                result: {
                                    type: "google.protobuf.Value",
                                    id: 1,
                                },
                                nodeResponse: {
                                    rule: "repeated",
                                    type: "FlowNodeResponse",
                                    id: 2,
                                },
                                execution: {
                                    type: "FlowExecutionTiming",
                                    id: 3,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
});
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
