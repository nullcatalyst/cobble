import * as assert from 'assert';
import * as fs from 'fs';
import * as tmp from 'tmp-promise';

import { BuildSettings } from '../composer/settings';
import { ClangPlugin } from '../plugins/clang';
import { ResolvedPath } from '../util/resolved_path';

describe('clang', () => {
    const defer: (() => void)[] = [];
    afterEach(() => {
        defer.forEach(f => f());
        defer.length = 0;
    });

    it('should find imported files', async () => {
        const { path: dirPath, cleanup } = await tmp.dir({ unsafeCleanup: true });
        defer.push(cleanup);

        const basePath = ResolvedPath.absolute(dirPath);

        const hdrFilePath = basePath.relative('hdr.h');
        const cppFilePath = basePath.relative('src.cpp');
        await fs.promises.writeFile(cppFilePath.toString(), '#include "hdr.h"');
        await fs.promises.writeFile(hdrFilePath.toString(), 'int function_name();');

        const settings = new BuildSettings('linux');
        await settings.load(
            {
                'name': 'test',
                'srcs': [cppFilePath.toString()],
            },
            ResolvedPath.absolute(dirPath).relative('build.json'),
        );

        const clang = new ClangPlugin(ResolvedPath.absolute('/'));
        const imports = await clang._listImports(settings);

        const cppFileImports = imports.get(cppFilePath.toString());
        assert.notEqual(cppFileImports, null);
        assert.deepStrictEqual(
            cppFileImports.map(hdr => hdr.toString()),
            [hdrFilePath.toString()],
        );
    });
});
