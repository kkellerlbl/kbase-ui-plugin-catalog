define([
    'uuid'
], function (
    Uuid
) {
    'use strict';

    function jsonToHTML(node) {
        const nodeType = typeof node;
        let out;
        if (nodeType === 'string') {
            return node;
        }
        if (nodeType === 'boolean') {
            if (node) {
                return 'true';
            }
            return 'false';
        }
        if (nodeType === 'number') {
            return String(node);
        }
        if (nodeType === 'object' && node.push) {
            out = '';
            node.forEach((item) => {
                out += jsonToHTML(item);
            });
            return out;
        }
        if (nodeType === 'object') {
            out = '';
            out += '<' + nodeType.tag;
            if (node.attributes) {
                node.attributes.keys().forEach((key) => {
                    out += key + '="' + node.attributes[key] + '"';
                });
            }
            out += '>';
            if (node.children) {
                out += jsonToHTML(node.children);
            }
            out += '</' + node.tag + '>';
            return out;
        }
    }

    const tagsCache = {};
    /**
                                 * Given a simple object of keys and values, create a string which
                                 * encodes them into a form suitable for the value of a style attribute.
                                 * Style attribute values are themselves attributes, but due to the limitation
                                 * of html attributes, they are embedded in a string:
                                 * The format is
                                 * key: value;
                                 * Note that values are not quoted, and the separator between fields is
                                 * a semicolon
                                 * Note that we expect the value to be embedded withing an html attribute
                                 * which is quoted with double-qoutes; but we don't do any escaping here.
                                 * @param {type} attribs
                                 * @returns {String}
                                 */
    function camelToHyphen(s) {
        return s.replace(/[A-Z]/g, (m) => {
            return '-' + m.toLowerCase();
        });
    }

    function makeStyleAttribs(attribs) {
        if (attribs) {
            return Object.keys(attribs)
                .map((rawKey) => {
                    const value = attribs[rawKey];
                    const key = camelToHyphen(rawKey);

                    if (typeof value === 'string') {
                        return key + ': ' + value;
                    }
                    // just ignore invalid attributes for now
                    // TODO: what is the proper thing to do?
                    return '';
                })
                .filter((field) => {
                    return field ? true : false;
                })
                .join('; ');
        }
        return '';
    }

    /*
                                THe correct form is 'attrib-key'
                                Usage in the wild may be "attrib-key", which is converted to the above
                                Or just attrib-key, which is then wrapped in '
                                The hyphenation of attribKey will not work because knockout keys
                                may be legitimately camelCased.
                                */
    function fixKey(key) {
        if (key.match(/'.*'/)) {
            return key;
        }
        if (key.match(/".*"/)) {
            return key.replace(/"/g, '\'');
        }
        if (key.match(/-/)) {
            return '\'' + key + '\'';
        }
        return key;
    }
    /**
                                 * The attributes for knockout's data-bind is slightly different than
                                 * for style. The syntax is that of a simple javascript object.
                                 * property: value, property: "value", property: 123
                                 * So, we simply escape double-quotes on the value, so that unquoted values
                                 * will remain as raw names/symbols/numbers, and quoted strings will retain
                                 * the quotes.
                                 * TODO: it would be smarter to detect if it was a quoted string
                                 *
                                 * @param {type} attribs
                                 * @returns {String}
                                 */

    // outer level (no surrounting curly braces.)
    function makeDataBindAttribs(attribs) {
        if (attribs) {
            return Object.keys(attribs)
                .map((key) => {
                    const value = attribs[key];
                    key = fixKey(key);
                    return key + ': ' + makeDataBindAttribs2(value) + '';
                })
                .filter((field) => {
                    return field ? true : false;
                })
                .join(',');
        }
        return '';
    }

    function makeDataBindAttribs2(attribs) {
        switch (typeof attribs) {
        case 'object':
            if (attribs instanceof Array) {
                return '[' + attribs.map((attrib) => {
                    return makeDataBindAttribs2(attrib);
                }).join(',') + ']';
            } else if (attribs === null) {
                return 'null';
            } else {
                return '{' + Object.keys(attribs)
                    .map((key) => {
                        const value = attribs[key];
                        key = fixKey(key);
                        return key + ':' + makeDataBindAttribs2(value);
                    })
                    .filter((field) => {
                        return field ? true : false;
                    })
                    .join(',') + '}';
            }
        case 'function':
            return attribs.toString();
        case 'string':
            return attribs.replace(/"/g, '\'');
        case 'number':
            return String(attribs);
        case 'boolean':
            return String(attribs);
        default:
            throw new Error('Type not supported for data-bind attribute: ' + (typeof attribs));
        }
    }

    /**
                                 * Given a simple object of keys and values, create a string which
                                 * encodes a set of html tag attributes.
                                 * String values escape the "
                                 * Boolean values either insert the attribute name or not
                                 * Object values are interpreted as "embedded attributes" (see above)
                                 * @param {type} attribs
                                 * @returns {String}
                                 */
    function makeTagAttribs(attribs) {
        const quoteChar = '"';
        const quoteEscaped = '&quot;';
        let escapedValue;
        if (attribs) {
            return Object.keys(attribs)
                .map((key) => {
                    let value = attribs[key];
                    const attribName = camelToHyphen(key);
                    // The value may itself be an object, which becomes a special string.
                    // This applies for "style" and "data-bind", each of which have a
                    // structured string value.
                    // Another special case is an array, useful for space-separated
                    // attributes, esp. "class".
                    if (typeof value === 'object') {
                        if (value === null) {
                            // null works just like false.
                            value = false;
                        } else if (value instanceof Array) {
                            value = value.join(' ');
                        } else {
                            switch (attribName) {
                            case 'style':
                                value = makeStyleAttribs(value);
                                break;
                            case 'data-bind':
                                value = makeDataBindAttribs(value);
                                break;
                            default:
                                value = false;
                            }
                        }
                    }
                    if (typeof value === 'string') {
                        escapedValue = value.replace(/"/g, quoteEscaped);
                        return attribName + '=' + quoteChar + escapedValue + quoteChar;
                    }
                    if (typeof value === 'boolean') {
                        if (value) {
                            return attribName;
                        }
                        return false;
                    }
                    if (typeof value === 'number') {
                        return attribName + '=' + quoteChar + String(value) + quoteChar;
                    }
                    return false;
                })
                .filter((field) => {
                    return field ? true : false;
                })
                .join(' ');
        }
        return '';
    }

    function renderContent(children) {
        if (children) {
            if (typeof children === 'string') {
                return children;
            }
            if (typeof children === 'number') {
                return String(children);
            }
            if (children instanceof Array) {
                return children.map((item) => {
                    return renderContent(item);
                }).join('');
            }
        } else {
            return '';
        }
    }

    function merge(obj1, obj2) {
        function isObject(x) {
            if (typeof x === 'object' &&
                    x !== null &&
                    !(x instanceof Array)) {
                return true;
            }
            return false;
        }

        function merger(a, b) {
            Object.keys(b).forEach((key) => {
                if (isObject(a) && isObject(b)) {
                    a[key] = merger(a[key], b[key]);
                }
                a[key] = b[key];
            });
            return a;
        }
        return merger(obj1, obj2);
    }

    function tag(tagName, options) {
        options = options || {};
        let tagAttribs;
        if (tagsCache[tagName] && !options.ignoreCache) {
            return tagsCache[tagName];
        }
        const tagFun = function (attribs, children) {
            let node = '<' + tagName;
            if (attribs instanceof Array) {
                // skip attribs, just go to children.
                children = attribs;
                attribs = null;
            } else if (typeof attribs === 'string') {
                // skip attribs, just go to children.
                children = attribs;
                attribs = null;
            } else if (attribs === null || attribs === undefined) {
                if (!children) {
                    children = '';
                }
            } else if (typeof attribs === 'object') {
                if (options.attribs) {
                    attribs = merge(merge({}, options.attribs), attribs);
                }
            } else if (typeof attribs === 'number') {
                children = String(attribs);
                attribs = null;
            } else if (typeof attribs === 'boolean') {
                if (attribs) {
                    children = 'true';
                } else {
                    children = 'false';
                }
                attribs = null;
            } else {
                throw 'Cannot make tag ' + tagName + ' from a ' + (typeof attribs);
            }
            attribs = attribs || options.attribs;
            if (attribs) {
                tagAttribs = makeTagAttribs(attribs);
                if (tagAttribs && tagAttribs.length > 0) {
                    node += ' ' + tagAttribs;
                }
            }

            node += '>';
            if (options.close !== false) {
                node += renderContent(children);
                node += '</' + tagName + '>';
            }
            return node;
        };
        if (!options.ignoreCache) {
            tagsCache[tagName] = tagFun;
        }
        return tagFun;
    }

    function tags(tagNames) {
        return tagNames.map((tagName) => {
            return tag(tagName);
        });
    }

    function genId() {
        return 'kb_html_' + (new Uuid(4)).format();
    }

    function flatten(html) {
        if (typeof html === 'string') {
            return html;
        }
        if (html instanceof Array) {
            return html.map((h) => {
                return flatten(h);
            }).join('');
        }
        throw new Error('Not a valid html representation -- must be string or list');
    }

    function safeString(str) {
        const anonDiv = document.createElement('div');
        anonDiv.innerText = str;
        return anonDiv.textContent || anonDiv.innerText || '';
    }

    function embeddableString(str) {
        return str.replace(/</, '&lt;')
            .replace(/>/, '&gt;');
    }

    function makeStyles(styleDefs) {
        const classes = {},
            style = tag('style'),
            scopes = {};

        function addScope(key) {
            if (!scopes[key]) {
                scopes[key] = key + '_' + genId();
            }
            return scopes[key];
        }

        // generate unique class names.
        let classDefs, ruleDefs;
        if (styleDefs.classes) {
            classDefs = styleDefs.classes || {};
            ruleDefs = styleDefs.rules || {};
        } else {
            classDefs = styleDefs;
            ruleDefs = {};
        }

        Object.keys(classDefs).forEach((key) => {
            const id = key + '_' + genId();

            classes[key] = id;

            if (!classDefs[key].css) {
                classDefs[key] = {
                    css: classDefs[key]
                };
            }

            classDefs[key].id = id;
        });

        const sheet = [];

        // Classes
        Object.keys(classDefs).forEach((key) => {
            const style = classDefs[key];
            sheet.push([
                '.',
                style.id,
                ' {',
                makeStyleAttribs(style.css),
                '}'
            ].join(''));

            // Pseudo classes
            if (style.pseudo) {
                style.pseudoClasses = style.pseudo;
            }
            if (style.pseudoClasses) {
                Object.keys(style.pseudoClasses).forEach((key) => {
                    sheet.push([
                        '.',
                        style.id + ':' + key,
                        '{',
                        makeStyleAttribs(style.pseudoClasses[key]),
                        '}'
                    ].join(''));
                });
            }

            // pseudo elements
            if (style.pseudoElements) {
                Object.keys(style.pseudoElements).forEach((key) => {
                    sheet.push([
                        '.',
                        style.id + '::' + key,
                        '{',
                        makeStyleAttribs(style.pseudoElements[key]),
                        '}'
                    ].join(''));
                });
            }

            // scopes are simple class names which are required as an
            // outer scope for this style to activate under this id;
            // commonly used for class names set dynamically: active, selected, etc.
            // in an outer scope and should be reflected by one or more
            // internal styles.
            if (style.scopes) {
                // we don't use the key provided, but create an id from it.
                Object.keys(style.scopes).forEach((key) => {
                    const id = addScope(key);
                    sheet.push([
                        '.',
                        id,
                        ' .',
                        style.id,
                        '{',
                        makeStyleAttribs(style.scopes[key]),
                        '}'
                    ].join(''));
                });
            }
            // modifiers are classes applied directly to another class; i.e. they
            // are not used for scoping or in inheritance.
            if (style.modifiers) {
                Object.keys(style.modifiers).forEach((key) => {
                    const id = addScope(key);
                    const modifier = style.modifiers[key];
                    if (!modifier.css) {
                        modifier.css = modifier;
                    }
                    sheet.push([
                        '.',
                        style.id,
                        '.',
                        id,
                        '{',
                        makeStyleAttribs(modifier.css),
                        '}'
                    ].join(''));

                    if (modifier.pseudo) {
                        modifier.pseudoClasses = modifier.pseudo;
                    }
                    if (modifier.pseudoClasses) {
                        Object.keys(modifier.pseudoClasses).forEach((pseudoClass) => {
                            sheet.push([
                                '.',
                                style.id,
                                '.',
                                id + ':' + pseudoClass,
                                '{',
                                makeStyleAttribs(modifier.pseudoClasses[pseudoClass]),
                                '}'
                            ].join(''));
                        });
                    }

                });
            }

            // inner scopes are inner elemenst
            if (style.inner) {
                Object.keys(style.inner).forEach((innerSelector) => {
                    const inner = style.inner[innerSelector];
                    if (!inner.css) {
                        inner.css = inner;
                    }

                    sheet.push([
                        '.',
                        style.id,
                        ' ',
                        innerSelector,
                        '{',
                        makeStyleAttribs(inner.css),
                        '}'
                    ].join(''));


                    if (inner.scopes) {
                        Object.keys(inner.scopes).forEach((key) => {
                            const scopeId = addScope(key);
                            sheet.push([
                                '.',
                                scopeId,
                                ' .',
                                style.id,
                                ' ',
                                innerSelector,
                                '{',
                                makeStyleAttribs(inner.scopes[key]),
                                '}'
                            ].join(''));
                        });
                    }
                });
            }
        });

        // Rules
        Object.keys(ruleDefs).forEach((ruleType) => {
            const rules = ruleDefs[ruleType];
            Object.keys(rules).forEach((ruleName) => {
                const rule = rules[ruleName];
                sheet.push([
                    '@' + ruleType + ' ' + ruleName,
                    '{',
                    Object.keys(rule).map((ruleKey) => {
                        return ruleKey + ' { ' + makeStyleAttribs(rule[ruleKey]) + ' } ';
                    }).join(''),
                    '}'
                ].join(''));
            });
        });
        return {
            classes: classes,
            def: styleDefs,
            sheet: style({
                type: 'text/css'
            }, sheet.join('\n')),
            scopes: scopes
        };
    }

    return Object.freeze({
        html: jsonToHTML,
        tag: tag,
        tags: tags,
        genId: genId,
        flatten: flatten,
        safeString: safeString,
        embeddableString: embeddableString,
        makeStyles: makeStyles
    });
});
