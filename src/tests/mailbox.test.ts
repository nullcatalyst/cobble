import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { createMailbox } from '../util/mailbox';
import { ResolvedPath } from '../util/resolved_path';
import { Event, EventType } from '../watcher/event';
import { FakeWatcher } from '../watcher/fake';

chai.use(chaiAsPromised);

describe('mailbox', () => {
    it('should handle being called once', async () => {
        const filePath = ResolvedPath.absolute('/test');
        const mailboxFn = createMailbox(async event => {
            expect(event).to.equal(expectedEvent);
        });

        let expectedEvent = new Event(EventType.ChangeFile, filePath, new Date('2020-01-02T03:04:05'));
        await mailboxFn(expectedEvent);
    });

    it('should handle rejected promises', async () => {
        const mailboxFn = createMailbox(async event => {
            throw new Error('test');
        });

        let expectedEvent = new Event(
            EventType.ChangeFile,
            ResolvedPath.absolute('/test'),
            new Date('2020-01-02T03:04:05'),
        );

        expect(mailboxFn(expectedEvent)).to.eventually.be.rejectedWith('test');
    });

    it('should handle rejected promises', async () => {
        const mailboxFn = createMailbox(async event => {
            throw new Error('test');
        });

        const filePath = ResolvedPath.absolute('/test');
        const watcher = new FakeWatcher(-1);
        watcher.add(filePath, mailboxFn);

        expect(
            watcher.emit(
                new Event(EventType.ChangeFile, ResolvedPath.absolute('/test'), new Date('2020-01-02T03:04:05')),
            ),
        ).to.eventually.be.rejectedWith('test');
    });

    it('should not fail if the previous mailbox entry was rejected', async () => {
        const resolves: (() => void)[] = [null!, null!];
        const rejects: ((err?: Error) => void)[] = [null!, null!];
        const p0 = new Promise<void>((resolve, reject) => {
            resolves[0] = resolve;
            rejects[0] = reject;
        });
        const p1 = new Promise<void>((resolve, reject) => {
            resolves[1] = resolve;
            rejects[1] = reject;
        });

        let first = true;
        const mailboxFn = createMailbox(event => {
            if (first) {
                first = false;
                return p0;
            }
            return p1;
        });

        const filePath = ResolvedPath.absolute('/test');
        const watcher = new FakeWatcher(-1);
        watcher.add(filePath, mailboxFn);

        expect(
            watcher.emit(
                new Event(EventType.ChangeFile, ResolvedPath.absolute('/test'), new Date('2020-01-02T03:04:05')),
            ),
        ).to.eventually.be.rejectedWith('test');

        expect(
            watcher.emit(
                new Event(EventType.ChangeFile, ResolvedPath.absolute('/test'), new Date('2020-01-03T03:04:05')),
            ),
        ).to.eventually.equal(undefined);

        rejects[0](new Error('test'));
        resolves[1]();
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
