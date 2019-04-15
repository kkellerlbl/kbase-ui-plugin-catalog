define(['require'], (require) => {
    'use strict';
    function promiseTry(fun) {
        return new Promise((resolve, reject) => {
            try {
                return resolve(fun());
            } catch (ex) {
                reject(ex);
            }
        });
    }
    class Dispatcher {
        constructor({ node, runtime, views }) {
            this.currentPanel = null;
            this.hostNode = node;
            this.runtime = runtime;
            this.views = views;
            this.viewMap = new Map();
        }

        loadModule(modulePath) {
            return new Promise((resolve, reject) => {
                require([modulePath], (module) => {
                    resolve(module);
                }, (err) => {
                    reject(err);
                });
            });
        }

        start() {
            return Promise.all(
                this.views.map(({ module, view, type }) => {
                    return this.loadModule(module).then((module) => {
                        return { module, view, type: type || 'es6' };
                    });
                })
            ).then((modules) => {
                modules.forEach((loadedView) => {
                    this.viewMap.set(loadedView.view, loadedView);
                });
                return this;
            });
        }

        selectView(view) {
            // let's just dispatch on the first element, if any.
            // Defaults to account.
            return this.viewMap.get(view);
        }

        unmount() {
            if (!this.currentPanel) {
                return Promise.resolve();
            }
            return promiseTry(() => {
                return this.currentPanel.widget.stop();
            }).then(() => {
                return this.currentPanel.widget.detach();
            });
        }

        dispatch({ view: viewId, path, params }) {
            const view = this.selectView(viewId);
            if (!view || !view.module) {
                console.warn('bad view request', viewId, path, params);
                alert('oops, bad view request: ' + view);
                return;
            }

            if (this.currentPanel && this.currentPanel.view === view) {
                return this.currentPanel.widget.run(params);
            }

            return this.unmount()
                .then(() => {
                    let widget;
                    switch (view.type) {
                    case 'factory':
                        widget = view.module.make({ runtime: this.runtime });
                        break;
                    case 'es6':
                        widget = new view.module({ runtime: this.runtime });
                        break;
                    default:
                        throw new Error('Invalid view type: ' + view.type);
                    }
                    this.currentPanel = {
                        view,
                        widget
                    };
                    if (this.currentPanel.widget.init) {
                        return this.currentPanel.widget.init();
                    }
                })
                .then(() => {
                    return this.currentPanel.widget.attach(this.hostNode);
                })
                .then(() => {
                    return this.currentPanel.widget.start(params);
                })
                .catch((err) => {
                    console.error('ERROR', err);
                });
        }
    }

    return Dispatcher;
});
