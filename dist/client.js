import { ConfigurationError } from "./errors.js";
import { RestExecutionTransport } from "./transports/rest.js";
import { RpcExecutionTransport } from "./transports/rpc.js";
export class ExecutionClient {
    config;
    transport;
    constructor(config) {
        this.config = config;
        if (!config.apiKey.trim()) {
            throw new ConfigurationError("apiKey is required");
        }
        if (config.transport.kind === "rest") {
            this.transport = new RestExecutionTransport(config, config.transport);
            return;
        }
        this.transport = new RpcExecutionTransport(config, config.transport);
    }
    executePolicy(request) {
        return this.transport.executePolicy(request);
    }
    executeFlow(request) {
        return this.transport.executeFlow(request);
    }
}
