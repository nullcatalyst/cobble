import * as assert from 'assert';
import * as path from 'path';

import { ResolvedPath } from '../util/resolved_path';

describe('resolved path', () => {
    const defer: (() => void)[] = [];
    afterEach(() => {
        defer.forEach(f => f());
        defer.length = 0;
    });

    it('should find normalize absolute paths', async () => {
        const abs = ResolvedPath.absolute('//test/./normalizing////this path', path.posix);
        assert.strictEqual(abs.toString(), '/test/normalizing/this path');
    });

    it('should find normalize relative paths', async () => {
        const abs = ResolvedPath.absolute('/absolute/path', path.posix);
        const rel = abs.relative('to/relative');
        assert.strictEqual(rel.toString(), '/absolute/path/to/relative');
    });

    it('should return the basename', async () => {
        const abs = ResolvedPath.absolute('/absolute/path', path.posix);
        assert.strictEqual(abs.name, 'path');
    });

    it('should change the file name', async () => {
        const a = ResolvedPath.absolute('/absolute/path', path.posix);
        const b = a.modifyFileName(() => 'new_name');
        assert.strictEqual(b.name, 'new_name');
        assert.strictEqual(b.toString(), '/absolute/new_name');
    });
});
