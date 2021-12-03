import { ResolvedPath } from '../util/resolved_path';
import { Event, EVENT_NAMES } from './event';

export type CleanupCallback = () => void;

export abstract class BaseWatcher {
    protected _verbosity: number;
    protected readonly _callbacks = new Map<string, ((event: Event) => void)[]>();

    constructor(verbosity: number = 0) {
        this._verbosity = verbosity;
    }

    stop(): void {
        // Do nothing
    }

    emit(event: Event): Promise<void> {
        if (this._verbosity > 1) {
            console.log(`[${EVENT_NAMES[event.type]}] ${event.filePath}`);
        }

        const callbacks = this._callbacks.get(event.filePath.toString());
        if (callbacks == null) {
            if (this._verbosity > 0) {
                console.log(`[WARN] no callbacks for ${event.filePath}`);
            }
            return;
        }

        return Promise.all(
            callbacks.map(async callback => {
                try {
                    await callback(event);
                } catch (err) {
                    console.error(err);
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
