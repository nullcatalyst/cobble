import { BaseWatcher } from './base';
export declare class FakeWatcher extends BaseWatcher {
    get callbacks(): Map<string, ((event: import("./event").Event) => void)[]>;
}
