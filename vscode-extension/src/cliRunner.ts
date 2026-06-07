import * as cp from "child_process";
import * as vscode from "vscode";
import { TestResultSummary } from "./testResult";

export class CliRunner {
  constructor(private binaryPath: string = "microcks-cli") {}

  async runTest(
    apiRef: string,
    testEndpoint: string,
    runner: string,
    serverUrl: string,
    authToken: string
  ): Promise<TestResultSummary> {
    return new Promise((resolve, reject) => {
      const args = [
        "test",
        apiRef,
        testEndpoint,
        runner,
        "--output", "json",
        "--server", serverUrl,
        "--token", authToken // Assuming we add these flags to CLI or use env/config
      ];

      // Note: In a real scenario, we might need to handle login or config paths.
      // For this prototype, we assume the CLI is configured or takes flags.
      
      const child = cp.spawn(this.binaryPath, args);
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code !== 0 && code !== 1) { // 1 is success=false in our CLI logic
           return reject(new Error(`CLI exited with code ${code}: ${stderr}`));
        }

        try {
          // Find the JSON block in stdout (in case there's other output)
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON output found from CLI");
          }
          const result = JSON.parse(jsonMatch[0]) as TestResultSummary;
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse CLI output: ${e}\nStdout: ${stdout}`));
        }
      });
    });
  }

  async importArtifact(
    artifactPath: string,
    serverUrl: string,
    authToken: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = ["import", artifactPath, "--server", serverUrl];
      if (authToken) {
        args.push("--token", authToken);
      }
      
      const child = cp.spawn(this.binaryPath, args);
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code !== 0) {
           return reject(new Error(`CLI exited with code ${code}: ${stderr}`));
        }
        resolve();
      });
    });
  }
}
