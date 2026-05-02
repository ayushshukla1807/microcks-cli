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
exports.MicrocksServicesProvider = exports.MessageItem = exports.OperationItem = exports.ServiceItem = void 0;
const vscode = __importStar(require("vscode"));
class ServiceItem extends vscode.TreeItem {
    constructor(service) {
        super(`${service.name} : ${service.version}`, vscode.TreeItemCollapsibleState.Collapsed);
        this.service = service;
        this.tooltip = `${service.type} — ${service.operations?.length ?? 0} operations`;
        this.iconPath = new vscode.ThemeIcon("symbol-interface");
        this.contextValue = "microcksService";
    }
}
exports.ServiceItem = ServiceItem;
class OperationItem extends vscode.TreeItem {
    constructor(operation) {
        super(`${operation.method ?? ""} ${operation.name}`.trim(), vscode.TreeItemCollapsibleState.None);
        this.operation = operation;
        this.iconPath = new vscode.ThemeIcon("symbol-method");
        this.contextValue = "microcksOperation";
    }
}
exports.OperationItem = OperationItem;
class MessageItem extends vscode.TreeItem {
    constructor(label, icon) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(icon);
        this.contextValue = "microcksMessage";
    }
}
exports.MessageItem = MessageItem;
class MicrocksServicesProvider {
    constructor(client) {
        this.client = client;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.services = null;
        this.error = null;
    }
    updateClient(client) {
        this.client = client;
    }
    refresh() {
        this.services = null;
        this.error = null;
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (element instanceof ServiceItem) {
            const ops = element.service.operations ?? [];
            if (ops.length === 0) {
                return [new MessageItem("no operations found", "info")];
            }
            return ops.map((op) => new OperationItem(op));
        }
        if (element) {
            return [];
        }
        // root level — fetch services if not cached
        if (this.services === null && this.error === null) {
            try {
                this.services = await this.client.getServices();
            }
            catch (err) {
                this.error = err instanceof Error ? err.message : String(err);
            }
        }
        if (this.error) {
            return [new MessageItem(`Could not connect: ${this.error}`, "error")];
        }
        if (!this.services || this.services.length === 0) {
            return [new MessageItem("no services found — import a spec first", "info")];
        }
        return this.services.map((svc) => new ServiceItem(svc));
    }
}
exports.MicrocksServicesProvider = MicrocksServicesProvider;
//# sourceMappingURL=servicesProvider.js.map