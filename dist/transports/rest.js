import { AuthenticationError, AuthorizationError, ServerError, TransportError, } from "../errors.js";
function trimTrailingSlash(value) {
    return value.endsWith("/") ? value.slice(0, -1) : value;
}
function policyPath(request) {
    const reference = request.reference ?? "version";
    return reference === "base"
        ? `/run/policy/${request.id}`
        : `/run/policy_version/${request.id}`;
}
function flowPath(request) {
    const reference = request.reference ?? "version";
    return reference === "base"
        ? `/run/flow/${request.id}`
        : `/run/flow_version/${request.id}`;
}
function encodeBody(data) {
    return JSON.stringify({ data });
}
function mapStatus(status, bodyText) {
    if (status === 401) {
        throw new AuthenticationError(bodyText || "request rejected: invalid API key");
    }
    if (status === 403) {
        throw new AuthorizationError(bodyText || "request rejected: insufficient permissions");
    }
    throw new ServerError(bodyText || `request failed with status ${status}`, {
        status,
    });
}
export class RestExecutionTransport {
    config;
    kind = "rest";
    fetchImpl;
    baseUrl;
    constructor(config, transport) {
        this.config = config;
        this.baseUrl = trimTrailingSlash(transport.baseUrl);
        this.fetchImpl = transport.fetch ?? fetch;
    }
    async executePolicy(request) {
        return this.send(policyPath(request), encodeBody(request.data), "policy");
    }
    async executeFlow(request) {
        return this.send(flowPath(request), encodeBody(request.data), "flow");
    }
    async send(path, body, kind) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 30_000);
        try {
            const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-api-key": this.config.apiKey,
                    ...(this.config.userAgent ? { "user-agent": this.config.userAgent } : {}),
                },
                body,
                signal: controller.signal,
            });
            const text = await response.text();
            if (!response.ok) {
                mapStatus(response.status, text);
            }
            const parsed = JSON.parse(text);
            return {
                ...parsed,
                kind,
            };
        }
        catch (error) {
            if (error instanceof AuthenticationError ||
                error instanceof AuthorizationError ||
                error instanceof ServerError) {
                throw error;
            }
            throw new TransportError("REST execution request failed", { cause: error });
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
