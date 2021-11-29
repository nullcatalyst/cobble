import { BaseWatcher } from './base';

export class FakeWatcher extends BaseWatcher {
    get callbacks() {
        return this._callbacks;
    }
}
