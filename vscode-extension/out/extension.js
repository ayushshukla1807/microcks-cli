"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const microcksClient_1 = require("./microcksClient");
const servicesProvider_1 = require("./servicesProvider");
function activate(context) {
    const config = vscode.workspace.getConfiguration("microcks");
    const serverUrl = config.get("serverUrl") ?? "";
    const authToken = config.get("authToken") ?? "";
    if (!serverUrl) {
        vscode.window.showWarningMessage("Microcks: set microcks.serverUrl in settings to connect to a Microcks instance.");
    }
    const client = new microcksClient_1.MicrocksClient(serverUrl, authToken);
    const provider = new servicesProvider_1.MicrocksServicesProvider(client);
    context.subscriptions.push(vscode.window.registerTreeDataProvider("microcksServices", provider));
    context.subscriptions.push(vscode.commands.registerCommand("microcks.refresh", () => {
        provider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("microcks.configure", async () => {
        const url = await vscode.window.showInputBox({
            prompt: "Enter your Microcks server URL",
            value: serverUrl || "http://localhost:8585",
            placeHolder: "http://localhost:8585",
        });
        if (url !== undefined) {
            await vscode.workspace
                .getConfiguration("microcks")
                .update("serverUrl", url, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage(`Microcks: server URL set to ${url}. Refresh the services panel.`);
        }
    }));
    // re-register provider when config changes so new URL/token is picked up
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("microcks.serverUrl") ||
            e.affectsConfiguration("microcks.authToken")) {
            const updated = vscode.workspace.getConfiguration("microcks");
            const newUrl = updated.get("serverUrl") ?? "";
            const newToken = updated.get("authToken") ?? "";
            const newClient = new microcksClient_1.MicrocksClient(newUrl, newToken);
            provider.updateClient(newClient);
            provider.refresh();
        }
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map