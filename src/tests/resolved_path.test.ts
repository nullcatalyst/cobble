import { expect } from 'chai';
import * as path from 'path';
import { ResolvedPath } from '../util/resolved_path';

describe('resolved path', () => {
    const defer: (() => void)[] = [];
    afterEach(() => {
        defer.forEach(f => f());
        defer.length = 0;
    });

    it('should normalize absolute paths', async () => {
        const abs = ResolvedPath.absolute('//test/./normalizing////this path', path.posix);
        expect(abs.toString()).to.equal('/test/normalizing/this path');
    });

    it('should support joining relative paths', async () => {
        const abs = ResolvedPath.absolute('/absolute/path', path.posix);
        const rel = abs.join('to/relative');
        expect(rel.toString()).to.equal('/absolute/path/to/relative');
    });

    it('should be able to return the base name', async () => {
        const abs = ResolvedPath.absolute('/absolute/path', path.posix);
        expect(abs.name).to.equal('path');
    });

    it('should be able to change the file name', async () => {
        const a = ResolvedPath.absolute('/absolute/path', path.posix);
        const b = a.modifyFileName(() => 'new_name');
        expect(b.name).to.equal('new_name');
        expect(b.toString()).to.equal('/absolute/new_name');
    });

    it('should find common posix subpaths', async () => {
        const a = ResolvedPath.absolute('/path/to/a', path.posix);
        const b = ResolvedPath.absolute('/path/to/b', path.posix);
        const c = ResolvedPath.absolute('/no/common/subpath', path.posix);

        // Same path
        expect(a.commonSubPath(a).toString()).to.equal('/path/to/a');

        // Typical use case
        expect(a.commonSubPath(b).toString()).to.equal('/path/to');
        // Should be the same regardless of order
        expect(b.commonSubPath(a).toString()).to.equal('/path/to');

        // No common subpath (return root)
        expect(a.commonSubPath(c).toString()).to.equal('/');
        // No common subpath (return root)
        expect(c.commonSubPath(a).toString()).to.equal('/');
    });

    it('should find common win32 subpaths', async () => {
        const a = ResolvedPath.absolute('C:\\path\\to\\a', path.win32);
        const b = ResolvedPath.absolute('C:\\path\\to\\b', path.win32);
        const c = ResolvedPath.absolute('C:\\no\\common\\subpath', path.win32);
        const d = ResolvedPath.absolute('D:\\different\\drive', path.win32);

        // Same path
        expect(a.commonSubPath(a).toString()).to.equal('C:\\path\\to\\a');

        // Typical use case
        expect(a.commonSubPath(b).toString()).to.equal('C:\\path\\to');
        // Should be the same regardless of order
        expect(b.commonSubPath(a).toString()).to.equal('C:\\path\\to');

        // No common subpath (return root)
        expect(a.commonSubPath(c).toString()).to.equal('C:\\');
        expect(c.commonSubPath(a).toString()).to.equal('C:\\');

        // Different drive letters shouold throw an exception
        expect(() => a.commonSubPath(d)).to.throw();
    });
});
