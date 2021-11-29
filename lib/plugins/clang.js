"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClangPlugin = void 0;
const event_1 = require("../watcher/event");
const base_1 = require("./base");
const resolved_path_1 = require("../util/resolved_path");
const mailbox_1 = require("../util/mailbox");
const mkdir_1 = require("../util/mkdir");
const spawn_1 = require("../util/spawn");
const target_1 = require("../composer/target");
class ClangPlugin extends base_1.BasePlugin {
    constructor(tmpPath) {
        super();
        this._tmpPath = tmpPath;
    }
    name() {
        return 'clang';
    }
    provideProtocolExtensions() {
        return ['c', 'cc', 'cpp'];
    }
    async process(watcher, settings) {
        const includes = await this._listIncludesForAllFiles(settings);
        const cleanupFns = [...includes.entries()].map(([srcStr, hdrs]) => {
            const src = resolved_path_1.ResolvedPath.absolute(srcStr);
            const obj = this._getObjectFilePath(settings, src);
            // Watch the header files that the source file includes
            let cleanupWatchHdrs = [];
            const watchHdrs = (hdrs) => {
                for (const hdr of hdrs) {
                    const cleanupWatchHdr = watcher.add(hdr, (0, mailbox_1.createMailbox)(async (event) => {
                        // if (event.type === EventType.DeleteFile) {
                        //     cleanup();
                        //     return;
                        // }
                        await this._compile(src, settings);
                        watcher.emit(new event_1.Event(3 /* BuildFile */, obj, event.timestamp));
                    }));
                    cleanupWatchHdrs.push(cleanupWatchHdr);
                }
            };
            watchHdrs(hdrs);
            // Watch the source file directly
            const cleanupWatchSrc = watcher.add(src, (0, mailbox_1.createMailbox)(async (event) => {
                // Remove the existing headers
                for (const cleanupWatchHdr of cleanupWatchHdrs) {
                    cleanupWatchHdr();
                }
                cleanupWatchHdrs.length = 0;
                if (event.type === 2 /* DeleteFile */) {
                    // cleanupWatchSrc();
                    return;
                }
                watchHdrs(await this._listIncludesForSingleFile(src, settings));
                await this._compile(src, settings);
                watcher.emit(new event_1.Event(3 /* BuildFile */, obj, event.timestamp));
            }));
            // Watch the object file and re-link when it changes
            const cleanupWatchObj = watcher.add(obj, (0, mailbox_1.createMailbox)(async (event) => {
                await this._link(settings);
            }));
            return () => {
                cleanupWatchObj();
                cleanupWatchSrc();
                for (const cleanupWatchHdr of cleanupWatchHdrs) {
                    cleanupWatchHdr();
                }
                cleanupWatchHdrs.length = 0;
            };
        });
        return () => {
            for (const cleanupFn of cleanupFns) {
                cleanupFn();
            }
        };
    }
    async _listIncludesForAllFiles(settings) {
        const includes = new Map();
        const srcs = settings.srcs.filter(src => src.protocol == this.name()).map(src => src.path);
        const args = this._generateArgs(settings, undefined, srcs, false, false);
        args.push('-MM');
        const cc = settings.target === 'win32' ? 'clang.exe' : 'clang';
        const result = await (0, spawn_1.spawn)(cc, args);
        result.stdout
            .replaceAll('\r', '')
            .replaceAll('\\\n', ' ')
            .split('\n')
            .filter(line => line)
            .forEach(line => {
            const index = line.indexOf(':');
            if (index < 0) {
                throw new Error('make file has invalid format');
            }
            const [src, ...hdrs] = line
                .slice(index + 1)
                .trim()
                .split(/\s+/);
            const basePath = settings.basePath;
            includes.set(basePath.join(src).toString(), hdrs.map(hdr => basePath.join(hdr)));
        });
        return includes;
    }
    async _listIncludesForSingleFile(src, settings) {
        let includes = [];
        const args = this._generateArgs(settings, undefined, [src], false, false);
        args.push('-MM');
        const cc = settings.target === 'win32' ? 'clang.exe' : 'clang';
        const result = await (0, spawn_1.spawn)(cc, args);
        result.stdout
            .replaceAll('\r', '')
            .replaceAll('\\\n', ' ')
            .split('\n')
            .filter(line => line)
            .forEach(line => {
            const index = line.indexOf(':');
            if (index < 0) {
                throw new Error('make file has invalid format');
            }
            const [src, ...hdrs] = line
                .slice(index + 1)
                .trim()
                .split(/\s+/);
            const basePath = settings.basePath;
            includes = hdrs.map(hdr => basePath.join(hdr));
        });
        return includes;
    }
    async _compile(src, settings) {
        const obj = this._getObjectFilePath(settings, src);
        const args = [];
        args.push(...this._platformArgs(settings, settings.target === 'win32'));
        args.push(...this._generateArgs(settings, obj, [src], false, settings.target === 'win32'));
        await (0, mkdir_1.mkdir)(obj.dirname());
        const cc = settings.target === 'win32' ? 'clang-cl.exe' : 'clang';
        const result = await (0, spawn_1.spawn)(cc, args, { stdio: 'inherit' });
    }
    async _link(settings) {
        const args = [];
        args.push(...this._platformArgs(settings, settings.target === 'win32'));
        args.push(...this._generateArgs(settings, settings.outputPath, settings.srcs
            .filter(src => src.protocol == this.name())
            .map(src => this._getObjectFilePath(settings, src)), true, settings.target === 'win32'));
        await (0, mkdir_1.mkdir)(settings.outputPath.dirname());
        const cc = settings.target === 'win32' ? 'clang-cl.exe' : 'clang';
        const result = await (0, spawn_1.spawn)(cc, args, { stdio: 'inherit' });
    }
    // override async build(settings: BuildSettings, changedFiles: string[]): Promise<void> {
    //     const args: string[] = [];
    //     args.push(...this._platformArgs(settings, false));
    //     args.push(settings.target === 'win32' ? '/o' : '-o', settings.output);
    //     args.push(
    //         ...this._generateArgs(
    //             settings,
    //             settings.srcs.map(src => src.toString()),
    //             settings.target === 'win32',
    //         ),
    //     );
    //     const cc = settings.target === 'win32' ? 'clang-cl.exe' : 'clang';
    //     console.log(`${cc} ${args.join(' ')}`);
    //     try {
    //         const result = await spawn(cc, args, { stdio: 'inherit' });
    //         console.log(`Build successful!`);
    //         if (settings.release && settings.target === 'wasm' && settings.type === 'exe') {
    //             await spawn(
    //                 'wasm-opt',
    //                 [
    //                     '--reorder-functions',
    //                     '--reorder-locals',
    //                     '--simplify-globals',
    //                     '--simplify-locals',
    //                     '--strip-producers',
    //                     '--strip-target-features',
    //                     '--vacuum',
    //                     '-Oz',
    //                     '--converge',
    //                     '-o',
    //                     settings.createOutputName(settings.target, settings.type, `${settings.name}.opt`),
    //                     settings.createOutputName(settings.target, settings.type, settings.name),
    //                 ],
    //                 { stdio: 'inherit' },
    //             );
    //         }
    //     } catch (e) {
    //         console.error(e);
    //     }
    // }
    _platformArgs(settings, clangClExe) {
        const args = [];
        if (!clangClExe) {
            switch (settings.target) {
                case 'wasm':
                    args.push('--target=wasm32-unknown-unknown', '-Xlinker', '--no-entry', '-nostdlib');
                    args.push('-mmultivalue', '-Xclang', '-target-abi', '-Xclang', 'experimental-mv');
                    args.push('-msimd128');
                    args.push('-mtail-call');
                    break;
                default:
                    break;
            }
        }
        return args;
    }
    _generateArgs(settings, output, srcs, link, clangClExe) {
        const std = settings.raw('std') ?? 'c++17';
        const args = [];
        if (clangClExe) {
            if (output != null) {
                args.push('/o', output.toString());
            }
            args.push(`/std:${std}`);
            if (!link) {
                args.push('/c');
            }
            settings.includes.forEach(inc => args.push('/I', inc.toString()));
            settings.defines.forEach(def => args.push(`/D${def}`));
            if (srcs.length > 0) {
                args.push(...srcs.map(src => src.toString()));
                // if (settings.type === 'exe') {
                //     args.push(...settings.libs);
                // }
            }
            args.push(...settings.flags);
        }
        else {
            if (output != null) {
                args.push('-o', output.toString());
            }
            args.push(`-std=${std}`);
            if (!link) {
                args.push('-c');
            }
            settings.includes.forEach(inc => args.push('-I', inc.toString()));
            settings.defines.forEach(def => args.push('-D', def));
            if (srcs.length > 0) {
                args.push(...srcs.map(src => src.toString()));
                // settings.libs.forEach(lib => args.push('-l', lib));
            }
            args.push(...settings.flags);
        }
        return args;
    }
    _getObjectFilePath(settings, src) {
        return (src instanceof target_1.Target ? src.path : src)
            .replaceBasePath(settings.basePath, this._tmpPath)
            .modifyFileName((name, ext) => (settings.target === 'win32' ? `${name}.obj` : `${name}.o`));
    }
}
exports.ClangPlugin = ClangPlugin;
