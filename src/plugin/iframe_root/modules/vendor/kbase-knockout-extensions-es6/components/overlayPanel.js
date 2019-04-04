/*
overlayPanel
A generic full-height translucent panel which overlays the entire page to about 75% of the width.
It is a container component, and expects to be passed a component to render and a viewmodel
to pass along.
it offers a close function for the sub-component to use, in addition to invoking close
from a built-in close button (?)
*/
define([
    'knockout',
    'kb_lib/html',
    '../registry',
    '../lib/generators',
    '../lib/viewModelBase'
], function (
    ko,
    html,
    reg,
    gen,
    ViewModelBase
) {
    'use strict';

    const t = html.tag,
        span = t('span'),
        div = t('div');

    class ViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            this.showPanel = ko.observable();

            this.openMessage = null;

            this.component = params.component;

            this.panelStyle = ko.pureComputed(() => {
                if (this.showPanel() === undefined) {
                    // the initial state;
                    return;
                }
                if (this.showPanel()) {
                    return styles.classes.panelin;
                } else {
                    return styles.classes.panelout;
                }
            });

            this.typeBackgroundColor = ko.pureComputed(() => {
                if (!params.component()) {
                    return;
                }
                switch (params.component().type) {
                case 'error':
                    return 'rgba(145, 91, 91, 0.8)';
                case 'info':
                default:
                    return 'rgba(64, 89, 140, 0.8)';
                }
            });

            this.embeddedComponentName = ko.observable();
            this.embeddedParams = ko.observable();
            this.embeddedViewModel = ko.observable({});

            this.subscribe(this.component, (newValue) => {
                if (newValue) {
                    // this.bus.send('open', newValue);
                    this.openComponent(newValue);
                } else {
                    if (this.showPanel()) {
                        this.closeComponent();
                        // this.bus.send('close');
                    }
                }
            });

            document.body.addEventListener('keyup', (ev) => {
                if (ev.key === 'Escape') {
                    // this.bus.send('close');
                    this.closeComponent();
                }
            });

            this.on('close', (message) => {
                this.closeComponent(message);
            });
        }

        openComponent(message) {
            if (this.showPanel()) {
                this.closeComponent({open: message});
                return;
            }

            this.showPanel(true);
            this.embeddedComponentName(message.name);

            this.embeddedParams('{' + Object.keys(message.params || {}).map((key) => {
                return key + ':' + message.params[key];
            }).join(', ') + '}');

            this.embeddedParams.link = 'link';

            const newVm = Object.keys(message.viewModel).reduce((accum, key) => {
                accum[key] = message.viewModel[key];
                return accum;
            }, {});
            newVm.onClose = () => {
                this.closeComponent();
            };
            // links the sub-component bus to the overlay panel's bus.
            newVm.link = this.bus;
            this.embeddedViewModel(newVm);
        }

        closeComponent(message) {
            if (message && message.open) {
                this.openMessage = message.open;
                this.showPanel(false);
            } else {
                this.showPanel(false);
            }
        }

        clearComponent() {
            this.component(null);
            this.embeddedComponentName(null);
        }

        doClose() {
            this.closeComponent();
            // this.bus.send('close');
        }

        onPanelAnimationEnd(data, ev) {
            if (ev.target.classList.contains(styles.classes.panelout)) {
                // HACK ALERT: since we are using knockout event listener, set
                // persistently on the node, we don't have any context for this
                // animation end ... so if this was a close with open, the
                // open message will have been set ...
                if (this.openMessage) {
                    this.openComponent(this.openMessage);
                    this.openMessage = null;
                } else {
                    this.clearComponent();
                }
            }
        }
    }

    const styles = html.makeStyles({
        classes: {
            container: {
                css: {
                    position: 'absolute',
                    top: '0',
                    left: '-100%',
                    bottom: '0',
                    right: '0',
                    width: '100%',
                    zIndex: '3',
                    backgroundColor: 'rgba(0,0,0,0.6)'
                }
            },
            panel: {
                css: {
                    position: 'absolute',
                    top: '0',
                    left: '12.5%',
                    bottom: '0',
                    width: '75%',
                    zIndex: '3'
                }
            },
            panelBody: {
                css: {
                    position: 'absolute',
                    top: '30px',
                    left: '0',
                    bottom: '30px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }
            },
            panelButton: {
                css: {
                    position: 'absolute',
                    top: '38px',
                    right: '8px',
                    color: 'rgba(150,150,150,1)',
                    cursor: 'pointer',
                    zIndex: '4'
                },
                pseudo: {
                    hover: {
                        color: 'rgba(75,75,75,1)'
                    },
                    active: {
                        color: 'rgba(0,0,0,1)'
                    }
                }
            },
            panelin: {
                css: {
                    animationDuration: '0.3s',
                    animationName: 'fadein',
                    animationIterationCount: '1',
                    animationDirection: 'normal',
                    opacity: '1',
                    left: '0'
                }
            },
            panelout: {
                css: {
                    animationDuration: '0.3s',
                    animationName: 'fadeout',
                    animationIterationCount: '1',
                    animationDirection: 'normal',
                    opacity: '0',
                    left: '-100%'
                }
            },
            miniButton: {
                css: {
                    padding: '2px',
                    border: '2px transparent solid',
                    cursor: 'pointer'
                },
                pseudo: {
                    hover: {
                        border: '2px white solid'
                    },
                    active: {
                        border: '2px white solid',
                        backgroundColor: '#555',
                        color: '#FFF'
                    }
                }
            }
        },
        rules: {
            keyframes: {
                slidein: {
                    from: {
                        left: '-100%'
                    },
                    to: {
                        left: '0'
                    }
                },
                slideout: {
                    from: {
                        left: '0'
                    },
                    to: {
                        left: '-100%'
                    }
                },
                fadein: {
                    from: {
                        opacity: '0'
                    },
                    to: {
                        opacity: '1'
                    }
                },
                fadeout: {
                    from: {
                        opacity: '1',
                        left:'0'
                    },
                    to: {
                        opacity: '0',
                        left:'0'
                    }
                }
            }
        }
    });

    function template() {
        return div({
            dataBind: {
                css: 'panelStyle',
                event: {
                    animationend: 'onPanelAnimationEnd'
                }
            },
            class: styles.classes.container
        }, div({
            class: styles.classes.panel
        }, [
            styles.sheet,
            div({
                dataBind: {
                    click: 'doClose'
                },
                class: styles.classes.panelButton
            }, span({class: 'fa fa-times'})),
            div({
                class: styles.classes.panelBody
            }, [
                gen.if('embeddedComponentName()',
                    gen.with('embeddedViewModel()',
                        div({
                            dataBind: {
                                component: {
                                    name: '$component.embeddedComponentName',
                                    params: '$data',
                                }
                            },
                            style: {
                                flex: '1 1 0px',
                                display: 'flex',
                                flexDirection: 'column'
                            }
                        })))
            ])
        ]));
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
