define([
    'bluebird'
], function (
    Promise
) {
    'use strict';

    function factory(config) {
        var mounted = config.node,
            container, runtime = config.runtime,
            currentMountId = 0,
            mountedWidget;

        if (!mounted) {
            throw new Error('Cannot create widget mount without a parent node. Pass it as "node"');
        }
        if (!runtime) {
            throw new Error('The widget mounter needs a runtime object in order to find and mount widgets.');
        }

        container = mounted;

        function unmount() {
            return Promise.try(function () {
                // TODO make no assumptions about what is mounted, just 
                // unmount anything we find...
                var widget;
                if (mountedWidget) {
                    mountedWidget.promise.cancel();
                    widget = mountedWidget.widget;
                    return Promise.try(function () {
                            return widget.stop && widget.stop();
                        })
                        .then(function () {
                            return widget.detach && widget.detach();
                        })
                        .then(function () {
                            container.innerHTML = '';
                        })
                        .then(function () {
                            return widget.destroy && widget.destroy();
                        })
                        .catch(function (err) {
                            // ignore errors while unmounting widgets.
                            console.error('ERROR unmounting widget');
                            console.error(err);
                            return null;
                        })
                        .finally(function () {
                            mountedWidget = null;
                        });
                }
                return null;
            });
        }

        function mount(widgetId, params) {
            // We create the widget mount object first, in order to be 
            // able to attache its mounting promise to itself. This is what
            // allows us to interrupt it if the route changes and we need
            // to unmount before it is finished.
            mountedWidget = {
                mountId: currentMountId,
                widget: null,
                container: null
            };
            mountedWidget.promise = Promise.try(function () {
                    // Make an instance of the requested widget.
                    return runtime.service('widget').makeWidget(widgetId, {});
                })
                .then(function (widget) {
                    // Wrap it in a mount object to help manage it.
                    if (!widget) {
                        throw new Error('Widget could not be created: ' + widgetId);
                    }
                    mountedWidget.widget = widget;
                    return Promise.all([widget, widget.init && widget.init()]);
                })
                .spread(function (widget) {
                    // Give it a container and attach it to it.

                    // aww, just give it the container...
                    // mountedWidget.container = container.appendChild(dom.createElement('div'));
                    mountedWidget.container = container;
                    return Promise.all([widget, widget.attach && widget.attach(mountedWidget.container)]);
                })
                .spread(function (widget) {
                    // Start it if applicable.
                    return Promise.all([widget, widget.start && widget.start(params)]);
                })
                .spread(function (widget) {
                    // Run it if applicable
                    return Promise.all([widget, widget.run && widget.run(params)]);
                })
                .spread(function (widget) {
                    return widget;
                });
            return mountedWidget.promise;
        }

        function mountWidget(widgetId, params) {
            return unmount()
                .then(function () {
                    return mount(widgetId, params);
                });
        }

        return {
            mountWidget: mountWidget,
            mount: mount,
            unmount: unmount
        };
    }
    return {
        make: function (config) {
            return factory(config);
        }
    };
});