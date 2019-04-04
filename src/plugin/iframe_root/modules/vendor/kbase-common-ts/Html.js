define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    class Html {
        constructor() {
            this.genIdSerial = 0;
        }
        renderChildren(children) {
            if (children === null) {
                return '';
            }
            if (typeof children === 'string') {
                return children;
            }
            if (typeof children === 'number') {
                return String(children);
            }
            if (!(children instanceof Array)) {
                throw new Error('hmm, not an array? ' + typeof children);
            }
            let that = this;
            return children.map((child) => {
                return that.renderChildren(child);
            }).join('');
        }
        styleAttribsToString(attribs) {
            let that = this;
            return Object.keys(attribs).map((key) => {
                let value = attribs[key];
                let attribValue = value;
                let attribName = key.replace(/[A-Z]/g, (m) => {
                    return '-' + m.toLowerCase();
                });
                return [attribName, attribValue].join(': ');
            }).join('; ');
        }
        attribsToString(attribs) {
            let that = this;
            return Object.keys(attribs).map((key) => {
                let value = attribs[key];
                var attribValue;
                if (typeof value === 'string') {
                    attribValue = '"' + value.replace(/"/, '""') + '"';
                }
                else {
                    attribValue = '"' + that.styleAttribsToString(value) + '"';
                }
                let attribName = key.replace(/[A-Z]/g, (m) => {
                    return '-' + m.toLowerCase();
                });
                return [attribName, attribValue].join('=');
            }).join(' ');
        }
        mergeAttribs(a, b) {
            if (typeof a === 'undefined') {
                a = {};
            }
            let merger = (x, y) => {
                if (typeof y === 'object' && y !== null) {
                    Object.keys(y).forEach((key) => {
                        var xval = x[key];
                        var yval = y[key];
                        if (typeof xval === 'undefined') {
                            x[key] = yval;
                        }
                        else if (typeof xval === 'object' && xval !== null) {
                            if (typeof yval === 'object' && yval !== null) {
                                merger(xval, yval);
                            }
                            else {
                                x[key] = yval;
                            }
                        }
                        else {
                            x[key] = yval;
                        }
                    });
                }
            };
            merger(a, b);
            return a;
        }
        tagMaker() {
            let isHtmlNode = (val) => {
                return true;
            };
            let isAttribMap = (val) => {
                return true;
            };
            var notEmpty = (x) => {
                if ((typeof x === 'undefined') ||
                    (x === null) ||
                    x.length === 0) {
                    return false;
                }
                return true;
            };
            var maker = (name, defaultAttribs = {}) => {
                var tagFun = (attribs, children) => {
                    let node = '<';
                    if (typeof children === 'undefined') {
                        if (typeof attribs === 'object' &&
                            !(attribs instanceof Array) &&
                            isAttribMap(attribs)) {
                            if (Object.keys(attribs).length === 0) {
                                node += name;
                            }
                            else {
                                let tagAttribs = this.attribsToString(this.mergeAttribs(attribs, defaultAttribs));
                                node += [name, tagAttribs].filter(notEmpty).join(' ');
                            }
                            node += '>';
                        }
                        else if (typeof attribs === 'undefined') {
                            let tagAttribs = this.attribsToString(defaultAttribs);
                            node += [name, tagAttribs].filter(notEmpty).join(' ');
                            node += '>';
                        }
                        else if (isHtmlNode(attribs)) {
                            let tagAttribs = this.attribsToString(defaultAttribs);
                            node += [name, tagAttribs].filter(notEmpty).join(' ');
                            node += '>' + this.renderChildren(attribs);
                        }
                    }
                    else if (isAttribMap(attribs) && isHtmlNode(children)) {
                        if (Object.keys(attribs).length === 0) {
                            node += name;
                        }
                        else {
                            let tagAttribs = this.attribsToString(this.mergeAttribs(attribs, defaultAttribs));
                            node += [name, tagAttribs].filter(notEmpty).join(' ');
                        }
                        node += '>' + this.renderChildren(children);
                    }
                    node += '</' + name + '>';
                    return node;
                };
                return tagFun;
            };
            return maker;
        }
        genId() {
            let random = Math.floor(Math.random() * 1000);
            let time = new Date().getTime();
            if (this.genIdSerial === 1000) {
                this.genIdSerial = 0;
            }
            this.genIdSerial += 1;
            return [random, time, this.genIdSerial].map(String).join('-');
        }
    }
    exports.Html = Html;
});
