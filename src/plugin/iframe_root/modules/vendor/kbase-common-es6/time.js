define([], function () {
    'use strict';

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    function niceElapsedTime(dateObj, nowDateObj) {
        let date;
        if (typeof dateObj === 'string') {
            date = new Date(dateObj);
        } else if (typeof dateObj === 'number') {
            date = new Date(dateObj);
        } else {
            date = dateObj;
        }

        let now;
        if (nowDateObj === undefined) {
            now = new Date();
        } else if (typeof nowDateObj === 'string') {
            now = new Date(nowDateObj);
        } else {
            now = nowDateObj;
        }

        const elapsed = Math.round((now.getTime() - date.getTime()) / 1000);
        const elapsedAbs = Math.abs(elapsed);

        let measure, measureAbs, unit;
        if (elapsedAbs < 60 * 60 * 24 * 7) {
            if (elapsedAbs === 0) {
                return 'now';
            } else if (elapsedAbs < 60) {
                measure = elapsed;
                measureAbs = elapsedAbs;
                unit = 'second';
            } else if (elapsedAbs < 60 * 60) {
                measure = Math.round(elapsed / 60);
                measureAbs = Math.round(elapsedAbs / 60);
                unit = 'minute';
            } else if (elapsedAbs < 60 * 60 * 24) {
                measure = Math.round(elapsed / 3600);
                measureAbs = Math.round(elapsedAbs / 3600);
                unit = 'hour';
            } else if (elapsedAbs < 60 * 60 * 24 * 7) {
                measure = Math.round(elapsed / (3600 * 24));
                measureAbs = Math.round(elapsedAbs / (3600 * 24));
                unit = 'day';
            }

            if (measureAbs > 1) {
                unit += 's';
            }

            let prefix = null;
            let suffix = null;
            if (measure < 0) {
                prefix = 'in';
            } else if (measure > 0) {
                suffix = 'ago';
            }

            return (prefix ? prefix + ' ' : '') + measureAbs + ' ' + unit + (suffix ? ' ' + suffix : '');
        } else {
            // otherwise show the actual date, with or without the year.
            if (now.getFullYear() === date.getFullYear()) {
                return shortMonths[date.getMonth()] + ' ' + date.getDate();
            } else {
                return shortMonths[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
            }
        }
    }

    /**
     * Given an ISO8601 date in full regalia, with a GMT/UTC timezone offset attached
     * in #### format, reformat the date into ISO8601 with no timezone.
     * Javascript (at present) does not like timezone attached and assumes all such
     * datetime strings are UTC.
     * YYYY-MM-DDThh:mm:ss[+-]hh[:]mm
     * where the +is + or -, and the : in the timezone is optional.
     *
     * @function iso8601ToDate
     *
     * @param {string} dateString - an string encoding a date-time in iso8601 format
     *
     * @returns {Date} - a date object representing the same time as provided in the input.
     *
     * @throws {TypeError} if the input date string does not parse strictly as
     * an ISO8601 full date format.
     *
     * @static
     */
    function iso8601ToDate(dateString) {
        if (!dateString) {
            return null;
        }
        const isoRE = /(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)([+-])(\d\d)(:?[:]*)(\d\d)/;
        const dateParts = isoRE.exec(dateString);
        if (!dateParts) {
            throw new TypeError('Invalid Date Format for ' + dateString);
        }
        // This is why we do this -- JS insists on the colon in the tz offset.
        const offset = dateParts[7] + dateParts[8] + ':' + dateParts[10];
        const newDateString = dateParts[1] + '-' + dateParts[2] + '-' + dateParts[3] + 'T' + dateParts[4] + ':' + dateParts[5] + ':' + dateParts[6] + offset;
        return new Date(newDateString);
    }




    return Object.freeze({ niceElapsedTime, shortMonths, shortDays, iso8601ToDate });
});