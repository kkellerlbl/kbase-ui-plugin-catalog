define([], function () {
    'use strict';

    function encodeQuery(value) {
        function validate(fieldValue) {
            const valueType = typeof fieldValue;
            switch (valueType) {
            case 'string':
                return fieldValue;
            case 'number':
                return String(fieldValue);
            }
            throw new Error('Only string and number values can be query-encoded, not ' + valueType);
        }
        return Object.keys(value).map((key) => {
            return [key, value[key]]
                .map(function (v) {
                    return encodeURIComponent(validate(v));
                })
                .join('=');
        })
            .join('&');
    }

    return Object.freeze({encodeQuery});
});