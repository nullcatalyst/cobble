"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeWatcher = void 0;
const base_1 = require("./base");
class FakeWatcher extends base_1.BaseWatcher {
    get callbacks() {
        return this._callbacks;
    }
}
exports.FakeWatcher = FakeWatcher;
