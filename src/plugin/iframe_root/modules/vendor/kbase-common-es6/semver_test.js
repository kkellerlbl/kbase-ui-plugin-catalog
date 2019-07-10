define([
    './semver'
], function (
    semver
) {
    'use strict';

    function arraysEqual(a1, a2) {
        if (a1.length !== a2.length) {
            return false;
        }
        for (let i = 0; i < a1.length; i += 1) {
            if (a1[i] !== a2[i]) {
                return false;
            }
        }
        return true;
    }

    function testParseSemver(test) {
        const data = [
            {
                input: '1.2.3',
                expected: [1, 2, 3, undefined]
            },
            {
                input: '1.2.3-beta1',
                expected: [1, 2, 3, 'beta1']
            }
        ];

        data.forEach((datum) => {
            const result = semver.parseSemver(datum.input);
            if (arraysEqual(result, datum.expected)) {
                test.success();
            } else {
                test.fail({
                    actual: result,
                    expected: datum.expected
                });
            }
        });
    }

    function testComparison(test) {
        const data = [
            {
                actualVersion: '1.2.3',
                desiredVersion: '1.2.3',
                expected: true
            },
            {
                actualVersion: '1.2.3',
                desiredVersion: '1.2.4',
                expected: 'patch-too-low'
            },
            {
                actualVersion: '1.2.3',
                desiredVersion: '1.3.3',
                expected: 'minor-too-low'
            },
            {
                actualVersion: '2.2.3',
                desiredVersion: '1.2.4',
                expected: 'major-incompatible'
            },
            {
                actualVersion: '1.2.3-beta',
                desiredVersion: '1.2.3-beta',
                expected: true
            },
            {
                actualVersion: '1.2.3-beta2',
                desiredVersion: '1.2.3-beta1',
                expected: true
            },
            {
                actualVersion: '1.2.3-beta',
                desiredVersion: '1.2.3-alpha',
                expected: true
            },
            {
                actualVersion: '1.2.3-alpha',
                desiredVersion: '1.2.3-beta',
                expected: 'prerelease-too-low'
            },
            {
                actualVersion: '1.2.3-alpha1',
                desiredVersion: '1.2.3-alpha2',
                expected: 'prerelease-too-low'
            },
            {
                actualVersion: '1.2.3-alpha1',
                desiredVersion: '1.2.3',
                expected: 'prerelease-makes-patch-too-low'
            },
            {
                actualVersion: '1.2.3',
                desiredVersion: '1.2.3-alpha1',
                expected: true
            }
        ];

        data.forEach((datum) => {
            const result = semver.semverIsAtLeast(datum.actualVersion, datum.desiredVersion);
            if (result === datum.expected) {
                test.success();
            } else {
                test.fail({
                    actual: result,
                    expected: datum.expected
                });
            }
        });
    }

    return {testParseSemver, testComparison};
});