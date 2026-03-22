import { ConfigurationError } from "./errors.js";
import { RestExecutionTransport } from "./transports/rest.js";
export class ExecutionClient {
    config;
    transport;
    constructor(config) {
        this.config = config;
        if (!config.apiKey.trim()) {
            throw new ConfigurationError("apiKey is required");
        }
        this.transport = new RestExecutionTransport(config, config.transport);
    }
    executePolicy(request) {
        return this.transport.executePolicy(request);
    }
    executeFlow(request) {
        return this.transport.executeFlow(request);
    }
}
