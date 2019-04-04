define([
    'bluebird',
    'underscore',
    'kb_common/dom',
    'kb_common/state',
    'kb_common/html'
], function (
    Promise,
    _,
    dom,
    State,
    html
) {
    'use strict';

    function makeWidget(config) {
        var mount, container, hooks = [],
            listeners = [],
            state = State.make(),
            runtime = config.runtime,
            internalApi = {},
            params = State.make(),
            paramDefaults = config.defaults,
            places = {},
            widgetClass, widgetIcon;

        setStatus('new');

        if (!runtime) {
            // Get fancier later.
            setError({
                type: 'ArgumentError',
                reason: 'RuntimeMissing',
                blame: 'dataWidget',
                message: 'The runtime argument was not provided'
            });
            throw new Error('The runtime argument was not provided');
            //throw {
            //    type: 'ArgumentError',
            //    reason: 'RuntimeMissing',
            //    blame: 'dataWidget',
            //    message: 'The runtime argument was not provided'
            //};
        }

        widgetClass = config.class;
        widgetIcon = config.icon;

        // The hooks for widget objects.
        function addHook(name, fun) {
            if (!hooks.hasOwnProperty(name)) {
                hooks[name] = [];
            }
            hooks[name].push(fun);
        }

        function hook(name, fun) {
            if (_.isArray(name)) {
                name.forEach(function (hookDef) {
                    addHook(hookDef[0], hookDef[1]);
                });
            } else {
                addHook(name, fun);
            }
        }

        function hasHook(name) {
            if (hooks.hasOwnProperty(name)) {
                return true;
            }
            return false;
        }

        function getHook(name) {
            if (hasHook(name)) {
                return hooks[name];
            }
            return [];
        }

        // CONFIG
        function getConfig(prop, defaultValue) {
            return runtime.getConfig(prop, defaultValue);
        }

        function hasConfig(prop) {
            return runtime.hasConfig(prop);
        }

        // STATE
        // 
        // Interacting with state
        function setState(prop, value) {
            state.set(prop, value);
        }

        function getState(prop, defaultValue) {
            return state.get(prop, defaultValue);
        }

        function hasState(prop) {
            return state.has(prop);
        }

        function setClean() {
            return state.setClean();
        }

        // STATUS
        function setStatus(newStatus) {
            status = newStatus;
        }

        function getStatus() {
            return status;
        }


        // Just params
        function setParam(prop, value) {
            params.set(prop, value);
        }

        function getParam(prop, defaultValue) {
            return params.get(prop, defaultValue || paramDefaults[prop]);
        }

        function hasParam(prop) {
            return params.has(prop);
        }

        // Direct interaction with DOM, discouraged, but sometimes necessary.
        function getDomNode() {
            return container;
        }


        // EVENTS
        function recv(channel, message, handler) {
            listeners.push(runtime.recv(channel, message, handler));
        }

        function send(channel, message, data) {
            runtime.send(channel, message, data);
        }

        // DOM EVENTS

        function makeListener(config) {
            var delegatedListeners = [];

            function handler(e) {
                delegatedListeners.forEach(function (listener) {
                    try {
                        if (e.target.matches(listener.selector)) {
                            listener.handler(e);
                        }
                    } catch (ex) {
                        console.error('Error handling listener');
                        console.error(ex);
                    }
                });
            }

            function addDelegatedListener(eventSpec) {
                delegatedListeners.push(eventSpec);
            }

            return {
                type: config.type,
                added: new Date(),
                delegatedListeners: delegatedListeners,
                addEvent: addDelegatedListener,
                handler: handler
            };
        }


        // Listener is now on the entire container. This way we don't need
        // to bother with installing and uninstalling listeners on nodes
        // as they are created and removed, and can have more interesting
        // behavior
        // I.E. delegated listeners.
        var eventTypesListenedFor = {};

        function attachListeners() {
            Object.keys(eventTypesListenedFor).forEach(function (type) {
                var listener = eventTypesListenedFor[type];
                container.addEventListener(listener.type, listener.handler, true);
            });
        }

        function addListener(type) {
            var listener = getListener(type);
            if (!listener) {
                listener = makeListener({ type: type });
                // TODO: how to best handle use capture? (3rd param)
                // container.addEventListener(type, listener.handler, false);
                eventTypesListenedFor[type] = listener;
            }
            return listener;
        }

        function getListener(type) {
            return eventTypesListenedFor[type];
        }

        function removeListener() {

        }

        function addDomEvent(event) {
            var listener = getListener(event.type);
            if (!listener) {
                listener = addListener(event.type);
            }
            listener.addEvent(event);
        }

        // Object construction setup

        if (config && config.on) {
            Object.keys(config.on).forEach(function (hookName) {
                addHook(hookName, config.on[hookName]);
            });
        }

        if (config && config.events) {
            config.events.forEach(function (event) {
                addDomEvent(event);
            });
        }


        // INTERNAL API

        internalApi = Object.freeze({
            recv: recv,
            send: send,
            getConfig: getConfig,
            hasConfig: hasConfig,
            getState: getState,
            setState: setState,
            hasState: hasState,
            getParam: getParam,
            setParam: setParam,
            hasParam: hasParam,
            getPlace: getPlace,
            getDomNode: getDomNode,
            get: getState,
            set: setState,
            addDomEvent: addDomEvent,
            // attachDomEvent: attachDomEvent,
            setTitle: setTitle,
            runtime: runtime
        });

        // RENDERING

        function renderError() {
            setClean();
            var error = getState('error');
            if (error) {
                var content = html.makeObjectTable(error, Object.keys(error));
                setContent('error', content);
                setContent('body', '');
            }
        }

        function render() {
            return Promise.try(function () {
                if (!state.isDirty()) {
                    return;
                }
                setClean();
                // For now we assume that rendering blows away dom events
                // and re-initializes them.
                // Let us get more subtle later.
                // detachDomEvents();

                // If we are in an error state, do the special error rendering,
                // that's all.
                if (isError()) {
                    renderError();
                    return;
                }

                var renderHooks = getHook('render');
                if (renderHooks.length > 1) {
                    throw {
                        type: 'HookError',
                        reason: 'TooManyHooks',
                        message: 'The render hook only supports 0 or 1 hooks'
                    };
                } else if (renderHooks.length === 0) {
                    return;
                }
                return Promise.try(function () {
                        return renderHooks[0].call(internalApi);
                    })
                    .then(function (results) {
                        if (results) {
                            if (typeof results === 'object') {
                                if (results.content) {
                                    setContent('body', results.content);
                                }
                                if (results.after) {
                                    try {
                                        results.after.call(internalApi);
                                    } catch (ex) {
                                        console.log('Error running "after" method for render');
                                        console.log(ex);
                                        setContent('error', 'Error running "after" method for render');
                                    }
                                }
                            } else {
                                setContent('body', results);
                            }
                        }
                    })
                    .then(function () {
                        // attachDomEvents();
                        return null;
                    });
            });
        }

        // Data
        function addErrorMessage(errorObject) {
            console.log('ERROR');
            console.log(errorObject);
        }

        // invokes an arbitrary set of data fetch hooks, each of which sets
        // a property on the observed object in order to invoke
        function fetchData(params) {
            return Promise.try(function () {
                    if (hasHook('fetch')) {
                        var promises = getHook('fetch').map(function (fun) {
                            return Promise.try(function () {
                                return fun.call(internalApi, params);
                            });
                        });
                        return Promise.all(promises)
                            .then(function (results) {
                                results.forEach(function (result) {
                                    if (result) {
                                        setState(result.name, result.value);
                                    }
                                });
                            });
                    }
                })
                .then(function () {
                    setStatus('fetched');
                });
        }

        function buildLayout() {
            var div = html.tag('div'),
                span = html.tag('span'),
                id = html.genId(),
                content = div({ class: 'panel panel-default ' + widgetClass }, [
                    div({ class: 'panel-heading' }, [
                        div({ class: 'kb-row' }, [
                            div({ class: '-col -span-8' }, [
                                span({ class: 'fa pull-left fa-' + widgetIcon, style: { fontSize: '150%', paddingRight: '10px' } }),
                                span({ class: 'panel-title', style: { verticalAlign: 'middle' }, dataElement: 'title' })
                            ]),
                            div({ class: '-col -span-4', style: { textAlign: 'right' } }, [
                                div({ class: 'btn-group', dataPlaceholder: 'buttons' })
                            ])
                        ])
                    ]),
                    div({ class: 'panel-body' }, [
                        div({ dataElement: 'body' }),
                        div({ dataElement: 'error' })
                    ])
                ]);
            return {
                id: id,
                content: content
            };
        }


        function buildCollapseLayout(config) {
            var div = html.tag('div'),
                span = html.tag('span'),
                id = html.genId(),
                headingId = html.genId(),
                collapseId = html.genId(),
                content = div({ id: id, class: 'panel panel-default' }, [
                    div({ id: headingId, class: 'panel-heading' }, [
                        span({ class: 'panel-title' }, [
                            span({
                                class: (config.collapsed ? 'collapsed' : ''),
                                style: { cursor: 'pointer' },
                                ariaControls: collapseId,
                                ariaExpanded: (config.collapsed ? 'false' : 'true'),
                                dataTarget: '#' + collapseId,
                                dataToggle: 'collapse',
                                dataElement: 'title'
                            })
                        ])
                    ]),
                    div({
                        id: collapseId,
                        class: 'panel-collapse collapse in',
                        areaLabelledby: headingId
                    }, [
                        div({ class: 'panel-body' }, [
                            div({ dataElement: 'body' }),
                            div({ dataElement: 'error' })
                        ])
                    ])
                ]);
            return {
                id: id,
                content: content
            };
        }
        // var layout = buildCollapseLayout({collapsed: false});
        var layout;

        function getLayout() {
            if (!layout) {
                layout = buildLayout();
            }
            return layout;
        }

        function setContent(element, content) {
            var node = container.querySelector('[data-element="' + element + '"]');
            if (node) {
                node.innerHTML = content;
            }
        }

        function setTitle(content) {
            var node = container.querySelector('[data-element="title"]');
            if (node) {
                node.innerHTML = content;
            }
        }

        function getNode(element) {
            return container.querySelector('[data-element="' + element + '"]');
        }

        // Places
        function getPlace(name) {
            return places[name];
        }

        // The Interface

        function init(config) {
            return Promise.try(function () {
                if (hasHook('init')) {
                    var promises = getHook('init').map(function (fun) {
                        return Promise.try(function () {
                            return fun.call(internalApi, config);
                        });

                    });
                    return Promise.all(promises);
                }
            });
        }

        function attach(node) {
            return Promise.try(function () {
                mount = node;
                container = dom.append(mount, dom.createElement('div'));
                attachListeners();
                container.innerHTML = getLayout().content;
                if (hasHook('attach')) {
                    var promises = getHook('attach').map(function (fun) {
                        return Promise.try(function () {
                            return fun.call(internalApi, container);
                        });
                    });
                    return Promise.all(promises)
                        .then(function () {
                            // attachDomEvents();
                            return null;
                        });
                } else if (hasHook('layout')) {
                    var layout = getHook('layout')[0];
                    return Promise.try(function () {
                            return layout.call(internalApi);
                        })
                        .then(function (result) {
                            setContent('body', result.content);
                            Object.keys(result.places).forEach(function (name) {
                                var place = result.places[name],
                                    node;
                                if (place.id) {
                                    place.node = document.getElementById(place.id);
                                }
                                places[name] = place;
                            });
                        });
                }
            });
        }

        function setError(arg) {
            setStatus('error');
            setState('error', arg);
        }

        function renderDataAccessError(error) {
            if (error.status && error.status === 500) {
                return html.makeTableRotated({
                    class: 'table table-striped',
                    columns: ['Name', 'Code', 'Message', 'Source Error'],
                    rows: [
                        [error.error.name, error.error.code, error.error.message, error.error.error]
                    ]
                });
            } else {
                return 'not a data access error';
            }
        }

        function isError() {
            return status === 'error';
        }

        function start(params) {
            return Promise.try(function () {
                // Start the heartbeat listener, which presently just 
                // renders.

                if (config.title) {
                    setTitle(config.title);
                }

                listeners.push(runtime.recv('app', 'heartbeat', function () {
                    render()
                        .then(function () {
                            // what here?
                        })
                        .catch(function (err) {
                            // handle render error
                            setError({
                                type: 'RenderError',
                                message: 'An error was encountered while rendering',
                                description: renderDataAccessError(err),
                                data: err
                            });
                        });
                }));
                return Promise.try(function () {
                        var promises = [];
                        if (hasHook('initialContent')) {
                            getHook('initialContent').forEach(function (fun) {
                                promises.push(
                                    Promise.try(function () {
                                        return fun.call(internalApi, params);
                                    })
                                    .then(function (data) {
                                        setContent('body', data);
                                    }));
                            });
                        }
                        if (hasHook('start')) {
                            getHook('start').forEach(function (fun) {
                                promises.push(Promise.try(function () {
                                    return fun.call(internalApi, params);
                                }));
                            });
                        }
                        return promises;
                    })
                    .each(function (item, index, value) {
                        // what to do? Check value for error and log it.
                    });
            });
        }

        function run(params) {
            return Promise.try(function () {
                setState('params', params);
                return fetchData(params)
                    .catch(function (err) {
                        setError({
                            type: 'FetchError',
                            reason: 'Unknown',
                            message: 'Error encountered fetching data',
                            description: renderDataAccessError(err),
                            data: err
                        });
                    });
            });
        }

        function stop() {
            return Promise.try(function () {
                listeners.forEach(function (listener) {
                    if (listener) {
                        runtime.drop(listener);
                    }
                });
                if (hasHook('stop')) {
                    var promises = getHook('stop').map(function (fun) {
                        return Promise.try(function () {
                            fun.call(internalApi);
                        });
                    });
                    return Promise.all(promises);
                }
            });
        }

        function detach() {
            return Promise.try(function () {
                if (mount) {
                    mount.removeChild(container);
                }
                container = null;
                mount = null;
                if (hasHook('detach')) {
                    var promises = getHook('detach').map(function (fun) {
                        return Promise.try(function () {
                            return fun.call(internalApi);
                        });
                    });
                    return Promise.all(promises)
                        .then(function () {
                            // detachDomEvents();
                            return null;
                        });
                }
            });
        }

        function destroy() {
            return Promise.try(function () {
                if (hasHook('destroy')) {
                    var promises = getHook('destroy').map(function (fun) {
                        return Promise.try(function () {
                            return fun.call(internalApi);
                        });
                    });
                    return Promise.all(promises);
                }
            });
        }

        return Object.freeze({
            // Widget Interface
            on: hook,
            // Lifecycle Interface
            init: init,
            attach: attach,
            start: start,
            run: run,
            stop: stop,
            detach: detach,
            destroy: destroy
        });
    }

    return Object.freeze({
        make: function (config) {
            return makeWidget(config);
        }
    });
});