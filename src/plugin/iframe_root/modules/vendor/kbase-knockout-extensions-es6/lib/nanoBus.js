define([], function () {
    'use strict';

    const READY = Symbol();
    const STOPPED = Symbol();
    const SCHEDULED = Symbol();

    class NanoBus {
        constructor({link} = {}) {
            this.queue = [];
            this.runInterval = 0;
            this.messageReceivers = {};

            this.link = link;

            this.state = READY;
        }

        processQueue() {
            const processing = this.queue;
            this.queue = [];
            processing.forEach((message) => {
                const receivers = this.messageReceivers[message.id];
                if (!receivers) {
                    if (this.link) {
                        this.link.send(message.id, message.payload);
                    }
                    return;
                }
                receivers.forEach((receiver) => {
                    try {
                        receiver(message.payload);
                    } catch (ex) {
                        console.error('Error processing message: ' + ex.message, ex);
                    }
                });
            });
        }

        run() {
            if (this.state === SCHEDULED) {
                return;
            }
            if (this.queue.length === 0) {
                return;
            }
            // window.requestAnimationFrame(() => {
            //     if (this.state === STOPPED) {
            //         return;
            //     }
            //     this.state = READY;
            //     this.processQueue();
            //     // just in case any new messages crept in.
            //     if (this.queue.length > 0) {
            //         this.run();
            //     }
            // });

            window.setTimeout(() => {
                if (this.state === STOPPED) {
                    return;
                }
                this.state = READY;
                this.processQueue();
                // just in case any new messages crept in.
                if (this.queue.length > 0) {
                    this.run();
                }
            }, 0);

            this.state = SCHEDULED;
        }

        send(id, payload) {
            if (this.state === STOPPED) {
                return;
            }
            this.queue.push({
                id: id,
                payload: payload
            });
            this.run();
        }

        on(id, handler) {
            if (!this.messageReceivers[id]) {
                this.messageReceivers[id] = [];
            }
            this.messageReceivers[id].push(handler);
        }

        stop() {
            this.queue = [];
            this.state = STOPPED;
        }
    }

    return NanoBus;
});
