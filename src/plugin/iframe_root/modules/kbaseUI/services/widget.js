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
        // pluginHandler(widgetsConfig, pluginConfig) {
        //     return Promise.try(() => {
        //         widgetsConfig.forEach((widgetDef) => {
        //             // If source modules are not specified, we are using module
        //             // paths. A full path will start with "plugins/" and a relative
        //             // path won't. Prefix a relative path with the plugin's module path.
        //             if (!pluginConfig.usingSourceModules) {
        //                 if (!widgetDef.module.match(/^plugins\//)) {
        //                     widgetDef.module = [pluginConfig.moduleRoot, widgetDef.module].join('/');
        //                 }
        //             }
        //             this.widgetManager.addWidget(widgetDef);
        //         });
        //     });
        // }
        getWidget() {
            return proxyMethod(this.widgetManager, 'getWidget', arguments);
        }
        makeWidget() {
            return proxyMethod(this.widgetManager, 'makeWidget', arguments);
        }
    }
    return WidgetService;
});
