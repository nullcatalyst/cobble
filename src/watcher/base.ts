import { ResolvedPath } from '../util/resolved_path';
import { Event, EVENT_NAMES } from './event';

export type CleanupCallback = () => void;

export abstract class BaseWatcher {
    protected readonly _verbose: number;
    protected readonly _callbacks = new Map<string, ((event: Event) => void)[]>();

    constructor(verbose: number) {
        this._verbose = verbose;
    }

    emit(event: Event): Promise<void> {
        if (this._verbose >= 1) {
            console.log(`[${EVENT_NAMES[event.type]}] ${event.filePath}`);
        }

        const callbacks = this._callbacks.get(event.filePath.toString());
        if (callbacks == null) {
            if (this._verbose >= 2) {
                console.log(`[WARN] no callbacks for ${event.filePath}`);
            }
            return;
        }

        return Promise.all(
            callbacks.map(async callback => {
                try {
                    await callback(event);
                } catch (err) {
                    if (this._verbose >= 0) {
                        console.error(err);
                    }
                }
            }),
        ).then(() => {
            // Do nothing, this just exists to hide the Promise.all() return value
        });
    }

    add(filePath: ResolvedPath, callback: (event: Event) => void): CleanupCallback {
        const callbacks = this._callbacks.get(filePath.toString());
        if (callbacks == null) {
            this._callbacks.set(filePath.toString(), [callback]);
        } else {
            callbacks.push(callback);
        }

        return () => {
            this.remove(filePath, callback);
        };
    }

    remove(filePath: ResolvedPath, callback: (event: Event) => void): void {
        const callbacks = this._callbacks.get(filePath.toString());
        if (callbacks == null) {
            return;
        }

        const index = callbacks.indexOf(callback);
        if (index >= 0) {
            callbacks.splice(index, 1);
            if (callbacks.length === 0) {
                this._callbacks.delete(filePath.toString());
            }
        }
    }
}
