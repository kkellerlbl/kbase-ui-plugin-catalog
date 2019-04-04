define([
    'knockout',
    '../registry',
    'kb_lib/html',
    '../lib/clock',
    '../lib/viewModelBase'
], function (
    ko,
    reg,
    html,
    clock,
    ViewModelBase
) {
    'use strict';

    const t = html.tag,
        span = t('span'),
        div = t('div');

    function niceDuration(value, options) {
        options = options || {};
        const minimized = [];
        const units = [{
            unit: 'millisecond',
            short: 'ms',
            single: 'm',
            size: 1000
        }, {
            unit: 'second',
            short: 'sec',
            single: 's',
            size: 60
        }, {
            unit: 'minute',
            short: 'min',
            single: 'm',
            size: 60
        }, {
            unit: 'hour',
            short: 'hr',
            single: 'h',
            size: 24
        }, {
            unit: 'day',
            short: 'day',
            single: 'd',
            size: 30
        }];
        let temp = Math.abs(value);
        const parts = units
            .map(function (unit) {
                // Get the remainder of the current value
                // sans unit size of it composing the next
                // measure.
                const unitValue = temp % unit.size;
                // Recompute the measure in terms of the next unit size.
                temp = (temp - unitValue) / unit.size;
                return {
                    name: unit.single,
                    unit: unit.unit,
                    value: unitValue
                };
            }).reverse();

        parts.pop();

        // We skip over large units which have not value until we
        // hit the first unit with value. This effectively trims off
        // zeros from the end.
        // We also can limit the resolution with options.resolution
        let keep = false;
        for (let i = 0; i < parts.length; i += 1) {
            if (!keep) {
                if (parts[i].value > 0) {
                    keep = true;
                    minimized.push(parts[i]);
                }
            } else {
                minimized.push(parts[i]);
                if (options.resolution &&
                    options.resolution === parts[i].unit) {
                    break;
                }
            }
        }

        if (minimized.length === 0) {
            // This means that there is are no time measurements > 1 second.
            return '<1s';
        } else {
            // Skip seconds if we are into the hours...
            // if (minimized.length > 2) {
            //     minimized.pop();
            // }
            return minimized.map(function (item) {
                return String(item.value) + item.name;
            })
                .join(' ');
        }
    }

    class ViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            this.startTime = ko.utils.unwrapObservable(params.startTime);
            if (this.startTime instanceof Date) {
                this.startTime = this.startTime.getTime();
            }

            this.currentTime = ko.observable((new Date()).getTime());

            // TODO: allow an optional finish time to stop the clock.

            this.listener = clock.globalClock.listen(() => {
                this.currentTime((new Date()).getTime());
            }, params.updateInterval || 1);

            this.elapsed = ko.pureComputed(() => {
                if (this.startTime) {
                    return niceDuration(this.currentTime() - this.startTime);
                }
                return 'n/a';
            });
        }

        dispose() {
            if (this.listener) {
                clock.globalClock.forget(this.listener);
            }
            super.dispose();
        }
    }

    function template() {
        return div([
            span({
                dataBind: {
                    text: 'elapsed'
                }
            })
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