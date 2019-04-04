define([], function () {
    'use strict';

    // Utils

    function objectToParamsString(obj) {
        return [
            '{',
            Object.keys(obj).map((key) => {
                return key + ':' + obj[key];
            }).join(','),
            '}'
        ].join('');
    }

    function arrayToParamsString(arr) {
        return [
            '{',
            arr.map((key) => {
                return key + ':' + key;
            }).join(','),
            '}'
        ].join('');
    }

    function toParamsString(from) {
        if (from instanceof Array) {
            return arrayToParamsString(from);
        } else {
            return objectToParamsString(from);
        }

    }
    // Embeddable expressions

    function koIf(expression, markup, elseMarkup) {
        if (!elseMarkup) {
            return  [
                '<!-- ko if: ' + expression + ' -->',
                markup,
                '<!-- /ko -->'
            ];
        }
        return  [
            '<!-- ko if: ' + expression + ' -->',
            markup,
            '<!-- /ko -->',
            '<!-- ko ifnot: ' + expression + ' -->',
            elseMarkup,
            '<!-- /ko -->'
        ];
    }

    function koTemplateIf(expression, markup, elseMarkup) {
        if (!elseMarkup) {
            return  [
                '<!-- ko template: {if: ' + expression + '} -->',
                markup,
                '<!-- /ko -->'
            ];
        }
        return  [
            '<!-- ko template: {if: ' + expression + '} -->',
            markup,
            '<!-- /ko -->',
            '<!-- ko template: {ifnot: ' + expression + '} -->',
            elseMarkup,
            '<!-- /ko -->'
        ];
    }

    function koWhen(expression, markup) {
        return  [
            '<!-- ko when: ' + expression + ' -->',
            markup,
            '<!-- /ko -->'
        ];
    }

    function koIfnot(expression, markup, elseMarkup) {
        if (!elseMarkup) {
            return  [
                '<!-- ko ifnot: ' + expression + ' -->',
                markup,
                '<!-- /ko -->'
            ];
        }
        return  [
            '<!-- ko ifnot: ' + expression + ' -->',
            markup,
            '<!-- /ko -->',
            '<!-- ko if: ' + expression + ' -->',
            elseMarkup,
            '<!-- /ko -->'
        ];
    }

    function koPlural(expression, singular, plural) {
        return koIf(expression + ' === 1', singular,  plural);
    }

    function koForeach(expression, markup) {
        if (typeof expression === 'object') {
            expression = objectToParamsString(expression);
        }
        return [
            '<!-- ko foreach: ' + expression + ' -->',
            markup,
            '<!-- /ko -->'
        ];
    }

    function koForeachAs(expression, as, markup) {
        return [
            '<!-- ko foreach: {data: ' + expression + ', as: "' + as +  '"} -->',
            markup,
            '<!-- /ko -->'
        ];
    }

    function koLet(lets, markup) {
        const letExpression = '{' + Object.keys(lets).map((key) => {
            // use " for keys to be as generic as possible
            // the value is raw, though, since it may be a
            // vm reference or a literal.
            return  '"' + key + '":' + lets[key];
        })
            .join(', ') + '}';
        const result = [
            '<!-- ko let: ' + letExpression + '-->',
            markup,
            '<!-- /ko -->'
        ];
        return result;
    }

    function koIfLet(lets, markup) {
        const valueExpressions = [];
        const letExpression = '{' + Object.keys(lets).map((key) => {
            // use " for keys to be as generic as possible
            // the value is raw, though, since it may be a
            // vm reference or a literal.
            valueExpressions.push(lets[key]);
            return  '"' + key + '":' + lets[key];
        })
            .join(', ') + '}';
        const ifExpression = '( ' + valueExpressions.map((expr) => {
            return '(' + expr + ')';
        }).join(' && ') + ' )';

        const result = [

            '<!-- ko if: ' + ifExpression + ' -->',
            '<!-- ko let: ' + letExpression + '-->',
            markup,
            '<!-- /ko -->',
            '<!-- /ko -->'
        ];
        return result;
    }

    function koWith(identifier, markup) {
        return [
            '<!-- ko with: ' + identifier + '-->',
            markup,
            '<!-- /ko -->'
        ];
    }

    function koIfWith(identifier, markup) {
        return koIf(identifier, koWith(identifier, markup));
    }

    function koSwitch(condition, cases) {
        return [
            '<!-- ko switch: ' + condition + ' -->',
            cases.map((clause) => {
                return [
                    '<!-- ko case: ',
                    clause[0],
                    ' -->',
                    clause[1],
                    '<!-- /ko -->'
                ];
            }),
            '<!-- /ko -->'
        ];
    }

    function koText(binding) {
        return [
            '<!-- ko text: ' + binding + ' -->',
            '<!-- /ko -->'
        ];
    }

    function koComponent(componentDef) {
        const params = toParamsString(componentDef.params);
        return [
            '<!-- ko component: {name: "',
            componentDef.name,
            '", params: ',
            params,
            '}--><!-- /ko -->'
        ];
    }

    function koComponent2(componentDef) {
        const params = toParamsString(componentDef.params);
        return [
            '<!-- ko component: {name: ',
            componentDef.name,
            ', params: ',
            params,
            '}--><!-- /ko -->'
        ];
    }

    return {
        if: koIf,
        ifnot: koIfnot,
        plural: koPlural,
        foreach: koForeach,
        foreachAs: koForeachAs,
        let: koLet,
        with: koWith,
        switch: koSwitch,
        ifLet: koIfLet,
        text: koText,
        component: koComponent,
        component2: koComponent2,
        when: koWhen,
        ifWith: koIfWith,
        templateIf: koTemplateIf
    };
});