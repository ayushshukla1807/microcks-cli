export interface MicrocksOperation {
  name: string;
  method: string;
  dispatcher?: string;
}

export interface MicrocksService {
  id: string;
  name: string;
  version: string;
  type: string;
  operations: MicrocksOperation[];
}

export class MicrocksClient {
  constructor(private serverUrl: string, private authToken: string) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = { Accept: "application/json" };
    if (this.authToken) {
      h["Authorization"] = `Bearer ${this.authToken}`;
    }
    return h;
  }

  async getServices(): Promise<MicrocksService[]> {
    const url = `${this.serverUrl.replace(/\/$/, "")}/api/services?page=0&size=50`;
    const resp = await fetch(url, { headers: this.headers() });
    if (!resp.ok) {
      throw new Error(`Microcks API returned ${resp.status} ${resp.statusText}`);
    }
    return resp.json() as Promise<MicrocksService[]>;
  }
}
