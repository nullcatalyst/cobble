import * as assert from 'assert';
import * as path from 'path';
import { Target } from '../composer/target';
import { ResolvedPath } from '../util/resolved_path';

describe('target', () => {
    it('should parse protocols', async () => {
        const base = ResolvedPath.absolute('/base/path/to', path.posix);
        const target = Target.parse('copy:my/image.png', base, {});
        assert.strictEqual(target.protocol, 'copy');
        assert.strictEqual(target.path.toString(), '/base/path/to/my/image.png');
    });

    it('should choose a protocol based on file extension', async () => {
        const base = ResolvedPath.absolute('/base/path/to', path.posix);
        const target = Target.parse('my/lib.cpp', base, { 'cpp': 'clang' });
        assert.strictEqual(target.protocol, 'clang');
        assert.strictEqual(target.path.toString(), '/base/path/to/my/lib.cpp');
    });
});
