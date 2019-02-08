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
            self.renderJobStats();

        },

        //This function is used to render queue stats from the condor_status service
        renderJobStats: function () {
            var self = this;
            // prep the container + data for basic stats
            var $basicJobStatsContainer = $('<div>').css('width', '100%');


            var basicJobStatsConfig = {
                rowsPerPage: 50,
                headers: [
                    {text: 'Username', id: 'AcctGroup', isSortable: true},
                    {text: 'Job UUID', id: 'id', isSortable: true},
                    {text: 'Job ID', id: 'ClusterId', isSortable: true},
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

            if (self.isAdmin) {
                basicJobStatsConfig.headers.push({
                    text: 'Possible Issues *',
                    id: 'LastRejMatchReason',
                    isSortable: true
                });
            }


            var queueStatsRestructuredRows = self.restructureRows(basicJobStatsConfig, self.jobStats);

            new DynamicTable($basicJobStatsContainer,
                {
                    headers: basicJobStatsConfig.headers,
                    rowsPerPage: basicJobStatsConfig.rowsPerPage,
                    enableDownload: self.isAdmin,
                    updateFunction: self.createDynamicUpdateFunction(basicJobStatsConfig, queueStatsRestructuredRows)
                }
            );

            var title;
            if (self.isAdmin) {
                title = "Jobs Status (Administrator): Queue Data Current as of  " + self.jobStatsCreated;
            }
            else {
                title = "Jobs Status <" + self.me + ">: Queue Data Current as of " + self.jobStatsCreated;

            }

            //This is probably a blocking operation?
            var $jqElem = $('<button>')
                .addClass('btn btn-default')
                .on('click', function (e) {

                // get the module information
                var loadingCalls = [];

                self.showLoading();

                 // self.$mainPanel.remove();
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


           var row =  $('<div>').addClass('row').append($('<div>').addClass('col-md-11').append('<h4>' + title + '</h4>'));
           row.append($('<div>').addClass('col-md-1').append($jqElem));








            var $container = $('<div>').addClass('container-fluid')
                .append(row)
                .append($basicJobStatsContainer);



            if (self.options.appendJobStatusTable) {
                self.$basicStatsDiv.append($container);
            }
        },


        //This function is used to render queue stats from the condor_status service
        renderQueueStats: function () {
            var self = this;
            // prep the container + data for basic stats
            var $basicQueueStatsContainer = $('<div>').css('width', '70%');

            var table = $('<table>').addClass('table table-striped table-bordered');
            var headers = ['Queue Name', 'Utilization %', "# Held", '# Queued']

            for (var i = 0; i < 4; i++) {
                var row = $('<th>').addClass('ui-resizeable').text(headers[i]);
                table.append(row);
            }


            self.queueStats.forEach(function (item) {
                var row = $('<tr>');
                var usedFraction = "(" + item.used_slots + "/" + item.total_slots + ")";
                var utilizationPercentage = (item.used_slots / item.total_slots)
                var utilizationMsg = " " + (item.used_slots / item.total_slots) + "%  " + usedFraction;

                var queue_name = $('<td>').addClass('bar').text(item.id);

                var utilization = $('<td>').text(utilizationMsg);
                if (utilizationPercentage < .60)
                    utilization.addClass('label-success')
                else if (utilizationPercentage < 1)
                    utilization.addClass('label-warning')
                else
                    utilization = $('<td>').addClass('label-danger').text("100% " + usedFraction);

                if (item.used_slots === undefined || item.total_slots === undefined)
                    utilization = $('<td>').addClass('label-danger').text("Queue unavailable");


                var queued = $('<td>').text(item.Held);
                var held = $('<td>').text(item.Idle);
                row.append([queue_name, utilization, queued, held]);


                table.append(row);
            });


            $basicQueueStatsContainer.append(table);


            var $container = $('<div>').addClass('container-fluid')
                .append($('<div>').addClass('row')
                    .append($('<div>').addClass('col-md-12')
                        .append('<h4>Queue Status:</h4>')
                        .append($basicQueueStatsContainer)));


            if (self.options.appendQueueStatusTable) {
                self.$basicStatsDiv.append($container);
            }


            //
            // var basicQueueStatsConfig = {
            //     rowsPerPage: 50,
            //     headers: [
            //         {text: 'Queue Name', id: 'id', isSortable: true},
            //         {text: 'Free Slots', id: 'free_slots', isSortable: true},
            //         {text: 'Total Slots', id: 'total_slots', isSortable: true},
            //         {text: 'Used Slots', id: 'used_slots', isSortable: true},
            //         {text: 'Held', id: 'Held', isSortable: true},
            //         {text: 'Running', id: 'Running', isSortable: true},
            //         {text: 'Queued', id: 'Idle', isSortable: true},
            //
            //     ],
            // };
            //
            // var queueStatsRestructuredRows = self.restructureRows(basicQueueStatsConfig, self.queueStats);
            //
            // new DynamicTable($basicQueueStatsContainer,
            //     {
            //         headers: basicQueueStatsConfig.headers,
            //         rowsPerPage: basicQueueStatsConfig.rowsPerPage,
            //         enableDownload: false,
            //         updateFunction: self.createDynamicUpdateFunction(basicQueueStatsConfig, queueStatsRestructuredRows)
            //     }
            // );
            //
            //
            // var $container = $('<div>').addClass('container-fluid')
            //     .append($('<div>').addClass('row')
            //         .append($('<div>').addClass('col-md-12')
            //             .append('<h4>Condor Queue Status:</h4>')
            //             .append($basicQueueStatsContainer)));
            //
            // if (self.options.appendQueueStatusTable) {
            //     self.$basicStatsDiv.append($container);
            // }
            //
            // var $basicQueueStatsContainer2 = $('<div>').css('width', '100%');


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

                    self.jobStatsCreated = new Date((data[0].created) + " UTC").toLocaleString();

                    var rows = data[0].rows;
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
                                if (k == "JobStatusHuman") {
                                    value[k] = self.labelJob(value[k]);
                                }
                                if (k == "QDateHuman") {
                                    value['QDateHuman'] = new Date((value[k])).toLocaleString();
                                    ;
                                }
                                //TODO MOVE THIS INTO THE SERVICE MAYBE
                                if (k == "JobsAhead") {
                                    var jh = value['JobsAhead'];
                                    if (jh != '0')
                                        value['JobsAhead'] = jh + " (" + value['CLIENTGROUP'] + ")";
                                    ;
                                }

                            }


                            self.jobStats.push(value);
                        }
                    });
                })
                .catch(function (err) {
                    console.error('ERROR retrieving condor job stats:');
                    console.error(err);
                });
        },

        checkIsAdmin: function () {
            var self = this;
            self.isAdmin = true;

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
