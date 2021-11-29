"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mailbox_1 = require("../util/mailbox");
const resolved_path_1 = require("../util/resolved_path");
const event_1 = require("../watcher/event");
describe('mailbox', () => {
    it('should handle being called once', async () => {
        const filePath = resolved_path_1.ResolvedPath.absolute('/test');
        const mailboxFn = (0, mailbox_1.createMailbox)(async (event) => {
            assert.strictEqual(event, expectedEvent);
        });
        let expectedEvent = new event_1.Event(event_1.EventType.ChangeFile, filePath, new Date('2020-01-02T03:04:05'));
        await mailboxFn(expectedEvent);
    });
    it('should return the same promise if it can', async () => {
        const filePath = resolved_path_1.ResolvedPath.absolute('/test');
        const mailboxFn = (0, mailbox_1.createMailbox)(async (event) => {
            assert.strictEqual(event, expectedEvent);
        });
        let expectedEvent = new event_1.Event(event_1.EventType.ChangeFile, filePath, new Date('2020-01-02T03:04:05'));
        const p1 = mailboxFn(expectedEvent);
        const p2 = mailboxFn(expectedEvent);
        assert.strictEqual(p1, p2);
        await p1;
    });
    it('should queue events while one is pending', async () => {
        const filePath = resolved_path_1.ResolvedPath.absolute('/test');
        const mailboxFn = (0, mailbox_1.createMailbox)(async (event) => {
            assert.strictEqual(event, expectedEvent);
        });
        const e1 = new event_1.Event(event_1.EventType.ChangeFile, filePath, new Date('2021-01-02T03:04:05'));
        const e2 = new event_1.Event(event_1.EventType.ChangeFile, filePath, new Date('2022-01-02T03:04:05'));
        let expectedEvent = e1;
        const p1 = mailboxFn(e1);
        const p2 = mailboxFn(e2);
        await p1;
        expectedEvent = e2;
        await p2;
    });
    it('should ignore events that are timestamped before the queued event', async () => {
        const filePath = resolved_path_1.ResolvedPath.absolute('/test');
        const mailboxFn = (0, mailbox_1.createMailbox)(async (event) => {
            assert.strictEqual(event, expectedEvent);
        });
        const e1 = new event_1.Event(event_1.EventType.ChangeFile, filePath, new Date('2021-01-02T03:04:05')); // first
        const e2 = new event_1.Event(event_1.EventType.ChangeFile, filePath, new Date('2023-01-02T03:04:05')); // third
        const e3 = new event_1.Event(event_1.EventType.ChangeFile, filePath, new Date('2022-01-02T03:04:05')); // second
        let expectedEvent = e1;
        const p1 = mailboxFn(e1);
        const p2 = mailboxFn(e2);
        const p3 = mailboxFn(e3);
        assert.strictEqual(p2, p3);
        await p1;
        expectedEvent = e2;
        await p2;
        await p3;
    });
});
