define([

], function (

) {
    'use strict';

    class Params {
        constructor(params) {
            this.params = params;
        }

        check(name, type, constraints) {
            if (!(name in this.params)) {
                if (constraints.required) {
                    throw new Error('Parameter "' + name + '" is required and was not provided');
                } else {
                    return undefined;
                }
            }
            const value = this.params[name];
            const valueType = typeof value;
            if (valueType !== type) {
                throw new Error('Parameter ' + name + ' is not of the expected type: ' + type);
            }

            return value;
        }
    }

    return {Params};
});