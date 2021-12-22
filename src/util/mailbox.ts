import { Event } from '../watcher/event';
import { debounce } from './promise';

type MailboxCallback = (event: Event) => Promise<void>;

export function createMailbox(callback: MailboxCallback, delay = 200): MailboxCallback {
    const bouncer = debounce(delay);
    let bouncerP = Promise.resolve();
    let callbackP: Promise<void>;

    let nextEvent: Event | null = null;
    let queuedEvent: Event | null = null;

    return event => {
        const doAction = () => {
            const event = nextEvent;
            nextEvent = null;

            if (queuedEvent != null) {
                nextEvent = queuedEvent;
                queuedEvent = null;

                bouncerP = bouncer();
                callbackP = bouncerP.then(doAction);
            }

            return callback(event);
        };

        if (nextEvent == null) {
            nextEvent = event;

            const p = bouncer();
            bouncerP = p;
            callbackP = p.then(doAction);
            return callbackP;
        }

        // If the event is older than the next event in the queue, ignore it
        if (event.timestamp <= nextEvent?.timestamp) {
            return callbackP;
        }

        // Check if the next event is being debounced
        const p = bouncer();
        if (p === bouncerP) {
            nextEvent = event;
            return callbackP;
        }

        queuedEvent = event;
        bouncerP = p;
        callbackP = p.then(doAction);
        return callbackP;
    };
}
