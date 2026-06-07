import * as vscode from "vscode";
import { MicrocksClient } from "./microcksClient";
import { MicrocksServicesProvider, OperationItem } from "./servicesProvider";
import { CliRunner } from "./cliRunner";

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration("microcks");
  const serverUrl = config.get<string>("serverUrl") ?? "";
  const authToken = config.get<string>("authToken") ?? "";
  const cliPath = config.get<string>("cliPath") ?? "microcks-cli";

  if (!serverUrl) {
    vscode.window.showWarningMessage(
      "Microcks: set microcks.serverUrl in settings to connect to a Microcks instance."
    );
  }

  const client = new MicrocksClient(serverUrl, authToken);
  const provider = new MicrocksServicesProvider(client);
  const cliRunner = new CliRunner(cliPath);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("microcksServices", provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("microcks.refresh", () => {
      provider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("microcks.test", async (item: OperationItem) => {
      if (!item) {
        return;
      }

      const testEndpoint = await vscode.window.showInputBox({
        prompt: `Enter test endpoint for ${item.operation.name}`,
        placeHolder: "http://my-service-under-test.com/api",
      });

      if (!testEndpoint) {
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Running Microcks test for ${item.operation.name}...`,
          cancellable: false,
        },
        async (progress) => {
          try {
            const apiRef = `${item.serviceName}:${item.serviceVersion}`;
            // For the prototype, we default to HTTP runner.
            // In a real version, we'd detect the service type or ask the user.
            const result = await cliRunner.runTest(
              apiRef,
              testEndpoint,
              "HTTP",
              serverUrl,
              authToken
            );

            if (result.success) {
              vscode.window.showInformationMessage(
                `Microcks Test Succeeded! Result ID: ${result.id}`
              );
            } else {
              vscode.window.showErrorMessage(
                `Microcks Test Failed. Result ID: ${result.id}. Check full report at ${serverUrl}/#/tests/${result.id}`
              );
            }
          } catch (e: any) {
            vscode.window.showErrorMessage(`Microcks CLI Error: ${e.message}`);
          }
        }
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("microcks.import", async (uri: vscode.Uri) => {
      let artifactPath = uri?.fsPath;

      if (!artifactPath) {
        const fileUris = await vscode.window.showOpenDialog({
          canSelectMany: false,
          openLabel: "Import to Microcks",
          filters: {
            "API Artifacts": ["yaml", "yml", "json", "wsdl", "xml", "proto"]
          }
        });
        if (fileUris && fileUris[0]) {
          artifactPath = fileUris[0].fsPath;
        } else {
          return;
        }
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Importing API Artifact to Microcks...`,
          cancellable: false,
        },
        async () => {
          try {
            await cliRunner.importArtifact(artifactPath, serverUrl, authToken);
            vscode.window.showInformationMessage("Microcks: Artifact successfully imported.");
            provider.refresh();
          } catch (e: any) {
            vscode.window.showErrorMessage(`Microcks CLI Error: ${e.message}`);
          }
        }
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("microcks.configure", async () => {
      const url = await vscode.window.showInputBox({
        prompt: "Enter your Microcks server URL",
        value: serverUrl || "http://localhost:8585",
        placeHolder: "http://localhost:8585",
      });
      if (url !== undefined) {
        await vscode.workspace
          .getConfiguration("microcks")
          .update("serverUrl", url, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage(
          `Microcks: server URL set to ${url}. Refresh the services panel.`
        );
      }
    })
  );

  // re-register provider when config changes so new URL/token is picked up
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("microcks.serverUrl") ||
        e.affectsConfiguration("microcks.authToken")
      ) {
        const updated = vscode.workspace.getConfiguration("microcks");
        const newUrl = updated.get<string>("serverUrl") ?? "";
        const newToken = updated.get<string>("authToken") ?? "";
        const newClient = new MicrocksClient(newUrl, newToken);
        provider.updateClient(newClient);
        provider.refresh();
      }
    })
  );
}

export function deactivate(): void {}
