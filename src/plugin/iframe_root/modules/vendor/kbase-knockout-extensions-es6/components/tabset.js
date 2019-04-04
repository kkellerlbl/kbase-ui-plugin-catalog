define([
    'knockout',
    '../registry',
    '../lib/viewModelBase',
    '../lib/generators',
    'kb_lib/html'
], function (
    ko,
    reg,
    ViewModelBase,
    gen,
    html
) {
    'use strict';

    class viewModel extends ViewModelBase  {
        constructor(params) {
            super(params);

            const {tabs, tabContext} = params;
            // console.log('tab context?', tabContext);
            this.tabContext = tabContext;
            this.tabsetId = html.genId();
            this.tabs = ko.observableArray();
            this.tabClasses = ko.observableArray(['nav', 'nav-tabs']);
            this.activeTab = ko.observable();

            // Bus -- ??!!
            // TODO: provide the bus on the top level of the params...
            this.parentBus.on('add-tab', (message) => {
                this.addTab(message.tab);
            });
            this.parentBus.on('select-tab', (message) => {
                if (typeof message === 'number') {
                    this.doSelectTab(this.tabs()[message]);
                }
            });

            // Initialize Tabs

            if (tabs) {
                tabs.forEach((tab) => {
                    this.tabs.push(this.makeTab(tab));
                });
            }

            if (!('active' in params)) {
                if (this.tabs().length > 0) {
                    this.tabs()[0].active(true);
                    this.activeTab(this.tabs()[0]);
                }
            }

            this.parentBus.send('ready');
        }

        doCloseTab(tab) {
            const index = this.tabs.indexOf(tab);
            this.tabs.remove(tab);
            if (index === 0) {
                return;
            }
            // if not the selected tab, nothing else to do.
            if (tab !== this.activeTab()) {
                return;
            }

            // If no closable tabs, we go back to the first tab.
            let currentTab;
            const totalTabs = this.tabs().length;
            const closableTabs = this.tabs().reduce((closableCount, tab) => {
                return closableCount + (tab.closable() ? 1 : 0);
            }, 0);
            const nonclosableTabs = totalTabs - closableTabs;
            if (closableTabs > 0) {
                // avoid opening up the last unclosable tab if there are closables left.
                if (index === nonclosableTabs) {
                    currentTab = this.tabs()[index + 1];
                } else {
                    currentTab = this.tabs()[index - 1];
                }
            } else {
                currentTab = this.tabs()[0];
            }

            this.activateTab(currentTab);
            currentTab.active(true);
        }

        // bootstrap tabs implemeneted in knockout. tricky...
        makeTab(params) {
            // if (!params.panel.component.params) {
            //     params.panel.component.params = {};
            // }
            // params.component.params = params;
            let tabComponent;
            if (params.tab.component) {
                tabComponent = {
                    name: params.tab.component.name,
                    params: params.tab.component.params,
                    stringifiedParams: this.paramsToString(params.tab.component.params)
                };
            }
            let panelComponent;
            if (params.panel.component) {
                panelComponent = {
                    name: params.panel.component.name,
                    params: params.panel.component.params,
                    stringifiedParams: this.paramsToString(params.panel.component.params)
                };
            }
            return {
                id: params.id,
                tab: {
                    label: params.tab.label,
                    component: tabComponent
                },
                // label: params.tab.label,
                panel: {
                    component: panelComponent,
                    content: params.panel.content
                },
                // component: params.component,
                // content: params.content,
                active: ko.observable(params.active || false),
                closable: ko.observable(params.closable || false)
            };
        }

        paramsToString(params) {
            // return params;
            return '{' + Object.keys(params).map((key) => {
                return key + ':' + params[key];
            }) + '}';
        }

        addTab(tab, activate) {
            const newTab = this.makeTab(tab);
            this.tabs.push(newTab);
            if (activate) {
                this.deactivateCurrentTab();
                this.activateTab(newTab);
            }
        }

        activateTab(tab) {
            tab.active(true);
            this.activeTab(tab);
        }

        deactivateCurrentTab() {
            if (this.activeTab()) {
                this.activeTab().active(false);
            }
        }

        doSelectTab(tab) {
            this.deactivateCurrentTab();
            // console.log('selected tab?', tab);
            this.activateTab(tab);
        }
    }

    const t = html.tag,
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        span = t('span'),
        div = t('div');

    function buildTab() {
        return li({
            role: 'presentation',
            class: styles.classes.tab,
            dataBind: {
                css: {
                    active: 'active'
                }
            }
        }, [
            a({
                dataBind: {
                    click: 'function (d, e) {$component.doSelectTab.call($component, d);}',
                    attr: {
                        'data-k-b-testhook-tab': 'tab.id'
                    },
                    class: 'active() ? "' + styles.classes.tabLinkActive + '": ""'

                },
                role: 'tab',
                class: styles.classes.tabLink
            }, [
                span({
                    dataBind: {
                        text: 'tab.label'
                    }
                }),
                gen.if('tab.component',
                    // use 'let' here because otherwise the 'with' sets the context completely to
                    // the tabContext (which we want for the tab component), but we need the
                    // tab still to be available (and a let is guaranteed to be propagated to
                    // inner contexts.)
                    // TODO: since 'tab' may interfere with a 'tab' property of the tabContext,
                    // we should really generate a unique identifier. Still __ should protect us.
                    gen.let({
                        __tab: 'tab'
                    }, gen.with('$component.tabContext',
                        span({
                            dataBind: {
                                component: {
                                    name: '__tab.component.name',
                                    params: 'function(){return eval("[" + __tab.component.stringifiedParams + "][0]");}()'
                                }
                            },
                            dataKBTesthookButton: 'tab'
                        })))),
                gen.if('closable',
                    span({
                        class: styles.classes.tabButton,
                        dataBind: {
                            click: '$component.doCloseTab'
                        }
                    }, span({
                        class: 'fa fa-times',
                    })))
            ]),
        ]);
    }

    function buildTabPanel() {
        return gen.if('active',
            div({
                dataBind: {
                    attr: {
                        active: 'active'
                    },
                    css: {
                        in: 'active',
                        active: 'active'
                    }
                },
                class: [styles.classes.tabPane, 'fade'],
                role: 'tabpanel'
            }, gen.if('panel.component',
                gen.let({
                    __panel: 'panel'
                }, gen.with('$component.tabContext',
                    div({
                        style: {
                            flex: '1 1 0px',
                            display: 'flex',
                            flexDirection: 'column'
                        },
                        dataBind: {
                            component: {
                                name: '__panel.component.name',
                                params: 'function(){return eval("[" + __panel.component.stringifiedParams + "][0]");}()'
                            }
                        }
                    }))),
                gen.if('panel.content',
                    div({
                        style: {
                            flex: '1 1 0px',
                            display: 'flex',
                            flexDirection: 'column'
                        },
                        dataBind: {
                            html: 'panel.content'
                        }
                    }),
                    div('** NO CONTENT **')))));
    }

    const styles = html.makeStyles({
        component: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        },
        tabSet: {
            css: {
                borderBottom: '1px solid #ddd',
                // flex: '0 0 50px',
                paddingLeft: '0',
                marginBottom: '0',
                listStyle: 'none'
            },
            pseudoClasses: {
                after: {
                    display: 'table',
                    content: ' ',
                    clear: 'both'
                }
            }
        },
        tab: {
            css: {
                float: 'left',
                marginBottom:' -1px',
                position: 'relative',
                display: 'block',
                userSelect: 'none',
                '-webkit-user-select': 'none',
                '-moz-user-select': 'none',
                '-ms-user-select': 'none',
            }
        },
        tabLink: {
            css: {
                display: 'inline-block',
                marginRight: '2px',
                lineHeight: '1.42857143',
                border: '1px solid transparent',
                borderRadius:' 4px 4px 0 0',
                position: 'relative',
                padding: '10px 15px',
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    borderColor: '#eee #eee #ddd',
                    textCecoration: 'none',
                    backgroundColor: '#eee',
                    outline: 0
                },
                active: {
                    textCecoration: 'none',
                    backgroundColor: '#eee',
                    outline: 0
                }
            }
        },
        tabLinkActive: {
            css: {
                color: '#555',
                cursor: 'default',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderBottomColor: 'transparent'
            },
            pseudo: {
                hover: {
                    textDecoration: 'none',
                    backgroundColor: '#fff',
                    borderColor: '#ddd #ddd #ddd',
                    borderBottomColor: 'transparent'
                }
            }
        },
        tabButton: {
            css: {
                padding: '0 4px',
                marginLeft: '8px',
                color: '#000',
                cursor: 'pointer',
                textDecoration: 'none'
            },
            pseudoElement: {
                before: {
                    color: '#888'
                }
            }
        },
        tabContent: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
            }
        },
        tabPane: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        }
    });

    function template() {
        return div({
            class: styles.classes.component,
            dataKBTesthookComponent: 'tabset'
        }, [
            ul({
                class: styles.classes.tabSet,
                dataBind: {
                    attr: {
                        id: 'tabsetId'
                    },
                    foreach: {
                        data: 'tabs'
                    }
                },
                role: 'tablist'
            }, buildTab()),
            div({
                class: styles.classes.tabContent,
                style: {
                    position: 'relative'
                },
                dataBind: {
                    foreach: {
                        data: 'tabs'
                    }
                }
            },  buildTabPanel())
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }
    return reg.registerComponent(component);
});
