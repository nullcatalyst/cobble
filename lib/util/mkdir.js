"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkdir = void 0;
const fs = require("fs");
async function mkdir(dir) {
    await fs.promises.mkdir(dir.toString(), { recursive: true });
}
exports.mkdir = mkdir;
