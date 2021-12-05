"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs");
const tmp = require("tmp-promise");
const resolved_path_1 = require("../util/resolved_path");
const event_1 = require("../watcher/event");
const file_1 = require("../watcher/file");
describe('file watcher', () => {
    const defer = [];
    afterEach(() => {
        defer.forEach(f => f());
        defer.length = 0;
    });
    it('should watch files', async () => {
        const { path: dirPath, cleanup: dirCleanup } = await tmp.dir({ unsafeCleanup: true });
        defer.push(dirCleanup);
        const dir = resolved_path_1.ResolvedPath.absolute(dirPath);
        const watcher = new file_1.FileWatcher(0);
        watcher.start(dir);
        defer.push(() => watcher.stop());
        // Create a new file
        const filePath = dir.join('file.txt');
        await new Promise((resolve, reject) => {
            const cleanup = watcher.add(filePath, event => {
                try {
                    (0, chai_1.expect)(event.type).to.equal(event_1.EventType.AddFile);
                    (0, chai_1.expect)(event.filePath.toString()).to.equal(filePath.toString());
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
            defer.push(cleanup);
            fs.writeFileSync(filePath.toString(), 'hello', 'utf8');
        });
        // Change the existing file
        await new Promise((resolve, reject) => {
            const cleanup = watcher.add(filePath, event => {
                try {
                    (0, chai_1.expect)(event.type).to.equal(event_1.EventType.ChangeFile);
                    (0, chai_1.expect)(event.filePath.toString()).to.equal(filePath.toString());
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
            defer.push(cleanup);
            fs.writeFileSync(filePath.toString(), 'hello', 'utf8');
        });
    });
});
