import { Event, EventType } from '../watcher/event';

import { BasePlugin, ResetPluginWatchedFilesFn } from './base';
import { BaseWatcher } from '../watcher/base';
import { BuildSettings } from '../composer/settings';
import { ResolvedPath } from '../util/resolved_path';
import { createMailbox } from '../util/mailbox';
import { mkdir } from '../util/mkdir';
import { spawn } from '../util/spawn';
import { Target } from '../composer/target';

export class ClangPlugin extends BasePlugin {
    private readonly _tmpPath: ResolvedPath;

    constructor(tmpPath: ResolvedPath) {
        super();

        this._tmpPath = tmpPath;
    }

    override name(): string {
        return 'clang';
    }

    override provideProtocolExtensions(): string[] {
        return ['c', 'cc', 'cpp'];
    }

    override async process(watcher: BaseWatcher, settings: BuildSettings): Promise<ResetPluginWatchedFilesFn> {
        const includes = await this._listIncludesForAllFiles(settings);
        const cleanupFns = [...includes.entries()].map(([srcStr, hdrs]) => {
            const src = ResolvedPath.absolute(srcStr);
            const obj = this._getObjectFilePath(settings, src);

            // Watch the header files that the source file includes
            let cleanupWatchHdrs: (() => void)[] = [];
            const watchHdrs = (hdrs: ResolvedPath[]) => {
                for (const hdr of hdrs) {
                    const cleanupWatchHdr = watcher.add(
                        hdr,
                        createMailbox(async event => {
                            // if (event.type === EventType.DeleteFile) {
                            //     cleanup();
                            //     return;
                            // }

                            await this._compile(src, settings);
                            watcher.emit(new Event(EventType.BuildFile, obj, event.timestamp));
                        }),
                    );
                    cleanupWatchHdrs.push(cleanupWatchHdr);
                }
            };

            watchHdrs(hdrs);

            // Watch the source file directly
            const cleanupWatchSrc = watcher.add(
                src,
                createMailbox(async event => {
                    // Remove the existing headers
                    for (const cleanupWatchHdr of cleanupWatchHdrs) {
                        cleanupWatchHdr();
                    }
                    cleanupWatchHdrs.length = 0;

                    if (event.type === EventType.DeleteFile) {
                        // cleanupWatchSrc();
                        return;
                    }

                    watchHdrs(await this._listIncludesForSingleFile(src, settings));
                    await this._compile(src, settings);
                    watcher.emit(new Event(EventType.BuildFile, obj, event.timestamp));
                }),
            );

            // Watch the object file and re-link when it changes
            const cleanupWatchObj = watcher.add(
                obj,
                createMailbox(async event => {
                    await this._link(settings);
                }),
            );

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

    async _listIncludesForAllFiles(settings: BuildSettings): Promise<Map<string, ResolvedPath[]>> {
        const includes = new Map<string, ResolvedPath[]>();

        const srcs = settings.srcs.filter(src => src.protocol == this.name()).map(src => src.path);
        const args = this._generateArgs(settings, undefined, srcs, false, false);
        args.push('-MM');

        const cc = settings.target === 'win32' ? 'clang.exe' : 'clang';
        const result = await spawn(cc, args);
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
                includes.set(
                    basePath.join(src).toString(),
                    hdrs.map(hdr => basePath.join(hdr)),
                );
            });

        return includes;
    }

    async _listIncludesForSingleFile(src: ResolvedPath, settings: BuildSettings): Promise<ResolvedPath[]> {
        let includes: ResolvedPath[] = [];
        const args = this._generateArgs(settings, undefined, [src], false, false);
        args.push('-MM');

        const cc = settings.target === 'win32' ? 'clang.exe' : 'clang';
        const result = await spawn(cc, args);
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

    async _compile(src: ResolvedPath, settings: BuildSettings): Promise<void> {
        const obj = this._getObjectFilePath(settings, src);

        const args: string[] = [];
        args.push(...this._platformArgs(settings, settings.target === 'win32'));
        args.push(...this._generateArgs(settings, obj, [src], false, settings.target === 'win32'));

        await mkdir(obj.dirname());

        const cc = settings.target === 'win32' ? 'clang-cl.exe' : 'clang';
        const result = await spawn(cc, args, { stdio: 'inherit' });
    }

    async _link(settings: BuildSettings): Promise<void> {
        const args: string[] = [];
        args.push(...this._platformArgs(settings, settings.target === 'win32'));
        args.push(
            ...this._generateArgs(
                settings,
                settings.outputPath,
                settings.srcs
                    .filter(src => src.protocol == this.name())
                    .map(src => this._getObjectFilePath(settings, src)),
                true,
                settings.target === 'win32',
            ),
        );

        await mkdir(settings.outputPath.dirname());

        const cc = settings.target === 'win32' ? 'clang-cl.exe' : 'clang';
        const result = await spawn(cc, args, { stdio: 'inherit' });
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

    private _platformArgs(settings: BuildSettings, clangClExe: boolean): string[] {
        const args: string[] = [];

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

    private _generateArgs(
        settings: BuildSettings,
        output: ResolvedPath | undefined,
        srcs: ResolvedPath[],
        link: boolean,
        clangClExe: boolean,
    ): string[] {
        const std = settings.raw('std') ?? 'c++17';
        const args: string[] = [];

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
        } else {
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

    private _getObjectFilePath(settings: BuildSettings, src: Target | ResolvedPath): ResolvedPath {
        return (src instanceof Target ? src.path : src)
            .replaceBasePath(settings.basePath, this._tmpPath)
            .modifyFileName((name, ext) => (settings.target === 'win32' ? `${name}.obj` : `${name}.o`));
    }
}
