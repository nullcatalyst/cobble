"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const __1 = require("..");
const settings_1 = require("../build/settings");
const resolved_path_1 = require("../util/resolved_path");
describe('build settings', () => {
    it('should parse a raw build file', async () => {
        const settings = await settings_1.BuildSettings.from({
            'name': 'test',
            'outDir': 'out',
            'srcs': ['copy:src/1.txt', 'copy:src/2.txt'],
            'deps': ['other/build.json'],
        }, {
            'basePath': resolved_path_1.ResolvedPath.absolute('/', path.posix),
        });
        (0, chai_1.expect)(settings.name).to.equal('test');
        (0, chai_1.expect)(settings.outDir.toString()).to.equal('/out');
        (0, chai_1.expect)(settings.srcs.map(src => src.path.toString())).to.deep.equal(['/src/1.txt', '/src/2.txt']);
        (0, chai_1.expect)(settings.deps.map(dep => dep.toString())).to.deep.equal(['/other/build.json']);
    });
    it('should merge platform specific properties', async () => {
        const settings = await settings_1.BuildSettings.from({
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
        }, {
            'basePath': resolved_path_1.ResolvedPath.absolute('/', path.posix),
            'target': 'wasm',
        });
        (0, chai_1.expect)(settings.name).to.equal('platform_test');
        (0, chai_1.expect)(settings.outDir.toString()).to.equal('/out');
        (0, chai_1.expect)(settings.srcs.map(src => src.path.toString())).to.deep.equal([
            '/src/1.txt',
            '/src/2.txt',
            '/src/wasm.txt',
            '/src/not_darwin.txt',
        ]);
        (0, chai_1.expect)(settings.deps.map(dep => dep.toString())).to.deep.equal([
            '/other/build.json',
            '/other/wasm.json',
            '/other/not_darwin.json',
        ]);
    });
    it('should merge platform specific plugin properties', async () => {
        const settings = await settings_1.BuildSettings.from({
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
        }, {
            'basePath': resolved_path_1.ResolvedPath.absolute('/', path.posix),
            'target': 'wasm',
            'pluginNames': ['clang'],
        });
        (0, chai_1.expect)(settings.name).to.equal('clang_test');
        (0, chai_1.expect)(settings.outDir.toString()).to.equal('/');
        class FakePlugin extends __1.BasePlugin {
            name() {
                return 'clang';
            }
        }
        const clang = settings.pluginSettings(new FakePlugin({}));
        (0, chai_1.expect)(clang).to.have.property('libs');
        (0, chai_1.expect)(clang['libs']).to.deep.equal(['lib1', 'lib2', 'wasm_lib3', 'not_darwin_lib3']);
    });
});
