
define([
    'jquery',
    'underscore',
    'bluebird',
    'kb_common/html'
], function (
    $,
    _,
    Promise,
    html
) {
    'use strict';

    function createBSPanel($node, title) {
        var id = html.genId(),
            div = html.tag('div'),
            span = html.tag('span');
        $node.html(div({ class: 'panel panel-default ' }, [
            div({ class: 'panel-heading' }, [
                span({ class: 'panel-title' }, title)
            ]),
            div({ class: 'panel-body' }, [
                div({ id: id })
            ])
        ]));
        return $('#' + id);
    }

    class KBWidgetAdapter {
        constructor(config) {
            this.runtime = config.runtime;
            this.module = config.widget.module;
            this.jqueryObjectName = config.widget.jquery_object || config.widget.jqueryObject;
            this.wantPanel = config.widget.panel;
            this.title = config.widget.title;

            this.hostNode = null;
            this.container = null;
            this.$container = null;
        }

        init() {
            return new Promise((resolve, reject) => {
                require([this.module], () => {
                    if (typeof $.fn[this.jqueryObjectName] === 'undefined') {
                        reject('Sorry, cannot find jquery widget ' + this.jqueryObjectName);
                    }
                    resolve();
                }, (err) => {
                    reject(err);
                });
            });
        }

        attach(node) {
            return Promise.try(() => {
                this.hostNode = node;
                this.container = this.hostNode.appendChild(document.createElement('div'));

                if (this.wantPanel) {
                    this.$container = createBSPanel($(this.container), this.title);
                } else {
                    this.$container = $(this.container);
                }
            });
        }

        start(params) {
            return Promise.try(() => {
                // The config is supplied by the caller, but we add
                // standard properties here.
                /* TODO: be more generic */
                // But then again, a widget constructed on this model does
                // not need a connector!
                // not the best .. perhaps merge the params into the config
                // better yet, rewrite the widgets in the new model...
                var widgetConfig = _.extendOwn({}, params, {
                    // Really, all of this business should be removed, and is
                    // very specific to certain types of data vis widgets.
                    wsNameOrId: params.workspaceId,
                    objNameOrId: params.objectId,
                    // commonly used, but really should remove this.
                    /* TODO: remove default params like this */
                    // ws_url: this.runtime.config('services.workspace.url'),
                    // token: this.runtime.service('session').getAuthToken(),
                    runtime: this.runtime
                });
                this.$container[this.jqueryObjectName](widgetConfig);
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

    return {KBWidgetAdapter};
});