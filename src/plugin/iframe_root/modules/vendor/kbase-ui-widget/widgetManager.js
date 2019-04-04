define([
    'bluebird',
    './adapters/objectWidget',
    './adapters/kbWidget'
], function (
    Promise,
    widgetAdapter,
    KBWidgetAdapter
) {
    'use strict';

    function factory(config) {
        // Variables
        // The widget registry is a db (map) of widget definitions.
        // Note that we do NOT YET store widget instance references ...
        var widgets = {},
            runtime = config.runtime;

        // Functions

        // API Functions

        function addWidget(widgetDef) {
            if (widgetDef.id) {
                widgetDef.name = widgetDef.id;
            }
            if (widgets[widgetDef.name]) {
                throw new Error('Widget ' + widgetDef.name + ' is already registered');
            }
            /* TODO:  validate the widget ...*/
            widgets[widgetDef.name] = widgetDef;
        }

        function getWidget(widgetId) {
            return widgets[widgetId];
        }

        function makeFactoryWidget(widget, config) {
            return new Promise(function (resolve, reject) {
                var required = [widget.module];
                if (widget.css) {
                    required.push('css!' + widget.module + '.css');
                }
                require(required, function (factory) {
                    if (typeof factory === 'undefined') {
                        reject({
                            message: 'Factory widget maker is undefined for ' + widget.module,
                            data: { widget: widget }
                        });
                        return;
                    }
                    if (factory.make === undefined) {
                        reject('Factory widget does not have a "make" method: ' + widget.name + ', ' + widget.module);
                        return;
                    }
                    try {
                        resolve(factory.make(config));
                    } catch (ex) {
                        reject(ex);
                    }
                });
            });
        }

        function makeES6Widget(widget, config) {
            return new Promise(function (resolve, reject) {
                var required = [widget.module];
                if (widget.css) {
                    required.push('css!' + widget.module + '.css');
                }
                require(required, function (Widget) {
                    if (typeof Widget === 'undefined') {
                        reject({
                            message: 'Widget class is undefined for ' + widget.module,
                            data: { widget: widget }
                        });
                        return;
                    }
                    // if (factory.make === undefined) {
                    //     reject('Factory widget does not have a "make" method: ' + widget.name + ', ' + widget.module);
                    //     return;
                    // }
                    try {
                        resolve(new Widget(config));
                    } catch (ex) {
                        reject(ex);
                    }
                });
            });
        }

        function makeObjectWidget(widget, config) {
            return Promise.try(function () {
                return widgetAdapter.make({
                    widgetDef: widget,
                    initConfig: config,
                    adapterConfig: {
                        runtime: runtime
                    }
                });
            });
        }

        function makeKbWidget(widget, config) {
            return Promise.try(function () {
                var adapterConfig = {
                    runtime: runtime,
                    widget: {
                        module: widget.module,
                        jquery_object: (widget.config && widget.config.jqueryName) || config.jqueryName,
                        panel: config.panel,
                        title: widget.title
                    }
                };
                return KBWidgetAdapter.make(adapterConfig);
            });
        }

        function validateWidget(widget, name) {
            var message;
            if (typeof widget !== 'object') {
                message = 'Invalid widget after making: ' + name;
            }

            if (message) {
                console.error(message);
                console.error(widget);
                throw new Error(message);
            }
        }

        function makeWidget(widgetName, config) {
            var widgetDef = widgets[widgetName],
                widgetPromise;
            if (!widgetDef) {
                throw new Error('Widget ' + widgetName + ' not found');
            }

            config = config || {};
            config.runtime = runtime;

            // How we create a widget depends on what type it is.               
            switch (widgetDef.type) {
            case 'factory':
                widgetPromise = makeFactoryWidget(widgetDef, config);
                break;
            case 'es6':
                widgetPromise = makeES6Widget(widgetDef, config);
                break;
            case 'object':
                widgetPromise = makeObjectWidget(widgetDef, config);
                break;
            case 'kbwidget':
                widgetPromise = makeKbWidget(widgetDef, config);
                break;
            default:
                throw new Error('Unsupported widget type ' + widgetDef.type);
            }
            return widgetPromise
                .then(function (widget) {
                    validateWidget(widget, widgetName);
                    return widget;
                });
        }


        // API
        return {
            addWidget: addWidget,
            getWidget: getWidget,
            makeWidget: makeWidget
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});