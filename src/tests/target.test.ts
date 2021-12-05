import { expect } from 'chai';
import * as path from 'path';
import { Target } from '../build/target';
import { ResolvedPath } from '../util/resolved_path';

describe('target', () => {
    it('should parse protocols', async () => {
        const base = ResolvedPath.absolute('/base/path/to', path.posix);
        const target = Target.parse('copy:my/image.png', base, {});
        expect(target.protocol).to.equal('copy');
        expect(target.path.toString()).to.equal('/base/path/to/my/image.png');
    });

    it('should choose a protocol based on file extension', async () => {
        const base = ResolvedPath.absolute('/base/path/to', path.posix);
        const target = Target.parse('my/lib.cpp', base, { 'cpp': 'clang' });
        expect(target.protocol).to.equal('clang');
        expect(target.path.toString()).to.equal('/base/path/to/my/lib.cpp');
    });
});
