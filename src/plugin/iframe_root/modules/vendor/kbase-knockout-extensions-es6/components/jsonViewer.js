define([
    'knockout',
    'numeral',
    'kb_lib/html',
    '../registry',
    '../lib/generators',

    'css!./jsonViewer.css'
], function (
    ko,
    numeral,
    html,
    reg,
    gen
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        span = t('span');

    function niceNumber(key, num) {
        if (Number.isInteger(num)) {
            if (!/_id$/.exec(key)) {
                return numeral(num).format('0,0');
            } else {
                return num;
            }
        } else {
            return num;
        }
    }

    function makeBrowsable(key, obj, forceOpen) {
        switch (typeof obj) {
        case 'string':
            return {
                type: typeof obj,
                key: key,
                value: obj,
                display: String(obj)
            };
        case 'number':
            return {
                type: typeof obj,
                key: key,
                value: niceNumber(key, obj),
                display: String(obj)
            };
        case 'boolean':
            return {
                type: typeof obj,
                key: key,
                value: obj,
                display: String(obj)
            };
        case 'object':
            if (obj === null) {
                return {
                    type: 'null',
                    key: key,
                    value: obj,
                    display: 'null'
                };
            } else if (obj instanceof Array) {
                return {
                    type: 'array',
                    key: key,
                    show: ko.observable(forceOpen || false),
                    value: obj.map(function (element) {
                        // return makeBrowsable(element);
                        return element;
                    })
                };
            } else {
                return {
                    type: 'object',
                    show: ko.observable(forceOpen || false),
                    key: key,
                    value: Object.keys(obj).map(function (key) {
                        return {
                            key: key,
                            value: obj[key]
                        };
                    }).sort(function (a, b) {
                        if (a.key < b.key) {
                            return -1;
                        } else if (a.key > b.key) {
                            return 1;
                        }
                        return 0;
                    })
                };
            }
        default:
            return {
                type: 'unknown',
                key: key,
                value: 'type not handled: ' + (typeof obj),
                display: 'type not handled: ' + (typeof obj)
            };
        }
    }

    class ViewModel {
        constructor(params) {
            this.value = params.value;
            this.browsable = makeBrowsable(params.key, this.value, params.open);
            this.open = params.open;
            this.key = params.key;
            this.level = params.level || 0;
        }

    }

    function buildIcon(name) {
        return span({
            class: 'fa fa-' + name,
            style: {
                fontSize: '80%'
            }
        });
    }

    function buildObject() {
        return div({
        }, [
            gen.if('value.length === 0',
                div({
                    style: {
                        color: 'gray'
                    }
                }, [
                    span({
                        class: 'mini-spacer'
                    }),
                    span({
                        dataBind: {
                            text: 'key'
                        }
                    }),
                    ': (empty)'
                ]),
                [
                    div([
                        span({
                            dataBind: {
                                click: 'function (data) {show(!show());}',
                                style: {
                                    color: 'show() ? "red" : "green"'
                                }
                            },
                            class: 'mini-button'
                        }, [
                            span({
                                dataBind: {
                                    ifnot: 'show'
                                }
                            }, buildIcon('plus')),
                            span({
                                dataBind: {
                                    if: 'show'
                                }
                            }, buildIcon('minus'))
                        ]),
                        ' ',
                        span({
                            dataBind: {
                                text: 'key'
                            }
                        }),
                        ':'
                    ]),
                    gen.if('show',
                        div({
                            dataBind: {
                                foreach: 'value'
                            }
                        }, [
                            div({
                                dataBind: {
                                    component: {
                                        name: '"generic/json-viewer"',
                                        params: {
                                            key: 'key',
                                            value: 'value',
                                            level: '$component.level + 1'
                                        }
                                    }
                                }
                            })
                        ]))
                ])
        ]);
    }

    function buildArray() {
        return div({}, [
            gen.if('value.length === 0',
                span({
                    style: {
                        color: 'gray'
                    }
                }, [
                    span({
                        class: 'mini-spacer'
                    }),
                    span({
                        dataBind: {
                            text: 'key'
                        }
                    }),
                    ': (empty)'
                ]),
                [
                    div([
                        div({
                            dataBind: {
                                click: 'function (data) {show(!show());}',
                                style: {
                                    color: 'show() ? "red" : "green"'
                                }
                            },
                            class: 'mini-button'
                        }, [
                            span({
                                dataBind: {
                                    ifnot: 'show'
                                }
                            }, buildIcon('plus')),
                            span({
                                dataBind: {
                                    if: 'show'
                                }
                            }, buildIcon('minus'))
                        ]),
                        span({
                            dataBind: {
                                text: 'key'
                            }
                        }),
                        ':'
                    ]),
                    gen.if('show',
                        div({
                            dataBind: {
                                foreach: 'value'
                            }
                        }, [
                            div({
                                dataBind: {
                                    component: {
                                        name: '"generic/json-viewer"',
                                        params: {
                                            key: '"[" + $index() + "]"',
                                            value: '$data',
                                            level: '$component.level + 1'
                                        }
                                    }
                                }
                            })
                        ]))
                ])
        ]);
    }

    function buildString() {
        return div([
            span({
                class: 'mini-spacer'
            }),
            span({
                dataBind: {
                    text: 'key'
                }
            }),
            ': ',
            span({
                dataBind: {
                    text: 'value'
                },
                style: {
                    fontWeight: 'bold',
                    color: 'green'
                }
            })
        ]);
    }

    function buildNumber() {
        return div([
            span({
                class: 'mini-spacer'
            }),
            span({
                dataBind: {
                    text: 'key'
                }
            }),
            ': ',
            span({
                dataBind: {
                    text: 'String(value)'
                },
                style: {
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    color: 'blue'
                }
            })
        ]);
    }

    function buildBoolean() {
        return div([
            span({
                class: 'mini-spacer'
            }),
            span({
                dataBind: {
                    text: 'key'
                }
            }),
            ': ',
            span({
                dataBind: {
                    text: 'value ? "true" : "false"'
                },
                style: {
                    fontWeight: 'bold',
                    color: 'orange'
                }
            })
        ]);
    }

    function buildNull() {
        return div([
            span({
                class: 'mini-spacer'
            }),
            span({
                dataBind: {
                    text: 'key'
                }
            }),
            ': ',
            span({
                dataBind: {
                    text: 'display'
                },
                style: {
                    fontWeight: 'bold',
                    color: 'gray'
                }
            })
        ]);
    }

    function buildUnknown() {
        return  div([
            span({
                class: 'mini-spacer'
            }),
            span({
                dataBind: {
                    text: 'key'
                }
            }),
            ': ',
            span({
                dataBind: {
                    text: 'value'
                },
                style: {
                    fontWeight: 'bold',
                    color: 'red'
                }
            })
        ]);
    }

    function template() {
        return div({
            dataBind: {
                style: {
                    'margin-left': 'String(level * 5) + "px"'
                },
                with: 'browsable'
            }
        }, gen.switch('type', [
            ['"object"', buildObject()],
            ['"array"', buildArray()],
            ['"string"', buildString()],
            ['"number"', buildNumber()],
            ['"boolean"', buildBoolean()],
            ['"null"', buildNull()],
            ['"unknown"', buildUnknown()]
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
