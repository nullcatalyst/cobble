import { expect } from 'chai';
import * as path from 'path';
import { BasePlugin } from '..';
import { BuildSettings } from '../build/settings';
import { ResolvedPath } from '../util/resolved_path';

describe('build settings', () => {
    it('should parse a raw build file', async () => {
        const settings = await BuildSettings.from(
            {
                'name': 'test',
                'outDir': 'out',
                'srcs': ['copy:src/1.txt', 'copy:src/2.txt'],
                'deps': ['other/build.json'],
            },
            {
                'configPath': ResolvedPath.absolute('/config.json', path.posix),
            },
        );

        expect(settings.name).to.equal('test');
        expect(settings.outDir.toString()).to.equal('/out');
        expect(settings.srcs.map(src => src.path.toString())).to.deep.equal(['/src/1.txt', '/src/2.txt']);
        expect(settings.deps.map(dep => dep.toString())).to.deep.equal(['/other/build.json']);
    });

    it('should merge platform specific properties', async () => {
        const settings = await BuildSettings.from(
            {
                'name': 'platform_test',
                'outDir': 'out',
                'srcs': ['copy:src/1.txt', 'copy:src/2.txt'],
                'deps': ['other/build.json'],
                'platform': {
                    'wasm': {
                        'srcs': ['copy:src/wasm.txt'],
                        'deps': ['other/wasm.json'],
                    },
                    'win32': {
                        'srcs': ['copy:src/win32.txt'],
                        'deps': ['other/win32.json'],
                    },
                    '!darwin': {
                        'srcs': ['copy:src/not_darwin.txt'],
                        'deps': ['other/not_darwin.json'],
                    },
                },
            },
            {
                'configPath': ResolvedPath.absolute('/config.json', path.posix),
                'target': 'wasm',
            },
        );

        expect(settings.name).to.equal('platform_test');
        expect(settings.outDir.toString()).to.equal('/out');
        expect(settings.srcs.map(src => src.path.toString())).to.deep.equal([
            '/src/1.txt',
            '/src/2.txt',
            '/src/wasm.txt',
            '/src/not_darwin.txt',
        ]);
        expect(settings.deps.map(dep => dep.toString())).to.deep.equal([
            '/other/build.json',
            '/other/wasm.json',
            '/other/not_darwin.json',
        ]);
    });

    it('should merge platform specific plugin properties', async () => {
        const settings = await BuildSettings.from(
            {
                'name': 'clang_test',
                'clang': {
                    'libs': ['lib1', 'lib2'],
                },
                'platform': {
                    'wasm': {
                        'clang': {
                            'libs': ['wasm_lib3'],
                        },
                    },
                    'win32': {
                        'clang': {
                            'libs': ['win32_lib3'],
                        },
                    },
                    '!darwin': {
                        'clang': {
                            'libs': ['not_darwin_lib3'],
                        },
                    },
                },
            },
            {
                'configPath': ResolvedPath.absolute('/config.json', path.posix),
                'target': 'wasm',
                'pluginNames': ['clang'],
            },
        );

        expect(settings.name).to.equal('clang_test');
        expect(settings.outDir.toString()).to.equal('/');

        class FakePlugin extends BasePlugin {
            override name(): string {
                return 'clang';
            }
        }

        const clang = settings.pluginSettings(new FakePlugin({} as any));
        expect(clang).to.have.property('libs');
        expect(clang['libs']).to.deep.equal(['lib1', 'lib2', 'wasm_lib3', 'not_darwin_lib3']);
    });
});
