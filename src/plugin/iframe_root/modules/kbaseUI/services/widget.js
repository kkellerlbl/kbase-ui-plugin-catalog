define(['../widget/manager'], function (WidgetManager) {
    'use strict';

    function proxyMethod(obj, method, args) {
        if (!obj[method]) {
            throw {
                name: 'UndefinedMethod',
                message: 'The requested method "' + method + '" does not exist on this object',
                suggestion: 'This is a developer problem, not your fault'
            };
        }
        return obj[method].apply(obj, args);
    }

    class WidgetService {
        constructor({ runtime }) {
            // the config has two properties:
            // config - from the service config
            // params - runtime params required for integration with ui runtime

            if (!runtime) {
                throw new Error('WidgetService start requires a runtime object; provide as "runtime"');
            }
            this.runtime = runtime;

            this.widgetManager = new WidgetManager({
                baseWidgetConfig: {
                    runtime
                }
            });
        }
        start() {
            return true;
        }
        stop() {
            return true;
        }
        getWidget() {
            return proxyMethod(this.widgetManager, 'getWidget', arguments);
        }
        makeWidget() {
            return proxyMethod(this.widgetManager, 'makeWidget', arguments);
        }
    }
    return WidgetService;
});
