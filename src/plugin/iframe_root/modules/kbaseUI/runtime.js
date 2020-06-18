define([
    'bluebird',
    'kb_lib/props',
    'kb_lib/messenger',
    './widget/manager',
    './services/session',
    './services/widget'
], (Promise, props, Messenger, WidgetManager, SessionService, WidgetService) => {
    'use strict';

    class Runtime {
        constructor({ token, username, config, pluginConfig }) {
            this.token = token;
            this.username = username;
            this.widgetManager = new WidgetManager({
                baseWidgetConfig: {
                    runtime: this
                }
            });

            this.configDb = new props.Props({ data: config });

            this.pluginPath = `/modules/plugins/${pluginConfig.package.name}/iframe_root`;
            this.pluginResourcePath = this.pluginPath + '/resources';

            this.messenger = new Messenger();

            this.heartbeatTimer = null;

            this.services = {
                session: new SessionService({ runtime: this }),
                widget: new WidgetService({ runtime: this })
            };
        }

        config(path, defaultValue) {
            return this.configDb.getItem(path, defaultValue);
        }

        getConfig(path, defaultValue) {
            return this.config(path, defaultValue);
        }

        service(name) {
            switch (name) {
            case 'session':
                return this.services.session;
            case 'widget':
                return this.services.widget;
            }
        }

        getService(name) {
            return this.service(name);
        }

        send(channel, message, data) {
            this.messenger.send({ channel, message, data });
        }

        receive(channel, message, handler) {
            return this.messenger.receive({ channel, message, handler });
        }

        recv(channel, message, handler) {
            return this.receive(channel, message, handler);
        }

        drop(subscription) {
            this.messenger.unreceive(subscription);
        }

        start() {
            return Promise.try(() => {
                this.heartbeatTimer = window.setInterval(() => {
                    this.send('app', 'heartbeat', { time: new Date().getTime() });
                }, 1000);
                return this.services.session.start();
            });
        }

        stop() {
            return Promise.try(() => {
                window.clearInterval(this.heartbeatTimer);

                return this.services.session.stop();
            });
        }
    }

    return Runtime;
});
