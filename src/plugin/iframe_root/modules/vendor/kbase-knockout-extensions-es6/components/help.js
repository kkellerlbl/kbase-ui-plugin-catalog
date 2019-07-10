define([
    'knockout',
    '../registry',
    '../lib/generators',
    '../lib/viewModelBase',
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
        div = t('div'),
        a = t('a'),
        ul = t('ul'),
        li = t('li');

    class ViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            this.helpDb = params.helpDb;
            this.topics = this.helpDb.topics;
            this.references = params.helpDb.references;

            this.topicsIndex = {};
            this.helpDb.topics.forEach((topic) => {
                this.topicsIndex[topic.id] = topic;
            });

            this.currentTopicId = ko.observable();

            this.currentTopic = ko.observable();

            this.subscribe(this.currentTopicId, (newValue) => {
                this.currentTopic(this.topicsIndex[newValue]);
            });

            this.currentTopicId(params.topic || 'overview');
        }

        // ACTIONS
        doSelectTopic(topic) {
            this.currentTopicId(topic.id);
        }
    }

    const styles = html.makeStyles({
        classes: {
            component: {
                css: {
                    paddingTop: '12px'
                }
            },
            index: {
                css: {
                    display: 'inline-block',
                    width: '30%',
                    border: '1px rgb(221,221,221) solid',
                    padding: '6px',
                    verticalAlign: 'top'
                }
            },
            indexList: {
                css: {
                    listStyle: 'none',
                    padding: '0'
                }
            },
            indexListItem: {
                css: {
                    display: 'block',
                    padding: '4px'
                }
            },
            indexListItemLink: {
                css: {
                    padding: '4px',
                    display: 'block'
                },
                pseudo: {
                    hover: {
                        backgroundColor: '#DDD'
                    }
                }
            },
            active: {
                css: {
                    backgroundColor: '#DDD'
                }
            },
            body: {
                css: {
                    display: 'inline-block',
                    width: '70%',
                    padding: '6px 6px 6px 12px',
                    verticalAlign: 'top'
                }
            },
            title: {
                css: {
                    fontWeight: 'bold'
                }
            },
            references: {
                css: {
                    marginTop: '12px'
                }
            },
            markdown: {
                css: {

                },
                inner: {
                    blockquote: {
                        fontSize: 'inherit',
                        marginLeft: '1em',
                        paddingLeft: '1em',
                        borderLeft: '3px silver solid'
                    },
                    p: {
                        maxWidth: '50em'
                    },
                    h1: {
                        marginTop: '0',
                        marginBottom: '0',
                        fontWeight: 'bold',
                        fontSize: '150%'
                    },
                    h2: {
                        marginTop: '1em',
                        marginBottom: '0',
                        fontWeight: 'bold',
                        fontSize: '133%'
                    },
                    h3: {
                        marginTop: '1em',
                        marginBottom: '0',
                        fontWeight: 'bold',
                        fontSize: '120%'
                    },
                    h4: {
                        marginTop: '1em',
                        marginBottom: '0',
                        fontWeight: 'bold',
                        textDecoration: 'underline',
                        fontSize: '100%'
                    },
                    h5: {
                        marginTop: '1em',
                        marginBottom: '0',
                        fontWeight: 'bold',
                        fontSize: '100%'
                    }
                }
            }
        }
    });

    function template() {
        return div({
            class: styles.classes.component
        }, [
            styles.sheet,
            div({
                class: styles.classes.index
            }, [
                div({
                    style: {
                        fontWeight: 'bold'
                    }
                }),
                ul({
                    dataBind: {
                        foreach: 'topics'
                    },
                    class: styles.classes.indexList
                }, [
                    gen.if('!$data.disabled',
                        li(a({
                            dataBind: {
                                text: 'title',
                                click: 'function(d,e){$component.doSelectTopic.call($component,d,e)}',
                                css: 'id === $component.currentTopicId() ? "' + styles.classes.active + '": ""'
                            },
                            class: styles.classes.indexListItem
                        })))
                ])
            ]),
            div({
                dataBind: {
                    with: 'currentTopic'
                },
                class: styles.classes.body
            }, [
                div({
                    dataBind: {
                        text: 'title'
                    },
                    class: styles.classes.title
                }),
                div({
                    dataBind: {
                        htmlMarkdown: 'content'
                    },
                    class: styles.classes.markdown
                })
            ]),
            gen.if('$data.references && references.length > 0',
                div({
                    class: styles.classes.references
                }, [
                    div({
                        class: styles.classes.title
                    }, 'References'),
                    ul({
                        dataBind: {
                            foreach: 'references'
                        }
                    }, li(a({
                        dataBind: {
                            attr: {
                                href: 'url',
                                target: 'external ? "_blank" : ""'
                            },
                            text: 'title || url'
                        }
                    })))
                ]))
        ]);
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }
    return reg.registerComponent(component);
});