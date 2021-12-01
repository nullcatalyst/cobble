"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMailbox = void 0;
class Mailbox {
    constructor(pending, event, callback, promise) {
        this._pending = pending;
        this._event = event;
        this._callback = callback;
        this._promise = promise;
    }
    static run(event, callback) {
        return new Mailbox(true, event, callback, callback(event));
    }
    static dependOn(existingMailbox, event, callback) {
        if (event.timestamp <= existingMailbox._event.timestamp) {
            // The existing mailbox is based on a newer event -> reuse it
            return existingMailbox;
        }
        if (existingMailbox._pending) {
            // The given event is newer -> create a new mailbox that waits for the last one
            const newMailbox = new Mailbox(false, event, callback, (async () => {
                await existingMailbox._promise;
                newMailbox._pending = true;
                newMailbox._callback(newMailbox._event);
            })());
            return newMailbox;
        }
        // The preceding mailbox hasn't started executing yet -> it can be reused
        existingMailbox._event = event;
        existingMailbox._callback = callback;
        return existingMailbox;
    }
    get promise() {
        return this._promise;
    }
}
function createMailbox(callback) {
    let mailbox = null;
    return event => {
        if (mailbox == null) {
            mailbox = Mailbox.run(event, callback);
        }
        else {
            mailbox = Mailbox.dependOn(mailbox, event, callback);
        }
        mailbox.promise.then(() => (mailbox = null));
        return mailbox.promise;
    };
}
exports.createMailbox = createMailbox;
