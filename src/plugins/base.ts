import { BuildSettings } from '../composer/settings';

export abstract class BasePlugin {
    cleanup(): void {}

    // async listImports(settings: BuildSettings): Promise<string[]> {
    //     return [];
    // }

    async build(settings: BuildSettings, changedFiles: string[]): Promise<void> {}
}
