import { Event, IN_PROGRESS_EVENT_NAMES } from './event';

import { ResolvedPath } from '../util/resolved_path';

export type CleanupCallback = () => void;

export abstract class BaseWatcher {
    protected readonly _callbacks = new Map<string, ((event: Event) => void)[]>();

    stop(): void {
        // Do nothing
    }

    emit(event: Event): void {
        console.log(`${IN_PROGRESS_EVENT_NAMES[event.type]} ${event.filePath}`);
        const callbacks = this._callbacks.get(event.filePath.toString());
        if (callbacks == null) {
            console.log(`No callbacks for ${event.filePath}`);
            return;
        }

        callbacks.forEach(callback => {
            try {
                callback(event);
            } catch (err) {
                console.error(err);
            }
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
        }
    }
}
