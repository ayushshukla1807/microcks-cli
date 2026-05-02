import * as vscode from "vscode";
import { MicrocksClient } from "./microcksClient";
import { MicrocksServicesProvider } from "./servicesProvider";

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration("microcks");
  const serverUrl = config.get<string>("serverUrl") ?? "";
  const authToken = config.get<string>("authToken") ?? "";

  if (!serverUrl) {
    vscode.window.showWarningMessage(
      "Microcks: set microcks.serverUrl in settings to connect to a Microcks instance."
    );
  }

  const client = new MicrocksClient(serverUrl, authToken);
  const provider = new MicrocksServicesProvider(client);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("microcksServices", provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("microcks.refresh", () => {
      provider.refresh();
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
