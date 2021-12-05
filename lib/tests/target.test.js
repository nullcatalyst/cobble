"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const target_1 = require("../build/target");
const resolved_path_1 = require("../util/resolved_path");
describe('target', () => {
    it('should parse protocols', async () => {
        const base = resolved_path_1.ResolvedPath.absolute('/base/path/to', path.posix);
        const target = target_1.Target.parse('copy:my/image.png', base, {});
        (0, chai_1.expect)(target.protocol).to.equal('copy');
        (0, chai_1.expect)(target.path.toString()).to.equal('/base/path/to/my/image.png');
    });
    it('should choose a protocol based on file extension', async () => {
        const base = resolved_path_1.ResolvedPath.absolute('/base/path/to', path.posix);
        const target = target_1.Target.parse('my/lib.cpp', base, { 'cpp': 'clang' });
        (0, chai_1.expect)(target.protocol).to.equal('clang');
        (0, chai_1.expect)(target.path.toString()).to.equal('/base/path/to/my/lib.cpp');
    });
});
