"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const target_1 = require("../composer/target");
const resolved_path_1 = require("../util/resolved_path");
describe('target', () => {
    it('should parse protocols', async () => {
        const base = resolved_path_1.ResolvedPath.absolute('/base/path/to', path.posix);
        const target = target_1.Target.parse('copy:my/image.png', base, {});
        assert.strictEqual(target.protocol, 'copy');
        assert.strictEqual(target.path.toString(), '/base/path/to/my/image.png');
    });
    it('should choose a protocol based on file extension', async () => {
        const base = resolved_path_1.ResolvedPath.absolute('/base/path/to', path.posix);
        const target = target_1.Target.parse('my/lib.cpp', base, { 'cpp': 'clang' });
        assert.strictEqual(target.protocol, 'clang');
        assert.strictEqual(target.path.toString(), '/base/path/to/my/lib.cpp');
    });
});
