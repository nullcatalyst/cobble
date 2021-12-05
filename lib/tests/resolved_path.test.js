"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
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
        (0, chai_1.expect)(abs.toString()).to.equal('/test/normalizing/this path');
    });
    it('should support joining relative paths', async () => {
        const abs = resolved_path_1.ResolvedPath.absolute('/absolute/path', path.posix);
        const rel = abs.join('to/relative');
        (0, chai_1.expect)(rel.toString()).to.equal('/absolute/path/to/relative');
    });
    it('should be able to return the base name', async () => {
        const abs = resolved_path_1.ResolvedPath.absolute('/absolute/path', path.posix);
        (0, chai_1.expect)(abs.name).to.equal('path');
    });
    it('should be able to change the file name', async () => {
        const a = resolved_path_1.ResolvedPath.absolute('/absolute/path', path.posix);
        const b = a.modifyFileName(() => 'new_name');
        (0, chai_1.expect)(b.name).to.equal('new_name');
        (0, chai_1.expect)(b.toString()).to.equal('/absolute/new_name');
    });
    it('should find common posix subpaths', async () => {
        const a = resolved_path_1.ResolvedPath.absolute('/path/to/a', path.posix);
        const b = resolved_path_1.ResolvedPath.absolute('/path/to/b', path.posix);
        const c = resolved_path_1.ResolvedPath.absolute('/no/common/subpath', path.posix);
        // Same path
        (0, chai_1.expect)(a.commonSubPath(a).toString()).to.equal('/path/to/a');
        // Typical use case
        (0, chai_1.expect)(a.commonSubPath(b).toString()).to.equal('/path/to');
        // Should be the same regardless of order
        (0, chai_1.expect)(b.commonSubPath(a).toString()).to.equal('/path/to');
        // No common subpath (return root)
        (0, chai_1.expect)(a.commonSubPath(c).toString()).to.equal('/');
        // No common subpath (return root)
        (0, chai_1.expect)(c.commonSubPath(a).toString()).to.equal('/');
    });
    it('should find common win32 subpaths', async () => {
        const a = resolved_path_1.ResolvedPath.absolute('C:\\path\\to\\a', path.win32);
        const b = resolved_path_1.ResolvedPath.absolute('C:\\path\\to\\b', path.win32);
        const c = resolved_path_1.ResolvedPath.absolute('C:\\no\\common\\subpath', path.win32);
        const d = resolved_path_1.ResolvedPath.absolute('D:\\different\\drive', path.win32);
        // Same path
        (0, chai_1.expect)(a.commonSubPath(a).toString()).to.equal('C:\\path\\to\\a');
        // Typical use case
        (0, chai_1.expect)(a.commonSubPath(b).toString()).to.equal('C:\\path\\to');
        // Should be the same regardless of order
        (0, chai_1.expect)(b.commonSubPath(a).toString()).to.equal('C:\\path\\to');
        // No common subpath (return root)
        (0, chai_1.expect)(a.commonSubPath(c).toString()).to.equal('C:\\');
        (0, chai_1.expect)(c.commonSubPath(a).toString()).to.equal('C:\\');
        // Different drive letters shouold throw an exception
        (0, chai_1.expect)(() => a.commonSubPath(d)).to.throw();
    });
});
