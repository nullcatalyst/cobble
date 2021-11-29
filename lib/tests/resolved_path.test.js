"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const resolved_path_1 = require("../util/resolved_path");
describe('resolved path', () => {
    const defer = [];
    afterEach(() => {
        defer.forEach(f => f());
        defer.length = 0;
    });
    it('should normalize absolute paths', async () => {
        const abs = resolved_path_1.ResolvedPath.absolute('//test/./normalizing////this path', path.posix);
        assert.strictEqual(abs.toString(), '/test/normalizing/this path');
    });
    it('should support joining relative paths', async () => {
        const abs = resolved_path_1.ResolvedPath.absolute('/absolute/path', path.posix);
        const rel = abs.join('to/relative');
        assert.strictEqual(rel.toString(), '/absolute/path/to/relative');
    });
    it('should be able to return the base name', async () => {
        const abs = resolved_path_1.ResolvedPath.absolute('/absolute/path', path.posix);
        assert.strictEqual(abs.name, 'path');
    });
    it('should be able to change the file name', async () => {
        const a = resolved_path_1.ResolvedPath.absolute('/absolute/path', path.posix);
        const b = a.modifyFileName(() => 'new_name');
        assert.strictEqual(b.name, 'new_name');
        assert.strictEqual(b.toString(), '/absolute/new_name');
    });
    it('should find common posix subpaths', async () => {
        const a = resolved_path_1.ResolvedPath.absolute('/path/to/a', path.posix);
        const b = resolved_path_1.ResolvedPath.absolute('/path/to/b', path.posix);
        const c = resolved_path_1.ResolvedPath.absolute('/no/common/subpath', path.posix);
        // Same path
        assert.strictEqual(a.commonSubPath(a).toString(), '/path/to/a');
        // Typical use case
        assert.strictEqual(a.commonSubPath(b).toString(), '/path/to');
        // Should be the same regardless of order
        assert.strictEqual(b.commonSubPath(a).toString(), '/path/to');
        // No common subpath (return root)
        assert.strictEqual(a.commonSubPath(c).toString(), '/');
        // No common subpath (return root)
        assert.strictEqual(c.commonSubPath(a).toString(), '/');
    });
    it('should find common win32 subpaths', async () => {
        const a = resolved_path_1.ResolvedPath.absolute('C:\\path\\to\\a', path.win32);
        const b = resolved_path_1.ResolvedPath.absolute('C:\\path\\to\\b', path.win32);
        const c = resolved_path_1.ResolvedPath.absolute('C:\\no\\common\\subpath', path.win32);
        const d = resolved_path_1.ResolvedPath.absolute('D:\\different\\drive', path.win32);
        // Same path
        assert.strictEqual(a.commonSubPath(a).toString(), 'C:\\path\\to\\a');
        // Typical use case
        assert.strictEqual(a.commonSubPath(b).toString(), 'C:\\path\\to');
        // Should be the same regardless of order
        assert.strictEqual(b.commonSubPath(a).toString(), 'C:\\path\\to');
        // No common subpath (return root)
        assert.strictEqual(a.commonSubPath(c).toString(), 'C:\\');
        assert.strictEqual(c.commonSubPath(a).toString(), 'C:\\');
        // Different drive letters shouold throw an exception
        assert.throws(() => a.commonSubPath(d));
    });
});
