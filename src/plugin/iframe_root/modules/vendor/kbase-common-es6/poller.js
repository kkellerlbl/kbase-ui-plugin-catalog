define([
    'bluebird'
], function (
    Promise
) {
    'use strict';

    class Job {
        constructor(config) {
            this.description = config.description;
        }

        getDescription() {
            return this.description;
        }

        run() {
            // does nothing...
            throw new Error('Must override the run method');
        }
    }

    class Task {
        constructor(config) {
            this.runInitially = config.runInitially;
            this.interval = config.interval;

            this.lastRun = null;

            this.jobs = [];
        }

        getInterval() {
            return this.interval;
        }

        setInterval(newInterval) {
            this.interval = newInterval;
        }

        getRunInitially() {
            return this.runInitially;
        }

        getLastRun() {
            return this.lastRun;
        }

        doContinue() {
            return true;
        }

        addJob(job) {
            this.jobs.push(job);
        }

        reset() {
            this.lastRun = null;
        }

        run() {
            return Promise.all(
                this.jobs.map((job) => {
                    try {
                        return job.run();
                    } catch (ex) {
                        throw new Error('Error running poller task job: ' + ex.message);
                    }
                }));
        }
    }

    class Poller {
        constructor(config) {
            config = config || {};
            this.running = false;
            this.task = config.task || null;
            this.currentPoll = {
                id: null,
                timer: null,
                cancelled: false
            };
            this.lastId = 0;
        }

        addTask(task) {
            this.task = task;
        }

        nextId() {
            this.lastId += 1;
            return this.lastId;
        }

        start() {
            if (!this.task) {
                throw new Error('No task defined for this poller');
            }
            this.task.reset();
            this.running = true;
            if (this.task.runInitially) {
                if (this.task.doContinue) {
                    if (!this.task.doContinue()) {
                        stop();
                        return;
                    }
                }
                this.runTask()
                    .then(() => {
                        this.poll();
                    });
            } else {
                this.poll();
            }
        }

        stop() {
            this.running = false;
        }

        timestamp() {
            return new Date().toLocaleString();
        }

        runTask() {
            return this.task.run()
                .catch((err) => {
                    console.error(this.timestamp() + ': Error while running task', err);
                })
                .finally(() => {
                    // console.log(timestamp() + ': ran task in ' + (new Date().getTime() - start) + 'ms');
                });
        }

        poll() {
            // If we aren't polling at all, ignore.
            if (!this.running) {
                return;
            }

            // If called when a poll is already waiting, just ignore.
            // The proper way is to cancel the original one.
            if (this.currentPoll.timer) {
                return;
            }

            // This is the global current poll. It can be touched during cancellation
            // to signal to the timer which has captured it to halt.
            this.currentPoll = {
                timer: null,
                id: this.nextId(),
                cancelled: false
            };

            this.currentPoll.timer = window.setTimeout(() => {
                // Store a private reference so new pollers don't interfere if they are
                // created while we are still running.
                const thisPoll = this.currentPoll;
                if (thisPoll.cancelled) {
                    // don't do it!
                    console.warn('poll cancelled! ' + thisPoll.id);
                }
                if (this.task.doContinue) {
                    if (!this.task.doContinue()) {
                        this.stop();
                        return;
                    }
                }
                this.runTask()
                    .finally(() => {
                        thisPoll.timer = null;
                        this.poll();
                    });
            }, this.task.getInterval());
        }

        cancelCurrentPoll() {
            if (this.currentPoll.timer) {
                window.clearTimeout(this.currentPoll.timer);
                this.currentPoll.timer = null;
                this.currentPoll.cancelled = true;
            }
        }

        force() {
            if (!this.running) {
                this.running = true;
            } else {
                this.cancelCurrentPoll();
            }
            this.runTask()
                .then(() => {
                    this.poll();
                });
        }

        restart() {
            if (!this.running) {
                this.running = true;
            } else {
                this.cancelCurrentPoll();
            }
            this.poll();
        }

        update(config) {
            if (config.interval) {
                if (config.interval !== this.task.getInterval()) {
                    this.task.setInterval(config.interval);
                    this.restart();
                }
            }
        }
    }

    function makePoller(arg) {
        class MyJob extends Job {
            constructor() {
                super({
                    description: arg.description
                });
            }
            run() {
                arg.fun();
            }
        }
        const job = new MyJob();
        const task = new Task({
            interval: arg.interval
        });
        task.addJob(job);
        const poller = new Poller({
            task: task
        });
        return poller;
    }
    return {Poller, Task, Job, makePoller};
});
