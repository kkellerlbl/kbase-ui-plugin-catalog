define(['jquery', 'bluebird', 'kb_lib/html'], ($, Promise, html) => {
    'use strict';

    function createBSPanel($node, title) {
        var id = html.genId(),
            div = html.tag('div'),
            span = html.tag('span');
        $node.html(
            div({ class: 'panel panel-default ' }, [
                div({ class: 'panel-heading' }, [span({ class: 'panel-title' }, title)]),
                div({ class: 'panel-body' }, [div({ id: id })])
            ])
        );
        return $('#' + id);
    }

    class KBWidgetAdapter {
        constructor(param) {
            const {
                runtime,
                widget: { module, jquery_object, panel, title }
            } = param;
            if (!param.runtime) {
                throw {
                    type: 'ArgumentError',
                    reason: 'RuntimeMissing',
                    message: 'The runtime factory construction property is required but not provided'
                };
            }
            this.module = module;
            this.jqueryObjectName = jquery_object;
            this.wantPanel = panel ? true : false;
            this.title = title;
            this.runtime = runtime;

            this.mount = null;
            this.container = null;
            this.$container = null;
        }

        init() {
            return new Promise((resolve, reject) => {
                require([this.module], () => {
                    // these are jquery widgets, so they are just added to the
                    // jquery namespace.
                    // TODO: throw error if not found...

                    resolve();
                }, (err) => {
                    reject(err);
                });
            });
        }

        attach(node) {
            return new Promise((resolve, reject) => {
                this.mount = node;
                this.container = document.createElement('div');
                this.mount.appendChild(this.container);

                if (this.wantPanel) {
                    this.$container = createBSPanel($(this.container), this.title);
                } else {
                    this.$container = $(this.container);
                }

                if (this.$container[this.jqueryObjectName] === undefined) {
                    reject('Sorry, cannot find jquery widget ' + this.jqueryObjectName);
                } else {
                    resolve();
                }
            });
        }

        start(params) {
            return new Promise((resolve) => {
                // The config is supplied by the caller, but we add
                // standard properties here.
                /* TODO: be more generic */
                // But then again, a widget constructed on this model does
                // not need a connector!
                // not the best .. perhaps merge the params into the config
                // better yet, rewrite the widgets in the new model...
                var widgetConfig = Object.assign({}, params, {
                    // Why this?
                    wsNameOrId: params.workspaceId,
                    objNameOrId: params.objectId,
                    // commonly used, but really should remove this.
                    /* TODO: remove default params like this */
                    ws_url: this.runtime.config('services.workspace.url'),
                    token: this.runtime.service('session').getAuthToken(),
                    runtime: this.runtime
                });
                this.$container[this.jqueryObjectName](widgetConfig);
                resolve();
            });
        }

        run() {
            return Promise.resolve();
        }

        stop() {
            return Promise.resolve();
        }

        detach() {
            return Promise.resolve();
        }

        destroy() {
            return Promise.resolve();
        }
    }

    return KBWidgetAdapter;
});
