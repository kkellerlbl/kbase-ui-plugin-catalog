define([
    'knockout',
    'numeral',
    'moment',
    'marked',
    'kb_lib/time'
], function (
    ko,
    numeral,
    moment,
    marked,
    time
) {
    'use strict';

    ko.bindingHandlers.htmlMarkdown = {
        update: function (element, valueAccessor) {
            const value = ko.unwrap(valueAccessor()) || '';
            element.innerHTML =  marked(value);
        }
    };

    ko.bindingHandlers.markdown = {
        init: function (element, valueAccessor) {
            const value = ko.unwrap(valueAccessor()) || '';
            element.innerHTML = marked(value);
        },
        update: function (element, valueAccessor) {
            const value = ko.unwrap(valueAccessor()) || '';
            element.innerHTML = marked(value);
        }
    };

    ko.bindingHandlers.numberText = {
        update: function (element, valueAccessor, allBindings) {
            const value = valueAccessor();
            const valueUnwrapped = ko.unwrap(value);
            const format = allBindings.get('numberFormat') || '';
            const formatted = numeral(valueUnwrapped).format(format);
            element.innerText = formatted;
        }
    };

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

    function niceRelativeTimeRange(startDateInput, endDateInput, now) {
        let startDate;
        if (startDateInput === null || endDateInput === undefined) {
            startDate = null;
        } else {
            startDate = moment(startDateInput).toDate();
        }

        let endDate;
        if (endDateInput === null || endDateInput === undefined) {
            endDate = null;
        } else {
            endDate = moment(endDateInput).toDate();
        }

        const nowTime = now || new Date.now();
        let date;
        let prefix, suffix;
        if (startDate === null) {
            if (endDate === null) {
                return 'happening now, perpetual';
            } else if (endDate.getTime() < nowTime) {
                prefix = 'ended';
                suffix = 'ago';
                date = endDate;
            } else {
                prefix = 'happening now, ending in ';
                date = endDate;
            }
        } else {
            if (startDate.getTime() > nowTime) {
                prefix = 'in';
                date = startDate;
            } else if (endDate === null) {
                return 'happening now, indefinite end';
            } else if (endDate.getTime() < nowTime) {
                prefix = 'ended';
                suffix = 'ago';
                date = endDate;
            } else {
                prefix = 'happening now, ending in ';
                date = endDate;
            }
        }

        const elapsed = Math.round((nowTime - date.getTime()) / 1000);
        const elapsedAbs = Math.abs(elapsed);
        let measureAbs;

        const measures = [];
        let remaining;

        if (elapsedAbs === 0) {
            return 'now';
        } else if (elapsedAbs < 60) {
            measures.push([elapsedAbs, 'second']);
        } else if (elapsedAbs < 60 * 60) {
            measureAbs = Math.floor(elapsedAbs / 60);
            measures.push([measureAbs, 'minute']);
            remaining = elapsedAbs - (measureAbs * 60);
            if (remaining > 0) {
                measures.push([remaining, 'second']);
            }
        } else if (elapsedAbs < 60 * 60 * 24) {
            measureAbs = Math.floor(elapsedAbs / 3600);
            const remainingSeconds = elapsedAbs - (measureAbs * 3600);
            const remainingMinutes = Math.round(remainingSeconds/60);
            if (remainingMinutes === 60) {
                // if we round up to 24 hours, just considering this another
                // day and don't show hours.
                measureAbs += 1;
                measures.push([measureAbs, 'hour']);
            } else {
                // otherwise, do show the hours
                measures.push([measureAbs, 'hour']);
                if (remainingMinutes > 0) {
                    // unless it rounds down to no hours.
                    measures.push([remainingMinutes, 'minute']);
                }
            }
        } else if (elapsedAbs < 60 * 60 * 24 * 7) {
            measureAbs = Math.floor(elapsedAbs / (3600 * 24));
            const remainingSeconds = elapsedAbs - (measureAbs * 3600 * 24);
            const remainingHours = Math.round(remainingSeconds/3600);
            if (remainingHours === 24) {
                // if we round up to 24 hours, just considering this another
                // day and don't show hours.
                measureAbs += 1;
                measures.push([measureAbs, 'day']);
            } else {
                // otherwise, do show the hours
                measures.push([measureAbs, 'day']);
                if (remainingHours > 0) {
                    // unless it rounds down to no hours.
                    measures.push([remainingHours, 'hour']);
                }
            }
        } else {
            measureAbs = Math.floor(elapsedAbs / (3600 * 24));
            measures.push([measureAbs, 'day']);
        }

        return [
            (prefix ? prefix + ' ' : ''),
            measures.map(([measure, unit]) => {
                if (measure !== 1) {
                    unit += 's';
                }
                return [measure, unit].join(' ');
            }).join(', '),
            (suffix ? ' ' + suffix : '')
        ].join('');
    }

    function niceTime(date) {
        let time;
        let minutes = date.getMinutes();
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        if (date.getHours() >= 12) {
            if (date.getHours() !== 12) {
                time = (date.getHours() - 12) + ':' + minutes + 'pm';
            } else {
                time = '12:' + minutes + 'pm';
            }
        } else {
            time = date.getHours() + ':' + minutes + 'am';
        }
        return time;
    }

    function niceDate(date, options) {
        const now = new Date();

        let year = '';
        if (now.getFullYear() !== date.getFullYear()) {
            year = ', ' + date.getFullYear();
        }
        let day = '';
        if (options && options.showDay) {
            day = time.shortDays[date.getDay()] + ' ';
        }
        return day + time.shortMonths[date.getMonth()] + ' ' + date.getDate() + year;
    }

    function niceTimeRange(from, to, options) {
        // same day
        let timePart;
        if (from) {
            if (to) {
                if (from.getDate() === to.getDate()) {
                    if (from.getTime() === to.getTime()) {
                        timePart = ' at ' + niceTime(from);
                    } else {
                        timePart = ' from ' + niceTime(from) + ' to ' + niceTime(to);
                    }
                    return niceDate(from, options) + timePart;
                } else {
                    return 'from ' + niceDate(from, options) + ' at ' + niceTime(from) + ' to ' + niceDate(to, options) + ' at ' + niceTime(to);
                }
            } else {
                return 'from ' + niceDate(from, options) + ' at ' + niceTime(from);
            }
        }
    }

    ko.bindingHandlers.focus = {
        init: function (element, valueAccessor) {
            const focusser = valueAccessor().focusser;
            focusser.setElement(element);
        }
    };

    ko.bindingHandlers.typedText = {
        update: function (element, valueAccessor) {
            const value = valueAccessor();
            let valueUnwrapped;
            const format = value.format;
            const type = value.type;
            const missing = value.missing || '';
            const defaultValue = value.default;
            let formatted;
            switch (type) {
            case 'number':
                numeral.nullFormat('');
                valueUnwrapped = ko.unwrap(value.value);
                if (valueUnwrapped === undefined || valueUnwrapped === null) {
                    formatted = missing;
                } else {
                    formatted = numeral(valueUnwrapped).format(format);
                }
                break;
            case 'date':
                valueUnwrapped = ko.unwrap(value.value);
                if (valueUnwrapped === undefined || valueUnwrapped === null) {
                    formatted = missing;
                } else {
                    switch (format) {
                    case 'elapsed':
                    case 'nice-elapsed':
                        formatted = time.niceElapsedTime(moment(valueUnwrapped).toDate());
                        break;
                    case 'duration':
                        // formatted = Utils.niceElapsedTime(moment(valueUnwrapped).toDate());
                        formatted = niceDuration(valueUnwrapped);
                        break;
                    default: formatted = moment(valueUnwrapped).format(format);
                    }
                }
                break;
            case 'date-range':
                var startDate = ko.unwrap(value.value.startDate);
                var endDate = ko.unwrap(value.value.endDate);
                var now;
                if (value.value.now) {
                    now = ko.unwrap(value.value.now);
                } else {
                    now = Date.now();
                }
                if (!startDate) {
                    formatted = missing;
                } else {
                    switch (format) {
                    case 'nice-range':
                        formatted = niceTimeRange(moment(startDate).toDate(), moment(endDate).toDate());
                        break;
                    case 'nice-relative-range':
                        formatted = niceRelativeTimeRange(startDate, endDate, now);
                        break;
                    default: formatted = 'invalid format: ' + format;
                    }
                }
                break;
            case 'bool':
            case 'boolean':
                valueUnwrapped = ko.unwrap(value.value);
                if (valueUnwrapped === undefined || valueUnwrapped === null) {
                    if (defaultValue === undefined) {
                        formatted = missing;
                        break;
                    }
                    valueUnwrapped = defaultValue;
                }

                var booleanLabels;
                if (format) {
                    if (typeof format === 'string') {
                        booleanLabels = format.split(',');
                    } else {
                        booleanLabels = format;
                    }
                } else {
                    booleanLabels = ['true', 'false'];
                }

                if (valueUnwrapped) {
                    formatted = booleanLabels[0];
                } else {
                    formatted = booleanLabels[1];
                }

                break;
            case 'text':
            case 'string':
            default:
                valueUnwrapped = ko.unwrap(value.value);
                formatted = valueUnwrapped;
            }

            element.innerText = formatted;
        }
    };
});
