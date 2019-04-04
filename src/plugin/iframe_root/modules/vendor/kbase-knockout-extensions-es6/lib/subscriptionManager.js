define([
], function (
) {
    'use strict';

    class SubscriptionManager {
        constructor() {
            this.subscriptions = [];
        }

        add(subscription) {
            this.subscriptions.push(subscription);
        }

        dispose() {
            this.subscriptions.forEach(function (sub, index) {
                try {
                    sub.dispose();
                } catch (ex) {
                    console.error('Error disposing of subscription: ' + index);
                }
            });
        }
    }

    return SubscriptionManager;
});