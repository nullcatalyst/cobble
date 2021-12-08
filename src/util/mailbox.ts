import { Event } from '../watcher/event';

type MailboxCallback = (event: Event) => Promise<void>;

class Mailbox {
    private _pending: boolean;
    private _event: Event;
    private _callback: MailboxCallback;
    private _promise: Promise<void>;

    private constructor(pending: boolean, event: Event, callback: MailboxCallback, promise: Promise<void>) {
        this._pending = pending;
        this._event = event;
        this._callback = callback;
        this._promise = promise;
    }

    static run(event: Event, callback: MailboxCallback): Mailbox {
        return new Mailbox(true, event, callback, callback(event));
    }

    static dependOn(existingMailbox: Mailbox, event: Event, callback: MailboxCallback): Mailbox {
        if (event.timestamp <= existingMailbox._event.timestamp) {
            // The existing mailbox is based on a newer event -> reuse it
            return existingMailbox;
        }

        if (existingMailbox._pending) {
            // The given event is newer -> create a new mailbox that waits for the last one
            const newMailbox = new Mailbox(
                false,
                event,
                callback,
                (async () => {
                    try {
                        // The result of the previous mailbox does not matter and should not prevent the new one from running
                        await existingMailbox._promise;
                    } finally {
                        newMailbox._pending = true;
                        newMailbox._callback(newMailbox._event);
                    }
                })(),
            );
            return newMailbox;
        }

        // The preceding mailbox hasn't started executing yet -> it can be reused
        existingMailbox._event = event;
        existingMailbox._callback = callback;
        return existingMailbox;
    }

    get promise(): Promise<void> {
        return this._promise;
    }
}

export function createMailbox(callback: MailboxCallback): MailboxCallback {
    let mailbox: Mailbox | null = null;

    return event => {
        if (mailbox == null) {
            mailbox = Mailbox.run(event, callback);
        } else {
            mailbox = Mailbox.dependOn(mailbox, event, callback);
        }
        mailbox.promise.finally(() => (mailbox = null));

        return mailbox.promise;
    };
}
