"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicrocksClient = void 0;
class MicrocksClient {
    constructor(serverUrl, authToken) {
        this.serverUrl = serverUrl;
        this.authToken = authToken;
    }
    headers() {
        const h = { Accept: "application/json" };
        if (this.authToken) {
            h["Authorization"] = `Bearer ${this.authToken}`;
        }
        return h;
    }
    async getServices() {
        const url = `${this.serverUrl.replace(/\/$/, "")}/api/services?page=0&size=50`;
        const resp = await fetch(url, { headers: this.headers() });
        if (!resp.ok) {
            throw new Error(`Microcks API returned ${resp.status} ${resp.statusText}`);
        }
        return resp.json();
    }
}
exports.MicrocksClient = MicrocksClient;
//# sourceMappingURL=microcksClient.js.map