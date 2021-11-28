"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlugin = void 0;
class BasePlugin {
    cleanup() { }
    // async listImports(settings: BuildSettings): Promise<string[]> {
    //     return [];
    // }
    async build(settings, changedFiles) { }
}
exports.BasePlugin = BasePlugin;
