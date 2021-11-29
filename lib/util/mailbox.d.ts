import { Event } from '../watcher/event';
declare type MailboxCallback = (event: Event) => Promise<void>;
export declare function createMailbox(callback: MailboxCallback): MailboxCallback;
export {};
