define(['./windowChannel', './runtime'], (WindowChannel, Runtime) => {
    'use strict';

    class Integration {
        constructor({ rootWindow }) {
            this.rootWindow = rootWindow;
            this.container = rootWindow.document.body;
            // channelId, frameId, hostId, parentHost
            this.hostParams = this.getParamsFromIFrame();
            this.hostChannelId = this.hostParams.channelId;

            // The original params from the plugin (taken from the url)
            this.pluginParams = this.hostParams.params;

            this.authorized = null;

            this.navigationListeners = [];
            this.navigationQueue = [];

            this.channel = new WindowChannel.BidirectionalWindowChannel({
                on: this.rootWindow,
                host: document.location.origin,
                to: this.hostChannelId
            });

            this.runtime = null;
        }

        getParamsFromIFrame() {
            if (!this.rootWindow.frameElement.hasAttribute('data-params')) {
                throw new Error('No params found in window!!');
            }
            return JSON.parse(decodeURIComponent(this.rootWindow.frameElement.getAttribute('data-params')));
        }

        // render(ko) {
        //     this.rootViewModel = new RootViewModel({
        //         runtime: this.runtime,
        //         hostChannel: this.hostChannel,
        //         authorized: this.authorized,
        //         authorization: this.authorization,
        //         pluginParams: this.pluginParams
        //     });
        //     this.container.innerHTML = div(
        //         {
        //             style: {
        //                 flex: '1 1 0px',
        //                 display: 'flex',
        //                 flexDirection: 'column'
        //             }
        //         },
        //         gen.if(
        //             'ready',
        //             gen.component({
        //                 name: MainComponent.name(),
        //                 params: {
        //                     runtime: 'runtime',
        //                     bus: 'bus',
        //                     authorization: 'authorization',
        //                     pluginParams: 'pluginParams'
        //                 }
        //             })
        //         )
        //     );
        //     ko.applyBindings(this.rootViewModel, this.container);
        // }

        showHelp() {
            this.rootViewModel.bus.send('help');
        }

        onNavigate(listener) {
            this.navigationListeners.push(listener);
            if (this.navigationListeners.length === 1) {
                const queue = this.navigationQueue;
                this.navigationQueue = [];
                queue.forEach(({ path, params }) => {
                    this.navigationListeners.forEach((listener) => {
                        listener({ path, params });
                    });
                });
            }
        }

        handleNavigation({ path, params }) {
            // If no listeners yet, queue up the navigation.
            if (this.navigationListeners.length === 0) {
                this.navigationQueue.push({ path, params });
            } else {
                this.navigationListeners.forEach((listener) => {
                    listener({ path, params });
                });
            }
        }

        setupListeners() {
            this.channel.on('navigate', (message) => {
                const { path, params } = message;

                // TODO: proper routing to error page
                if (!path || path.length === 0) {
                    alert('no view provided...');
                    return;
                }

                this.handleNavigation({ path, params });
            });
        }

        setupRuntimeListeners() {
            this.runtime.messenger.receive({
                channel: 'app',
                message: 'navigate',
                handler: (to) => {
                    this.channel.send('ui-navigate', to);
                }
            });
            this.runtime.messenger.receive({
                channel: 'app',
                message: 'post-form',
                handler: ({ action, params }) => {
                    this.channel.send('post-form', { action, params });
                }
            });
            this.runtime.messenger.receive({
                channel: 'ui',
                message: 'setTitle',
                handler: (title) => {
                    this.channel.send('set-title', { title });
                }
            });
        }

        setupDOMListeners() {
            window.document.addEventListener('click', () => {
                this.channel.send('clicked', {});
            });
            window.addEventListener('hashchange', () => {
                const hash = window.location.hash;
                const path = hash.substr(1);
                this.channel.send('ui-navigate', {
                    path
                });
            });
        }

        started() {
            this.channel.send('started', {});
        }

        start() {
            return new Promise((resolve, reject) => {
                this.channel.start();

                // The start event is built in to the integration.
                // It means that the parent context (ui) has received the
                // ready message, is itself ready, and is ready for
                // the iframe app to start running.
                this.channel.on('start', (payload) => {
                    const { token, username, config, realname, email } = payload;
                    if (token) {
                        this.authorization = { token, username, realname, email };
                    } else {
                        this.authorization = null;
                    }
                    this.token = token;
                    this.username = username;
                    this.config = config;
                    this.authorized = token ? true : false;

                    this.runtime = new Runtime({
                        config,
                        token,
                        username
                    });

                    this.runtime
                        .start()
                        .then(() => {
                            this.setupListeners();
                            this.setupRuntimeListeners();
                            this.setupDOMListeners();
                            resolve();
                        })
                        .catch((err) => {
                            reject(err);
                        });

                    // this.runtime = new runtime.Runtime({ config, token, username, realname, email });
                    // this.render(ko);

                    // this.rootViewModel.bus.on('set-plugin-params', ({ pluginParams }) => {
                    //     this.hostChannel.send('set-plugin-params', { pluginParams });
                    // });

                    // this.channel.on('show-help', () => {
                    //     this.showHelp();
                    // });

                    // this.channel.on('loggedin', ({ token, username, realname, email }) => {
                    //     this.runtime.auth({ token, username, realname, email });
                    //     this.rootViewModel.authorized(true);
                    //     this.rootViewModel.authorization({ token, username, realname, email });
                    //     // really faked for now.
                    //     // this.runtime.service('session').
                    // });

                    // this.channel.on('loggedout', () => {
                    //     this.runtime.unauth();
                    //     this.rootViewModel.authorized(false);
                    //     this.rootViewModel.authorization(null);
                    // });

                    // this.rootViewModel.bus.on('instrumentation', (payload) => {
                    //     this.hostChannel.send('send-instrumentation', payload);
                    // });

                    // this.hostChannel.send('add-button', {
                    //     button: {
                    //         name: 'feedback',
                    //         label: 'Feedback',
                    //         style: 'default',
                    //         icon: 'bullhorn',
                    //         toggle: false,
                    //         params: {
                    //         },
                    //         callbackMessage: ['show-feedback', null]
                    //     }
                    // });

                    // this.hostChannel.send('add-button', {
                    //     button: {
                    //         name: 'help',
                    //         label: 'Help',
                    //         style: 'default',
                    //         icon: 'question-circle',
                    //         toggle: false,
                    //         params: {
                    //         },
                    //         callbackMessage: ['show-help', null]
                    //     }
                    // });
                });

                // Sending 'ready' with our channel id and host name allows the
                // enclosing app (window) to send us messages on our very own channel.
                // We could just use the host's channel, have all sends and receives
                // on the same channel, with control via the channel id. However, there is a risk
                // the the channels will listen on for the same message ... unlikely though.
                // Still, it would be odd for one window to listen for messages on another...
                this.channel.send('ready', {});
            });
        }

        stop() {}
    }

    return Integration;
});
