define([
    'knockout',
    '../../registry',
    '../../lib/generators',
    '../../lib/viewModelBase',
    'kb_lib/html'
], function (
    ko,
    reg,
    gen,
    ViewModelBase,
    html
) {
    'use strict';

    const t = html.tag,
        div = t('div');

    class ViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            const {type = 'default', message} = params;

            this.alertClass = 'alert-' + type;

            this.message = message;
        }
    }

    function template() {
        return div({
            class: 'alert',
            style: {
                margin: '40px auto 0 auto',
                maxWidth: '40em',
                padding: '20px'
            },
            dataBind: {
                class: 'alertClass'
            }
        }, div({
            dataBind: {
                html: 'message'
            }
        }));
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});