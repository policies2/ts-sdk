import { ConfigurationError } from "./errors.js";
import { RestExecutionTransport } from "./transports/rest.js";
const DEFAULT_BASE_URL = "https://api.policy2.net";
export class ExecutionClient {
    config;
    transport;
    constructor(config) {
        this.config = config;
        if (!config.apiKey.trim()) {
            throw new ConfigurationError("apiKey is required");
        }
        const transport = {
            baseUrl: config.transport?.baseUrl ?? DEFAULT_BASE_URL,
            fetch: config.transport?.fetch,
        };
        this.transport = new RestExecutionTransport(config, transport);
    }
    executePolicy(request) {
        return this.transport.executePolicy(request);
    }
    executePolicyVersion(request) {
        return this.transport.executePolicyVersion(request);
    }
    executeFlow(request) {
        return this.transport.executeFlow(request);
    }
}
