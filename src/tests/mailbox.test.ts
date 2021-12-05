import { expect } from 'chai';
import { createMailbox } from '../util/mailbox';
import { ResolvedPath } from '../util/resolved_path';
import { Event, EventType } from '../watcher/event';

describe('mailbox', () => {
    it('should handle being called once', async () => {
        const filePath = ResolvedPath.absolute('/test');
        const mailboxFn = createMailbox(async event => {
            expect(event).to.equal(expectedEvent);
        });

        let expectedEvent = new Event(EventType.ChangeFile, filePath, new Date('2020-01-02T03:04:05'));
        await mailboxFn(expectedEvent);
    });

    it('should return the same promise if it can', async () => {
        const filePath = ResolvedPath.absolute('/test');
        const mailboxFn = createMailbox(async event => {
            expect(event).to.equal(expectedEvent);
        });

        let expectedEvent = new Event(EventType.ChangeFile, filePath, new Date('2020-01-02T03:04:05'));
        const p1 = mailboxFn(expectedEvent);
        const p2 = mailboxFn(expectedEvent);
        expect(p1).to.equal(p2);
        await p1;
    });

    it('should queue events while one is pending', async () => {
        const filePath = ResolvedPath.absolute('/test');
        const mailboxFn = createMailbox(async event => {
            expect(event).to.equal(expectedEvent);
        });

        const e1 = new Event(EventType.ChangeFile, filePath, new Date('2021-01-02T03:04:05'));
        const e2 = new Event(EventType.ChangeFile, filePath, new Date('2022-01-02T03:04:05'));

        let expectedEvent = e1;
        const p1 = mailboxFn(e1);
        const p2 = mailboxFn(e2);

        await p1;
        expectedEvent = e2;
        await p2;
    });

    it('should ignore events that are timestamped before the queued event', async () => {
        const filePath = ResolvedPath.absolute('/test');
        const mailboxFn = createMailbox(async event => {
            expect(event).to.equal(expectedEvent);
        });

        const e1 = new Event(EventType.ChangeFile, filePath, new Date('2021-01-02T03:04:05')); // first
        const e2 = new Event(EventType.ChangeFile, filePath, new Date('2023-01-02T03:04:05')); // third
        const e3 = new Event(EventType.ChangeFile, filePath, new Date('2022-01-02T03:04:05')); // second

        let expectedEvent = e1;
        const p1 = mailboxFn(e1);
        const p2 = mailboxFn(e2);
        const p3 = mailboxFn(e3);
        expect(p2).to.equal(p3);

        await p1;
        expectedEvent = e2;
        await p2;
        await p3;
    });
});
