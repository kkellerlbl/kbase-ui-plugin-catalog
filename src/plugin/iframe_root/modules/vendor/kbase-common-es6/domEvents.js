define([
    'uuid'
], function (
    Uuid
) {
    'use strict';

    function makeUuid() {
        return 'id_' + new Uuid(4).format();
    }

    class DOMEvent {
        constructor({type, handler}) {
            this.type = type;
            this.handler = handler;
        }
    }

    class DOMEvents {
        constructor({node}) {
            this.root = node;

            this.events = [];
        }

        addEvent(event) {
            let selector, id;
            if (event.id) {
                id = event.id;
                selector = '#' + event.id;
            } else if (event.selector) {
                id = makeUuid();
                selector = event.selector;
            } else {
                id = makeUuid();
                selector = '#' + id;
            }
            this.events.push({
                type: event.type,
                selector: selector,
                handler: (e) => {
                    event.handler(e);
                }
            });
            return id;
        }

        addEvents(newEvents) {
            let selector, id;
            if (newEvents.id) {
                id = newEvents.id;
                selector = '#' + newEvents.id;
            } else if (newEvents.selector) {
                id = makeUuid();
                selector = newEvents.selector;
            } else {
                id = makeUuid();
                selector = '#' + id;
            }
            newEvents.events.forEach((event) => {
                this.events.push({
                    type: event.type,
                    selector: selector,
                    handler: (e) => {
                        event.handler(e);
                    }
                });
            });
            return id;
        }

        attachEvents() {
            this.events.forEach((event) => {
                var node = this.root.querySelector(event.selector);
                event.node = node;
                if (!node) {
                    throw new Error('could not find node for ' + event.selector);
                }
                node.addEventListener(event.type, event.handler);
            });
            this.events = [];
        }

        detachEvents() {
            this.events.forEach((event) => {
                event.node.removeEventListener(event.type, event.handler);
            });
        }
    }

    return {DOMEvents, DOMEvent};
});