define([
    'jquery',
    'bluebird',
    'kb_service/client/catalog',
    'kb_service/client/narrativeJobService',
    '../catalog_util',
    'kb_common/dynamicTable',
    'kb_common/jsonRpc/dynamicServiceClient',
    'datatables',
    'kb_widget/legacy/authenticatedWidget',
    'bootstrap',
    'datatables_bootstrap',


], function ($,
             Promise,
             Catalog,
             NarrativeJobService,
             CatalogUtil,
             DynamicTable,
             DynamicService) {
    'use strict';
    return $.KBWidget({
        name: 'KBaseCatalogQueue',
        parent: 'kbaseAuthenticatedWidget', // todo: do we still need th
        options: {

            appendQueueStatusTable: true,
            appendJobStatusTable: true,
        },

        // clients to the catalog service and the NarrativeMethodStore
        catalog: null,
        njs: null,

        // main panel and elements
        $mainPanel: null,
        $loadingPanel: null,
        $basicStatsDiv: null,

        allStats: null,
        queueStats: null,
        jobStats: null,
        myJobStats: null,
        jobStatsCreated: null,
        me: null,

        adminStats: null,

        init: function (options) {
            this._super(options);

            var self = this;

            // new style we have a runtime object that gives us everything in the options
            self.runtime = options.runtime;
            self.setupClients();

            // initialize and add the main panel
            self.$loadingPanel = self.initLoadingPanel();
            self.$elem.append(self.$loadingPanel);

            var mainPanelElements = self.initMainPanel();
            self.$mainPanel = mainPanelElements[0];
            self.$basicStatsDiv = mainPanelElements[1];
            self.$elem.append(self.$mainPanel);
            self.showLoading();

            // get the module information
            var loadingCalls = [];
            loadingCalls.push(self.checkIsAdmin());
            loadingCalls.push(self.getQueueStatus());
            loadingCalls.push(self.getJobStats());

            // when we have it all, then render the list
            Promise.all(loadingCalls).then(function () {
                self.render();
                self.hideLoading();
            });

            self.adminRecentRuns = [];

            return this;
        },

        /*
              I feel like I'm using the kbase dynamicTable widget wrong. This'll produce an update function for each of the 3 tables which are used
              on the page, and also dynamically make a new update function for the admin stats as we change the filtering range. Presumably, that step
              isn't required and there's a way to just bake a single updateFunction and call it for everything, given a little bit of config info.
            */
        createDynamicUpdateFunction: function (config, rows) {

            return function (pageNum, query, sortColId, sortColDir) {

                var reducedRows = rows;

                if (query) {
                    query = query.replace(/ /g, '|');
                    reducedRows = reducedRows.filter(function (row) {
                        return row.query.match(query);
                    });
                }

                if (sortColId) {

                    var sortIdx = config.headers.reduce(function (acc, curr, idx) {
                        if (curr.id === sortColId) {
                            acc = idx;
                        }
                        return acc;
                    }, 0);

                    reducedRows = reducedRows
                        .sort(function (a, b) {

                            var aX = sortColDir === -1 ? b[sortIdx] : a[sortIdx];
                            var bX = sortColDir === -1 ? a[sortIdx] : b[sortIdx];

                            if (!$.isNumeric(aX)) {
                                aX = aX.toString().toLowerCase();
                            }
                            if (!$.isNumeric(bX)) {
                                bX = bX.toString().toLowerCase();
                            }

                            if (aX < bX) {
                                return -1;
                            }
                            else if (aX > bX) {
                                return 1;
                            }
                            else {
                                return 0;
                            }

                        })
                    ;
                }

                reducedRows = reducedRows.slice(pageNum * config.rowsPerPage, (pageNum + 1) * config.rowsPerPage);

                return Promise.try(function () {
                    return {
                        rows: reducedRows,
                        start: pageNum * config.rowsPerPage,
                        query: query,
                        total: rows.length,
                    };
                });
            };

        },

        // this just takes the rows that come back from the various stats methods and reformats them into the arrays of arrays that dynamicTable likes.
        restructureRows: function (config, rows) {
            if (!rows) {
                return [];
            }
            return rows.map(function (row) {
                var rowArray = [];
                config.headers.forEach(function (header) {
                    rowArray.push(row[header.id] || '');
                });
                rowArray.query = rowArray.join(',');
                return rowArray;
            });
        },

        /* takes a timestamp and turns it into a locale string. If no timestamp is present, then it'll put in ...
               atm, the only place this should happen is the finish_time on an unfinished job. */
        reformatDateInTD: function ($td) {
            var timestamp = parseInt($td.text(), 10);
            if (Number.isNaN(timestamp)) {
                $td.text('-');
            } else {
                var date = new Date(timestamp).toLocaleString();
                $td.text(date);
            }
        },

        reformatIntervalInTD: function ($td) {
            var timestamp = parseInt($td.text(), 10) / 1000;
            if (Number.isNaN(timestamp)) {
                $td.text('-');
            } else {
                $td.text(this.getNiceDuration(timestamp));
            }
        },

        render: function () {

            var self = this;
            self.renderQueueStats();

            self.renderJobStats(self.me);
            self.renderJobStats();


        },


        animate: function (div_id, percentage) {

            var interval = setInterval(function () {
                myTimer()
            }, 1);
            var count = 0;

            function myTimer() {
                if (count < 100) {
                    $('.progress').css('width', count + "%");
                    count += 0.8;

                    // code to do when loading
                }
                else if (count > 99) {
                    document.getElementById(div_id).innerHTML = percentage + "%";
                    clearInterval(interval);
                }
            }


        },


        //This function is used to render queue stats from the condor_status service
        renderJobStats: function (me) {
            var self = this;

            if (self.jobStats == null) {
                var $basicJobStatsContainer = $('<div>').css('width', '100%');
                console.log("Job stats not found");

                var $container = $('<div>')//.addClass('container-fluid')
                    .append(row)
                    .append($basicJobStatsContainer);


                if (self.options.appendJobStatusTable) {
                    self.$basicStatsDiv.append("<h4>Queue status currently unavailable</h4>");
                }

                return;

            }


            // var imp = "<script src='https://rawgit.com/kimmobrunfeldt/progressbar.js/master/dist/progressbar.js'></script>";
            // prep the container + data for basic stats

            var $basicJobStatsContainer = $('<div>').css('width', '100%');
            // $basicJobStatsContainer.append(imp);


            var basicJobStatsConfig = {
                rowsPerPage: 50,
                headers: [
                    {text: 'Username', id: 'AcctGroup', isSortable: true,},
                    {text: 'KBase Job UUID', id: 'id', isSortable: true},
                    {text: 'Job ID', id: 'ClusterId', isSortable: true, isResizeable: false},
                    {text: 'kb_app_id', id: 'kb_app_id', isSortable: true},
                    // {text: 'kb_function_name', id: 'kb_function_name', isSortable: true},
                    // {text: 'kb_module_name', id: 'kb_module_name', isSortable: true},
                    {text: 'RemoteHost', id: 'RemoteHost', isSortable: true},
                    {text: 'Submission Time', id: 'QDateHuman', isSortable: true},
                    {text: 'Job Status', id: 'JobStatusHuman', isSortable: true},
                    {text: '# Jobs Ahead', id: 'JobsAhead', isSortable: true},
                    {text: 'Queue', id: 'CLIENTGROUP', isSortable: true},
                ],
            };

            // if (self.isAdmin) {
            basicJobStatsConfig.headers.push({
                text: 'Possible Issues *',
                id: 'LastRejMatchReason',
                isSortable: true
            });
            // }

            var jobStats = [];
            if (me) {
                for (var i in self.myJobStats) {
                    jobStats.push(self.jobStats[self.myJobStats[i]]);
                }
            }
            else {
                jobStats = self.jobStats;
            }


            var queueStatsRestructuredRows = self.restructureRows(basicJobStatsConfig, jobStats);

            new DynamicTable($basicJobStatsContainer,
                {
                    headers: basicJobStatsConfig.headers,
                    rowsPerPage: basicJobStatsConfig.rowsPerPage,
                    enableDownload: self.isAdmin,
                    updateFunction: self.createDynamicUpdateFunction(basicJobStatsConfig, queueStatsRestructuredRows)
                }
            );

            var title;
            if (me)
                title = "My Personal Job Stats (Last updated " + self.jobStatsCreated + ")"
            else
                title = "All Job Stats (Last updated " + self.jobStatsCreated + ")"


            //This is probably a blocking operation?
            var $refreshButton = $('<button>')
                .addClass('btn btn-default')
                .on('click', function (e) {
                    var loadingCalls = [];
                    self.showLoading();
                    self.$basicStatsDiv.empty();
                    loadingCalls.push(self.getQueueStatus());
                    loadingCalls.push(self.getJobStats());
                    // when we have it all, then render the list
                    Promise.all(loadingCalls).then(function () {
                        self.render();
                        self.hideLoading();
                    });

                })
                .attr('title', 'Refresh jobs data')
                .append($.jqElem('i').addClass('fa fa-refresh'));


            var row = $('<div>').addClass('row').append($('<div>').addClass('col-md-10').append($('<h4>').text(title + " ").append($refreshButton)))

            //
            // row.append($('<div>').addClass('col-md-1').append($refreshButton));


            // var $container = $('<div>').addClass('container-fluid')
            //     .append(row)
            //     .append($basicJobStatsContainer);


            if (self.options.appendJobStatusTable) {
                self.$basicStatsDiv.append(row.append($basicJobStatsContainer));
            }
        },

        //TODO BREAK INTO SMALLER FUNCTIONS ONCE FUNCTIONALITY AND LOOK IS APPROVED
        //TODO MAYBE MOVE QUEUE NAME LOGIC INTO ANOTHER ENDPOINT or CONFIG FILE OR INTO THE SERVICE


        //This function is used to render queue stats from the condor_status service
        renderQueueStats: function () {
            var self = this;

            if (self.queueStats == null) {
                console.log("Queue stats not found");
                return;
            }


            // prep the container + data for basic stats
            var $basicQueueStatsContainer = $('<div>').css('width', '100%');

            var table = $('<table>').css('table-layout', 'fixed').addClass('table').attr('style', 'font-size: medium !important');

            // var table = $('<table>').addClass('table table-striped table-bordered');

            var headers = ['Queue Name', "# Held", '# Queued', 'Utilization Percentage']

            //TODO PUT THIS IN CSS CLASS
            table
                .append($('<th>').text('Queue Name').width('250px').css('font-size', 'x-large'))
                .append($('<th>').text('Utilization Percentage').width('400px').css('font-size', 'x-large'))
                .append($('<th>').text('# Queued').width('250px').css('font-size', 'x-large'))

            if (self.isAdmin)
                table.append($('<th>').text('# Held').width('250px').css('font-size', 'x-large'))


            var available_rows = [];
            var unavailable_rows = [];


            var queue_names_clean = {
                'kb_upload': "Data Import Queue",
                'njs': "Normal Queue",
                'bigmem': 'Large Memory Queue',
                'bigmemlong': 'Very Large Memory Queue'
            }

            self.queueStats.forEach(function (item) {
                var row = $('<tr>');
                var usedFraction = "(" + item.used_slots + "/" + item.total_slots + ")";
                var utilizationPercentage = (item.used_slots / item.total_slots);
                var utilizationMsg = " " + ((item.used_slots / item.total_slots) * 100).toFixed(0) + "%  " + usedFraction;

                // var queue_name = | (Experimental Queue)"
                // if(queue_names_clean[item.id])
                //     queue_name = item.id + " (" + queue_names_clean[item.id] + ")";


                var queue_name = queue_names_clean[item.id] || 'Experimental Queue';

                var queue_name_full = $('<p>').text(queue_name).css({'font-size': 'medium', 'font-weight': 'bold'});
                var queue_name_sub = $('<p>').text("(" + item.id + ")").css('font-size', 'small');

                var queue_name_combined = $('<td>').append(queue_name_full).append(queue_name_sub);


                var queued = $('<td>').text(item.Idle);
                var held = $('<td>').text(item.Held);

                var custom = $('<td>');
                var message = $('<span>').text(utilizationMsg).css('font-size', 'medium').css('padding', '5px').css('text-shadow', '2px 2px 10px #000000');
                //.css('text-align','center').css('position', 'absolute');


                var available = true;

                var color = 'progress-bar-success';

                if (utilizationPercentage === 1)
                    color = 'progress-bar-danger';
                else if (utilizationPercentage > .6)
                    color = 'progress-bar-warning';

                //Fix formatting
                if (utilizationPercentage !== 1)
                    message.css('position', 'absolute');


                if (utilizationPercentage === 0)
                    message.css('color', 'black');


                var progressBar = $('<div>').addClass('progress-bar').addClass(color)

                    .attr('role', 'progressbar')
                    .attr('aria-valuenow', utilizationPercentage * 100)
                    .attr('aria-valuemin', '0')
                    .attr('aria-valuemax', '100')
                    .css('text-shadow', '1px 1px 2px #000000')
                    .width(utilizationPercentage * 100 + "%")
                    .append(message);

                if (item.used_slots === undefined || item.total_slots === undefined || usedFraction === "(0/0)") {
                    progressBar.text("Resource Unavailable")
                        .width("100%")
                        .addClass('progress-bar-danger')
                        .css('font-size', 'medium')
                    available = false;
                }

                if (queue_name === 'Experimental Queue')
                    available = false;


                var progress = $('<div>').addClass('progress').append(progressBar).height('30px');
                custom.append(progress);
                row.append([queue_name_combined, custom, queued,]);
                if (self.isAdmin)
                    row.append(held)

                if (available)
                    available_rows.push(row);
                else
                    unavailable_rows.push(row);
            });


            for (var row in available_rows)
                table.append(available_rows[row]);


            var table2 = $('<table>').css('table-layout', 'fixed').addClass('table').attr('style', 'font-size: medium !important');
            table2
                .append($('<th>').text('Experimental Queues ').width('250px').css('font-size', 'x-large'))
                .append($('<th>').text('Utilization Percentage').width('400px').css('font-size', 'x-large'))
                .append($('<th>').text('# Queued').width('250px').css('font-size', 'x-large'))
                .append($('<th>').text('# Held').width('250px').css('font-size', 'x-large')
                );
            table2.attr('id', 'demo').addClass('collapse');


            for (var row in unavailable_rows)
                table2.append(unavailable_rows[row]);


            var animationInterval = setInterval(function () {
                myTimer()
            }, 1);
            var count = 0;

            function myTimer() {
                if (count < 100) {
                    $('.progress').css('width', count + "%");
                    count += .75;
                }
                else {
                    // clearInterval(animationInterval);
                }

            }

            //This is probably a blocking operation?
            var $refreshButton = $('<button>')
                .addClass('btn btn-default')
                .on('click', function (e) {
                    var loadingCalls = [];
                    self.showLoading();
                    self.$basicStatsDiv.empty();
                    loadingCalls.push(self.getQueueStatus());
                    loadingCalls.push(self.getJobStats());
                    // when we have it all, then render the list
                    Promise.all(loadingCalls).then(function () {
                        self.render();
                        self.hideLoading();
                    });

                })
                .attr('title', 'Refresh queue status')
                .append($.jqElem('i').addClass('fa fa-refresh'));


            var collapseButton = $("<button>").addClass('btn').addClass('btn-info').text("Show other queues");
            collapseButton.attr('data-target', '#demo');
            collapseButton.attr('data-toggle', 'collapse');


            // $basicQueueStatsContainer.append(collapseButton);
            // $basicQueueStatsContainer.append($refreshButton);
            $basicQueueStatsContainer.append(table);


            $basicQueueStatsContainer.append(table2);


            var $container = $('<div>')//.addClass('container-fluid')
                .append($('<div>').addClass('row')
                    .append($('<div>').addClass('col-md-10')

                        .append('<h2>Overview of the KBase Job Queue:</h2>')
                        .append('<h6>Last updated: ' + self.jobStatsCreated + '. Learn more about our queues  <a href="https://kbase.github.io/kb_sdk_docs/references/execution_engine.html">here</a></h6>')
                    )
                    .append($('<div>').addClass('col-md-2').append(collapseButton).append($refreshButton))
                )
                .append($('<div>').addClass('row')
                    .append($('<div>').addClass('col-md-12').append($basicQueueStatsContainer)));


            if (self.options.appendQueueStatusTable) {
                self.$basicStatsDiv.append($container);
            }


        },


        renderJobLog: function (jobId) {
            var logLine = function (lineNum, text, isError) {
                var $line = $('<div>').addClass('kblog-line');
                $line.append($('<div>').addClass('kblog-num-wrapper').append($('<div>').addClass('kblog-line-num').append(lineNum)));
                $line.append($('<div>').addClass('kblog-text').append(text));
                if (isError === 1) {
                    $line.addClass('kb-error');
                }
                return $line;
            };
            var $log = $('<div>').addClass('kbcb-log-view').append('loading logs...');
            this.njs.get_job_logs({job_id: jobId, skip_lines: 0})
                .then(function (logs) {
                    $log.empty();
                    $log.append(
                        $('<div>')
                            .append('Log for job id <b>' + jobId + '</b><hr>')
                    );
                    for (var i = 0; i < logs.lines.length; i++) {
                        $log.append(logLine(i, logs.lines[i].line, logs.lines[i].is_error));
                    }
                });
            return $log;
        },

        setupClients: function () {
            var token = this.runtime.service('session').getAuthToken();
            this.catalog = new Catalog(
                this.runtime.getConfig('services.catalog.url'), {token: token}
            );
            this.njs = new NarrativeJobService(
                this.runtime.getConfig('services.narrative_job_service.url'), {token: token}
            );

            this.condor_statsClient = new DynamicService({
                url: this.runtime.getConfig('services.service_wizard.url'),
                token: token,
                //version: 'dev',
                module: 'condor_stats',
            });

        },

        initMainPanel: function () {
            var $mainPanel = $('<div>').addClass('container-fluid');

            $mainPanel.append($('<div>').addClass('kbcb-back-link')
                .append($('<a href="#catalog">').append('<i class="fa fa-chevron-left"></i> back to the Catalog Index')));

            var $basicStatsDiv = $('<div>');
            $mainPanel.append($basicStatsDiv);

            $mainPanel.append('<br><br>');

            return [$mainPanel, $basicStatsDiv];
        },

        initLoadingPanel: function () {
            var $loadingPanel = $('<div>').addClass('kbcb-loading-panel-div');
            $loadingPanel.append($('<i>').addClass('fa fa-spinner fa-2x fa-spin'));
            return $loadingPanel;
        },

        showLoading: function () {
            var self = this;
            self.$loadingPanel.show();
            self.$mainPanel.hide();
        },
        hideLoading: function () {
            var self = this;
            self.$loadingPanel.hide();
            self.$mainPanel.show();
        },


        getQueueStatus: function () {

            function compare(a, b) {
                if (a.id.toString() < b.id.toString())
                    return -1;
                if (a.id.toString() > b.id.toString())
                    return 1;
                return 0;
            }

            var self = this;
            return self.condor_statsClient.callFunc('queue_status', [{}])
                .then(function (data) {
                    self.queueStats = [];
                    data = data[0];
                    if (data) {
                        $.each(data, function (key, value) {
                            if (jQuery.type(value) == 'object') {
                                value.id = key;
                                for (var k in value) {
                                    //Fix for zero values not being rendered as a numeric type
                                    // value[k] = value[k].toString();
                                }
                                if (key != 'unknown')
                                    self.queueStats.push(value);
                            }
                        });
                        self.queueStats = self.queueStats.sort(compare);
                    }
                })
                .catch(function (err) {
                    console.error('ERROR retrieving condor queue stats:');
                    console.error(err);
                });
        },

        labelJob: function (jobStatus) {
            if (jobStatus == 'Running') {
                return '<span class="label label-success">Running</span>';
            }
            return '<span class="label label-warning">Queued</span>';
        },

        getJobStats: function () {
            var self = this;
            return self.condor_statsClient.callFunc('job_status', [{}])
                .then(function (data) {
                    self.jobStats = [];
                    self.myJobStats = [];

                    self.jobStatsCreated = new Date((data[0].created) + " UTC").toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    var rows = data[0].rows;
                    var row_count = 0

                    if (rows) {
                        $.each(rows, function (key, value) {

                            if (jQuery.type(value) == 'object') {
                                if (value.JobBatchName)
                                    value.id = value.JobBatchName;
                                else
                                    value.id = 'unknown';

                                //Fix for zero values not being rendered as a numeric type
                                //Add formatting
                                for (var k in value) {
                                    //TODO SPEED THIS UP BY MAKING JSON A STRING IN THE SERVICE ITSELF
                                    value[k] = value[k].toString();
                                    value[k] = (value[k].length > 0) ? value[k] : '-';
                                    if (k === "JobStatusHuman") {
                                        value[k] = self.labelJob(value[k]);
                                    }
                                    if (k === "QDateHuman") {
                                        value['QDateHuman'] = new Date((value[k]) + " UTC").toLocaleString();
                                        ;
                                    }
                                    //TODO MOVE THIS INTO THE SERVICE MAYBE
                                    if (k === "JobsAhead") {
                                        var jh = value['JobsAhead'];
                                        if (jh != '0')
                                            value['JobsAhead'] = jh + " (" + value['CLIENTGROUP'] + ")";

                                    }
                                    //Sometimes kb_app_id is null
                                    if (k === 'kb_app_id') {
                                        if (value[k] === "null") {
                                            value[k] += "(" + value['kb_function_name'] + ")";
                                        }
                                    }

                                }
                                if (value['AcctGroup'] === self.me) {
                                    self.myJobStats.push(row_count);
                                    console.log("pushing" + value['AcctGroup'] + row_count);
                                }


                                self.jobStats.push(value);
                                row_count++;
                            }
                        });
                    }
                })
                .catch(function (err) {
                    console.error('ERROR retrieving condor job stats:');
                    console.error(err);
                });
        },

        getRefreshButton: function () {
            //This is probably a blocking operation?

            var self = this;

            var button = $('<button>')
                .addClass('btn btn-default')
                .on('click', function (e) {
                    var loadingCalls = [];
                    self.showLoading();
                    self.$basicStatsDiv.empty();
                    loadingCalls.push(self.getQueueStatus());
                    loadingCalls.push(self.getJobStats());
                    // when we have it all, then render the list
                    Promise.all(loadingCalls).then(function () {
                        self.render();
                        self.hideLoading();
                    });

                })
                .attr('title', 'Refresh jobs data')
                .append($.jqElem('i').addClass('fa fa-refresh'));

            return button;
        },

        checkIsAdmin: function () {
            var self = this;
            self.isAdmin = false

            var me = self.runtime.service('session').getUsername();
            self.me = me;
            return self.catalog.is_admin(me)
                .then(function (result) {
                    if (result) {
                        self.isAdmin = true;
                    }
                }).catch(function () {
                    return Promise.try(function () {
                    });
                });
        }
    });
});
