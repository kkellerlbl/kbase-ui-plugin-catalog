define([], function () {
    'use strict';

    class Alarm {
        constructor(interval) {
            this.interval = interval;
            this.timer = null;
            this.listeners = {};
        }
    }

    class Clock {
        constructor() {
            this.intervalAlarms = {};
            this.listeners = {};
            this.currentId = 0;
        }

        getIntervalAlarm(interval) {
            var alarm = this.intervalAlarms[interval];
            if (!alarm) {
                alarm = new Alarm(interval);
                this.intervalAlarms[interval] = alarm;
            }
            return alarm;
        }

        listen(fun, interval) {
            this.currentId += 1;
            interval = interval || 1;
            var alarm = this.getIntervalAlarm(interval);
            alarm.listeners[this.currentId] = {
                fun: fun,
                id: this.currentId,
                callCount: 0,
                lastCalledAt: null,
                error: null
            };
            this.listeners[this.currentId] = {
                interval: interval,
                id: this.currentId
            };

            if (!alarm.timer) {
                alarm.timer = window.setInterval(function () {
                    Object.keys(alarm.listeners).forEach((id) => {
                        var listener = alarm.listeners[id];
                        try {
                            listener.callCount += 1;
                            listener.lastCalledA = new Date();
                            listener.fun();
                            listener.error = null;
                        } catch (ex) {
                            console.error('ERROR calling listener ' + listener.id + ' in alarm ' + interval, ex);
                            listener.error = ex;
                        }
                    });
                }, alarm.interval * 1000);
            }
            return this.currentId;
        }

        forget(id) {
            var listener = this.listeners[id];
            if (!listener) {
                return;
            }
            delete this.listeners[id];
            var alarm = this.intervalAlarms[listener.interval];
            delete alarm.listeners[id];
            if (Object.keys(alarm.listeners).length === 0) {
                window.clearInterval(alarm.timer);
                alarm.timer = null;
            }
        }

    }

    const globalClock = new Clock();

    return {Clock, globalClock};
});