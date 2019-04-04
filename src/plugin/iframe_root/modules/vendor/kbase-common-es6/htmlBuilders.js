define([
    './html'
], function (
    html
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        span = t('span'),
        table = t('table'),
        thead = t('thead'),
        tbody = t('tbody'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        ul = t('ul'),
        li = t('li'),
        a = t('a');

    function makeTable(arg) {
        let id;
        arg = arg || {};
        if (arg.id) {
            id = arg.id;
        } else {
            id = html.genId();
            arg.generated = { id: id };
        }
        const attribs = { id: id };
        if (arg.class) {
            attribs.class = arg.class;
        } else if (arg.classes) {
            attribs.class = arg.classes.join(' ');
        }
        return table(attribs, [
            thead(tr(arg.columns.map((x) => {
                return th(x);
            }))),
            tbody(arg.rows.map(function (row) {
                return tr(row.map(function (x) {
                    return td(x);
                }));
            }))
        ]);
    }

    function bsPanel(title, content) {
        return div({
            class: 'panel panel-default'
        }, [
            div({
                class: 'panel-heading'
            }, [
                span({
                    class: 'panel-title'
                }, title)
            ]),
            div({
                class: 'panel-body'
            }, [
                content
            ])
        ]);
    }

    function makePanel(arg) {
        const klass = arg.class || 'default';

        return div({
            class: 'panel panel-' + klass
        }, [
            div({
                class: 'panel-heading'
            }, [
                span({
                    class: 'panel-title'
                }, arg.title)
            ]),
            div({
                class: 'panel-body'
            }, [
                arg.content
            ])
        ]);
    }

    function loading(msg, size) {
        let prompt;
        if (msg) {
            prompt = msg + '... &nbsp &nbsp';
        }
        var iconSize = 'fa-2x';
        if (size) {
            switch (size) {
            case 'normal':
                iconSize = null;
                break;
            case 'large':
                iconSize = 'fa-2x';
                break;
            case 'extra-large':
                iconSize = 'fa-3x';
                break;
            }
        }
        return span([
            prompt,
            span({
                class: 'fa fa-spinner fa-pulse fa-fw margin-bottom' + (iconSize ? ' ' + iconSize : '')
            })
        ]);
    }

    function makeTableRotated(arg) {
        function columnLabel(column) {
            let key;
            if (typeof column === 'string') {
                key = column;
            } else {
                if (column.label) {
                    return column.label;
                }
                key = column.key;
            }
            return key
                .replace(/(id|Id)/g, 'ID')
                .split(/_/g).map((word) => {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        }

        function formatValue(rawValue, column) {
            if (typeof column === 'string') {
                return rawValue;
            }
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                case 'bool':
                    // yuck, use truthiness
                    if (rawValue) {
                        return 'True';
                    }
                    return 'False';
                default:
                    return rawValue;
                }
            }
            return rawValue;
        }

        const id = html.genId();
        const attribs = { id: id };
        if (arg.class) {
            attribs.class = arg.class;
        } else if (arg.classes) {
            attribs.class = arg.classes.join(' ');
        }

        return table(attribs,
            arg.columns.map((column, index) => {
                return tr([
                    th(columnLabel(column)),
                    arg.rows.map(function (row) {
                        return td(formatValue(row[index], column));
                    })
                ]);
            }));
    }

    function makeRotatedTable(data, columns) {
        function columnLabel(column) {
            let key;
            if (column.label) {
                return column.label;
            }
            if (typeof column === 'string') {
                key = column;
            } else {
                key = column.key;
            }
            return key
                .replace(/(id|Id)/g, 'ID')
                .split(/_/g).map((word) => {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        }

        function columnValue(row, column) {
            const rawValue = row[column.key];
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                case 'bool':
                    // yuck, use truthiness
                    if (rawValue) {
                        return 'True';
                    }
                    return 'False';
                default:
                    return rawValue;
                }
            }
            return rawValue;
        }

        return table({
            class: 'table table-stiped table-bordered'
        }, columns.map((column) => {
            return tr([
                th(columnLabel(column)), data.map((row) => {
                    return td(columnValue(row, column));
                })
            ]);
        }));
    }

    function properCase(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function makeObjTable(data, options) {
        const tableData = (data instanceof Array && data) || [data],
            columns = (options && options.columns) || Object.keys(tableData[0]).map(function (key) {
                return {
                    key: key,
                    label: properCase(key)
                };
            });
        const classes = (options && options.classes) || ['table-striped', 'table-bordered'];

        function columnValue(row, column) {
            const rawValue = row[column.key];
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                case 'bool':
                    // yuck, use truthiness
                    if (rawValue) {
                        return 'True';
                    }
                    return 'False';
                default:
                    return rawValue;
                }
            }
            return rawValue;
        }
        if (options && options.rotated) {
            return table({
                class: 'table ' + classes.join(' ')
            }, columns.map(function (column) {
                return tr([
                    th(column.label),
                    tableData.map((row) => {
                        return td({
                            dataElement: column.key
                        }, columnValue(row, column));
                    })
                ]);
            }));
        }
        return table({
            class: 'table ' + classes.join(' ')
        }, [tr(columns.map((column) => {
            return th(column.label);
        }))].concat(tableData.map((row) => {
            return tr(columns.map((column) => {
                return td({
                    dataElement: column.key
                }, columnValue(row, column));
            }));
        })));
    }

    function makeObjectTable(data, options) {
        function columnLabel(column) {
            let key;
            if (column.label) {
                return column.label;
            }
            if (typeof column === 'string') {
                key = column;
            } else {
                key = column.key;
            }
            return key
                .replace(/(id|Id)/g, 'ID')
                .split(/_/g).map((word) => {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        }

        function columnValue(row, column) {
            const rawValue = row[column.key];
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                case 'bool':
                    // yuck, use truthiness
                    if (rawValue) {
                        return 'True';
                    }
                    return 'False';
                default:
                    return rawValue;
                }
            }
            return rawValue;
        }
        var columns, classes;
        if (!options) {
            options = {};
        } else if (options.columns) {
            columns = options.columns;
        } else {
            columns = options;
            options = {};
        }
        if (!columns) {
            columns = Object.keys(data).map((columnName) => {
                return {
                    key: columnName
                };
            });
        } else {
            columns = columns.map((column) => {
                if (typeof column === 'string') {
                    return {
                        key: column
                    };
                }
                return column;
            });
        }
        if (options.classes) {
            classes = options.classes;
        } else {
            classes = ['table-striped', 'table-bordered'];
        }

        return table({ class: 'table ' + classes.join(' ') },
            columns.map((column) => {
                return tr([
                    th(columnLabel(column)),
                    td(columnValue(data, column))
                ]);
            }));
    }

    function makeList(arg) {
        if (arg.items instanceof Array) {
            return ul(arg.items.map(function (item) {
                return li(item);
            }));
        }
        return 'Sorry, cannot make a list from that';
    }

    /**
         * Make a bootsrap tabset:
         * arg.tabs.id
         * arg.tabs.label
         * arg.tabs.name
         * arg.tabs.content
         *
         * @param {type} arg
         * @returns {unresolved}
         */

    function makeTabs(arg) {
        const tabsId = arg.id;
        const tabsAttribs = {};
        const tabClasses = ['nav', 'nav-tabs'];
        const tabStyle = {};
        let tabs;
        let activeIndex;

        if (tabsId) {
            tabsAttribs.id = tabsId;
        }
        arg.tabs.forEach(function (tab) {
            tab.id =html. genId();
        });
        if (arg.alignRight) {
            tabs = arg.tags.reverse();
            tabStyle.float = 'right';
            activeIndex = tabs.length - 1;
        } else {
            tabs = arg.tabs;
            activeIndex = 0;
        }
        return div(tabsAttribs, [
            ul({
                class: tabClasses.join(' '),
                role: 'tablist'
            },
            tabs.map((tab, index) => {
                var attribs = {
                    role: 'presentation'
                };
                if (index === activeIndex) {
                    attribs.class = 'active';
                }
                attribs.style = tabStyle;
                return li(attribs, a({
                    href: '#' + tab.id,
                    ariaControls: 'home',
                    role: 'tab',
                    dataToggle: 'tab'
                }, tab.label));
            })),
            div({ class: 'tab-content' },
                arg.tabs.map((tab, index) => {
                    var attribs = {
                        role: 'tabpanel',
                        class: 'tab-pane',
                        id: tab.id
                    };
                    if (tab.name) {
                        attribs['data-name'] = tab.name;
                    }
                    if (index === 0) {
                        attribs.class += ' active';
                    }
                    return div(attribs, tab.content);
                })
            )
        ]);
    }

    function safeText(text) {
        const n = document.createElement('div');
        n.textContent = text;
        return n.innerHTML;
    }

    return Object.freeze({
        makeTable: makeTable,
        makeTableRotated: makeTableRotated,
        makeRotatedTable: makeRotatedTable,
        makeObjectTable: makeObjectTable,
        makeObjTable: makeObjTable,
        bsPanel: bsPanel,
        panel: bsPanel,
        makePanel: makePanel,
        loading: loading,
        makeList: makeList,
        makeTabs: makeTabs,
        safeText: safeText
    });
});
