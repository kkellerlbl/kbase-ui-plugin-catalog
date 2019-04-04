define([
    'kb_lib/html',
    '../registry',
    '../lib/viewModelBase'
], function (
    html,
    reg,
    ViewModelBase
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        button = t('button');

    class DialogViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            this.title = params.title;
            this.body = params.body;
            this.buttons = [
                {
                    title: 'Close',
                    action: this.doClose
                }
            ];
        }

        doClose() {
            this.params.onClose();
        }
    }

    function template() {
        return div({
            style: {
                // backgroundColor: 'white'
            }
        }, [
            // title
            div({
                dataBind: {
                    text: 'title'
                },
                style: {
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    fontSize: '150%',
                    padding: '8px',
                    borderBottom: '1px green solid'
                }
            }),
            // body
            div({
                dataBind: {
                    text: 'body'
                },
                style: {
                    padding: '8px',
                    minHeight: '10em',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                }
            }),
            // buttons
            div({
                dataBind: {
                    foreach: 'buttons'
                },
                style: {
                    padding: '8px',
                    textAlign: 'right',
                    backgroundColor: 'transparent'
                }
            }, button({
                type: 'button',
                class: 'btn btn-default',
                dataBind: {
                    text: 'title',
                    click: 'action'
                }
            })),

        ]);
    }

    function component() {
        return {
            viewModel: DialogViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});