define([
    './state'
], function (
    state
) {
    'use strict';

    function testGetStateProperty(test) {
        class UserCollection extends state.Collection {
            constructor() {
                super();
            }

            createKey(obj) {
                // for now, just a test...
                if ('username' in obj) {
                    return obj.username;
                }
                throw new Error('Cannot create key for object: ' + Object.keys(obj).join(', '));
            }
        }

        const userCollection = new UserCollection();
        userCollection.start();

        userCollection.add({
            username: 'abc',
            name: 'Aye Bee Cee'
        });

        const user = userCollection.get({username: 'abc'});

        if (user && user.username === 'abc' && user.name === 'Aye Bee Cee') {
            test.success();
        } else {
            test.fail('did not get expected value');
        }

    }

    // function testSkipped(test) {
    //     test.skip('skipping this one...');
    // }

    // function testBad() {
    //     return null;
    // }

    return {testGetStateProperty};
});