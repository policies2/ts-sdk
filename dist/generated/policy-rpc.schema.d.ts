declare const schema: {
    readonly nested: {
        readonly google: {
            readonly nested: {
                readonly protobuf: {
                    readonly nested: {
                        readonly NullValue: {
                            readonly values: {
                                readonly NULL_VALUE: 0;
                            };
                        };
                        readonly Struct: {
                            readonly fields: {
                                readonly fields: {
                                    readonly keyType: "string";
                                    readonly type: "Value";
                                    readonly id: 1;
                                };
                            };
                        };
                        readonly Value: {
                            readonly oneofs: {
                                readonly kind: {
                                    readonly oneof: readonly ["nullValue", "numberValue", "stringValue", "boolValue", "structValue", "listValue"];
                                };
                            };
                            readonly fields: {
                                readonly nullValue: {
                                    readonly type: "NullValue";
                                    readonly id: 1;
                                };
                                readonly numberValue: {
                                    readonly type: "double";
                                    readonly id: 2;
                                };
                                readonly stringValue: {
                                    readonly type: "string";
                                    readonly id: 3;
                                };
                                readonly boolValue: {
                                    readonly type: "bool";
                                    readonly id: 4;
                                };
                                readonly structValue: {
                                    readonly type: "Struct";
                                    readonly id: 5;
                                };
                                readonly listValue: {
                                    readonly type: "ListValue";
                                    readonly id: 6;
                                };
                            };
                        };
                        readonly ListValue: {
                            readonly fields: {
                                readonly values: {
                                    readonly rule: "repeated";
                                    readonly type: "Value";
                                    readonly id: 1;
                                };
                            };
                        };
                    };
                };
            };
        };
        readonly policy: {
            readonly nested: {
                readonly v1: {
                    readonly nested: {
                        readonly RunPolicyRequest: {
                            readonly fields: {
                                readonly policyId: {
                                    readonly type: "string";
                                    readonly id: 1;
                                };
                                readonly data: {
                                    readonly type: "google.protobuf.Struct";
                                    readonly id: 2;
                                };
                                readonly baseId: {
                                    readonly type: "string";
                                    readonly id: 3;
                                };
                            };
                        };
                        readonly RunFlowRequest: {
                            readonly fields: {
                                readonly flowId: {
                                    readonly type: "string";
                                    readonly id: 1;
                                };
                                readonly data: {
                                    readonly type: "google.protobuf.Struct";
                                    readonly id: 2;
                                };
                                readonly baseId: {
                                    readonly type: "string";
                                    readonly id: 3;
                                };
                            };
                        };
                        readonly OrchestratorTiming: {
                            readonly fields: {
                                readonly go: {
                                    readonly type: "string";
                                    readonly id: 1;
                                };
                                readonly database: {
                                    readonly type: "string";
                                    readonly id: 2;
                                };
                                readonly total: {
                                    readonly type: "string";
                                    readonly id: 3;
                                };
                            };
                        };
                        readonly ExecutionTiming: {
                            readonly fields: {
                                readonly orchestrator: {
                                    readonly type: "OrchestratorTiming";
                                    readonly id: 1;
                                };
                                readonly engine: {
                                    readonly type: "string";
                                    readonly id: 2;
                                };
                                readonly total: {
                                    readonly type: "string";
                                    readonly id: 3;
                                };
                            };
                        };
                        readonly RunResponse: {
                            readonly fields: {
                                readonly result: {
                                    readonly type: "bool";
                                    readonly id: 1;
                                };
                                readonly trace: {
                                    readonly type: "google.protobuf.Struct";
                                    readonly id: 2;
                                };
                                readonly rule: {
                                    readonly rule: "repeated";
                                    readonly type: "string";
                                    readonly id: 3;
                                };
                                readonly data: {
                                    readonly type: "google.protobuf.Struct";
                                    readonly id: 4;
                                };
                                readonly error: {
                                    readonly type: "google.protobuf.Struct";
                                    readonly id: 5;
                                };
                                readonly labels: {
                                    readonly type: "google.protobuf.Struct";
                                    readonly id: 6;
                                };
                                readonly execution: {
                                    readonly type: "ExecutionTiming";
                                    readonly id: 7;
                                };
                            };
                        };
                        readonly FlowNodeExecution: {
                            readonly fields: {
                                readonly database: {
                                    readonly type: "string";
                                    readonly id: 1;
                                };
                                readonly engine: {
                                    readonly type: "string";
                                    readonly id: 2;
                                };
                                readonly total: {
                                    readonly type: "string";
                                    readonly id: 3;
                                };
                            };
                        };
                        readonly FlowExecutionTiming: {
                            readonly fields: {
                                readonly orchestrator: {
                                    readonly type: "string";
                                    readonly id: 1;
                                };
                                readonly database: {
                                    readonly type: "string";
                                    readonly id: 2;
                                };
                                readonly engine: {
                                    readonly type: "string";
                                    readonly id: 3;
                                };
                                readonly total: {
                                    readonly type: "string";
                                    readonly id: 4;
                                };
                            };
                        };
                        readonly FlowNodeResponse: {
                            readonly fields: {
                                readonly nodeId: {
                                    readonly type: "string";
                                    readonly id: 1;
                                };
                                readonly nodeType: {
                                    readonly type: "string";
                                    readonly id: 2;
                                };
                                readonly response: {
                                    readonly type: "RunResponse";
                                    readonly id: 3;
                                };
                                readonly execution: {
                                    readonly type: "FlowNodeExecution";
                                    readonly id: 4;
                                };
                            };
                        };
                        readonly FlowResponse: {
                            readonly fields: {
                                readonly result: {
                                    readonly type: "google.protobuf.Value";
                                    readonly id: 1;
                                };
                                readonly nodeResponse: {
                                    readonly rule: "repeated";
                                    readonly type: "FlowNodeResponse";
                                    readonly id: 2;
                                };
                                readonly execution: {
                                    readonly type: "FlowExecutionTiming";
                                    readonly id: 3;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
};
export default schema;
