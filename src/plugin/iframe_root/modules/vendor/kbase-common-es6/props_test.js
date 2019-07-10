define([
    './props'
], function (
    props
) {
    'use strict';

    function testGetSimpleProp(test) {
        const params = [
            {
                expected: 'Coco',
                prop: 'name'
            },
            {
                expected: 'Coco',
                prop: ['name']
            }
        ];

        params.forEach((param) => {
            const data = {
                name: param.expected
            };

            const result = props.getProp(data, param.prop);
            if (result === param.expected) {
                test.success();
            } else {
                test.fail();
            }
        });
    }

    function testGetPropPath(test) {
        const data = {
            name: 'Coco',
            favoriteFoods: {
                breakfast: 'chow',
                lunch: 'chow',
                dinner: 'special-chow'
            }
        };

        const params = [
            {
                expected: 'special-chow',
                prop: 'favoriteFoods.dinner'
            },
            {
                expected: 'special-chow',
                prop: ['favoriteFoods', 'dinner']
            }
        ];

        params.forEach((param) => {
            const result = props.getProp(data, param.prop);
            if (result === param.expected) {
                test.success();
            } else {
                test.fail();
            }
        });
    }

    function testSetThenGetProp(test) {
        const params = [
            {
                value: 'peet',
                prop: 'name'
            },
            {
                value: 'special-chow',
                prop: ['name']
            }
        ];

        params.forEach((param) => {
            const data = {};
            props.setProp(data, param.prop, param.value);
            const result = props.getProp(data, param.prop);
            if (result === param.value) {
                test.success();
            } else {
                test.fail({
                    actual: result,
                    expected: param.value
                });
            }
        });
    }

    function testSetThenHasProp(test) {
        const params = [
            {
                value: 'peet',
                prop: 'name'
            },
            {
                value: 'special-chow',
                prop: ['name']
            }
        ];

        params.forEach((param) => {
            const data = {};
            props.setProp(data, param.prop, param.value);
            if (props.hasProp(data, param.prop)) {
                test.success();
            } else {
                test.fail();
            }
        });
    }

    function testSetThenDeleteThenGetProp(test) {
        const data = {};

        const name = 'peet';
        props.setProp(data, 'name', name);
        const result1 = props.getProp(data, 'name');

        const deleteResult = props.deleteProp(data, 'name');
        const result2 = props.getProp(data, 'name', null);

        if (result1 === name && result2 === null && deleteResult === true) {
            test.success();
        } else {
            test.fail();
        }
    }

    function testDeleteNonexistentProperty(test) {
        const data = {};

        const name = 'peet';
        props.setProp(data, 'name', name);

        const deleteResult = props.deleteProp(data, 'age');

        if (deleteResult === false) {
            test.success();
        } else {
            test.fail();
        }
    }

    function testDeleteWithInvalidPath(test) {
        const data = {};

        const name = 'peet';
        props.setProp(data, 'name', name);

        const badPathsToTry = [undefined, null, 1, 1.23, true, false, new Date()];

        badPathsToTry.forEach((badPath) => {
            try {
                props.deleteProp(data, badPath);
                test.fail();
                return;
            } catch (ex) {
                // good!
                test.success();
            }
        });
    }

    function testSetWithInvalidPath(test) {
        const data = {};

        const badPathsToTry = [undefined, null, 1, 1.23, true, false, new Date()];

        badPathsToTry.forEach((badPath) => {
            try {
                props.setProp(data, badPath, 'peet');
                test.fail();
                return;
            } catch (ex) {
                // good!
                test.success();
            }
        });
    }

    function testDeleteNonexistentPathComponent(test) {
        const data = {};

        const name = 'peet';
        props.setProp(data, 'name', name);

        const deleteResult = props.deleteProp(data, 'birth.date');

        if (deleteResult === false) {
            test.success();
        } else {
            test.fail();
        }
    }

    function testIncrement(test) {
        const params = [
            {
                prop: 'goals',
                initial: 0,
                expected: 1
            },
            {
                prop: 'goals',
                initial: -1,
                expected: 0
            },
        ];

        params.forEach((param) => {
            const data = {
                goals: param.initial
            };
            props.incrProp(data, param.prop);
            const value = props.getProp(data, param.prop);
            if (value === param.expected) {
                test.success();
            } else {
                test.fail();
            }
        });
    }

    return {
        testGetSimpleProp,
        testGetPropPath,
        testSetThenGetProp,
        testSetThenDeleteThenGetProp,
        testSetThenHasProp,
        testIncrement,
        testDeleteNonexistentProperty,
        testDeleteNonexistentPathComponent,
        testDeleteWithInvalidPath,
        testSetWithInvalidPath
    };
});