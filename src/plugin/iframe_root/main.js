require.config({
    baseUrl: './modules',
    paths: {
        bluebird: 'vendor/bluebird/bluebird',
        bootstrap: 'vendor/bootstrap/bootstrap',
        bootstrap_css: 'vendor/bootstrap/css/bootstrap',
        css: 'vendor/require-css/css',
        d3: 'vendor/d3/d3',
        datatables: 'vendor/datatables/jquery.dataTables',
        datatables_css: 'vendor/datatables/jquery.dataTables',
        datatables_bootstrap_css: 'vendor/datatables-bootstrap3-plugin/datatables-bootstrap3',
        datatables_bootstrap: 'vendor/datatables-bootstrap3-plugin/datatables-bootstrap3',
        fileSaver: 'vendor/file-saver/FileSaver',
        font_awesome: 'vendor/font-awesome/css/font-awesome',
        highlight_css: 'vendor/highlightjs/default',
        highlight: 'vendor/highlightjs/highlight.pack',
        jquery: 'vendor/jquery/jquery',
        'jquery-ui': 'vendor/jquery-ui/jquery-ui',
        'js-yaml': 'vendor/js-yaml/js-yaml',
        handlebars: 'vendor/handlebars/handlebars',
        kb_common: 'vendor/kbase-common-js',
        kb_common_ts: 'vendor/kbase-common-ts',
        kb_lib: 'vendor/kbase-common-es6',
        kb_service: 'vendor/kbase-service-clients-js',
        kb_knockout: 'vendor/kbase-knockout-extensions-es6',
        kb_widget: 'vendor/kbase-ui-widget',
        'knockout-arraytransforms': 'vendor/knockout-arraytransforms/knockout-arraytransforms',
        'knockout-projections': 'vendor/knockout-projections/knockout-projections',
        'knockout-switch-case': 'vendor/knockout-switch-case/knockout-switch-case',
        'knockout-validation': 'vendor/knockout-validation/knockout.validation',
        'knockout-mapping': 'vendor/bower-knockout-mapping/knockout.mapping',
        'knockout-plus': 'lib/knockout-plus/knockout-plus',
        knockout: 'vendor/knockout/knockout',
        marked: 'vendor/marked/marked',
        moment: 'vendor/moment/moment',
        numeral: 'vendor/numeral/numeral',
        md5: 'vendor/spark-md5/spark-md5',
        text: 'vendor/requirejs-text/text',
        yaml: 'vendor/requirejs-yaml/yaml',
        uuid: 'vendor/pure-uuid/uuid'
    },
    shim: {
        bootstrap: {
            deps: ['jquery', 'css!bootstrap_css']
        },
        highlight: {
            deps: ['css!highlight_css']
        }
    }
});

require([
    'bluebird',
    // 'kbaseUI/runtime',
    // 'lib/auth2ClientRuntime',
    'kbaseUI/integration',
    'kbaseUI/dispatcher',
    'kb_knockout/load',
    'yaml!./config.yml',
    'bootstrap',
    'css!font_awesome'
], (Promise, Integration, Dispatcher, knockoutLoader, pluginConfig) => {
    'use strict';
    Promise.try(() => {
        const integration = new Integration({
            rootWindow: window
        });

        // Add custom event hooks into the integration.
        // integration.channel.on('run', (message) => {
        //     console.log('RUN', message);
        // });

        // try {
        //     integration.start();
        // } catch (ex) {
        //     console.error('Error starting main: ', ex.message);
        // }

        // const {
        //     params: { config, token, username, routeParams }
        // } = integration.getParamsFromIFrame();

        const rootNode = document.getElementById('root');

        // NOW -- we need to implement widget dispatch here
        // based on the navigation received from the parent context.
        let dispatcher = null;

        return knockoutLoader
            .load()
            .then((ko) => {
                // For more efficient ui updates.
                // This was introduced in more recent knockout releases,
                // and in the past introduced problems which were resolved
                // in knockout 3.5.0.
                ko.options.deferUpdates = true;
            })
            .then(() => {
                return integration.start();
            })
            .then(() => {
                // // This installs all widgets from the config file.
                const widgets = pluginConfig.install.widgets;
                widgets.forEach((widgetDef) => {
                    integration.runtime.service('widget').widgetManager.addWidget(widgetDef);
                });
            })
            .then(() => {
                // Add routes to panels here
                const panels = [
                    {
                        module: '../catalog_index',
                        view: 'catalogIndex',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_app_browser',
                        view: 'appsBrowser',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_app_viewer',
                        view: 'appView',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_module_browser',
                        view: 'moduleBrowser',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_module_viewer',
                        view: 'moduleView',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_service',
                        view: 'serviceCatalog',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_function_browser',
                        view: 'functionBrowser',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_function_viewer',
                        view: 'functionView',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_type_browser',
                        view: 'datatypeBrowser',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_registration',
                        view: 'catalogRegistration',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_stats',
                        view: 'catalogStats',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_status',
                        view: 'catalogStatus',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_admin',
                        view: 'catalogAdmin',
                        type: 'factory'
                    },
                    {
                        module: '../catalog_queue',
                        view: 'catalogQueue',
                        type: 'factory'
                    }
                ];
                dispatcher = new Dispatcher({ runtime: integration.runtime, node: rootNode, views: panels });
                return dispatcher.start();
            })
            .then((dispatcher) => {
                integration.onNavigate(({ path, params }) => {
                    // TODO: ever
                    let view;
                    if (params.view) {
                        view = params.view;
                    } else {
                        view = path[0];
                    }
                    dispatcher.dispatch({ view, path, params });
                });
                integration.started();
                // TODO: more channel listeners.
            });
    }).catch((err) => {
        console.error('ERROR', err);
    });
});
