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
            dontShowBackButton: false
        },

        // main panel, elements, clients, and data
        catalog: null,
        njs: null,

        $mainPanel: null,
        $loadingPanel: null,
        $basicStatsDiv: null,

        allStats: null,
        queueStats: null,
        jobStats: null,
        userJobStatsPositions: null,
        jobStatsCreated: null,
        username: null,

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

            if (self.username == null) {
                self.renderUnauthenticated();
                loadingCalls = [];
            }

            // when we have it all, then render the list
            Promise.all(loadingCalls).then(function () {
                self.render();
                self.hideLoading();
            });

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
            if (self.username) {
                self.renderQueueStats();
                self.renderJobStats(true);
                self.renderJobStats(false);
                //Here is the fix for breaking, I can't figure out otherwise how to prevent wrapping
                //$('th.ui-resizable').css('min-width','145px');

            }

        },


        renderUnauthenticated: function (singleUserMode) {
            var self = this;
            self.$basicStatsDiv.append($('<h3>').text('You must be logged in to view queue and jobs information.\n'));
        },


        getPersonalHeaders: function () {
            return [
                {text: 'Username', id: 'AcctGroup', isSortable: true},
                {text: 'KBase Job UUID', id: 'id', isSortable: true},
                {text: 'Job ID', id: 'ClusterId', isSortable: true},
                {text: 'kb_app_id', id: 'kb_app_id', isSortable: true},
                {text: 'Submission Time', id: 'QDateHuman', isSortable: true},
                {text: 'Job Status', id: 'JobStatusHuman', isSortable: true},
                {text: '# Jobs Ahead', id: 'JobsAhead', isSortable: true},
                {text: 'Queue', id: 'CLIENTGROUP', isSortable: true},
                {text: 'Possible Issues *', id: 'LastRejMatchReason', isSortable: true}
            ];
        },

        getAllHeaders: function () {
            var self = this;
            var allHeaders = [
                {text: 'Username', id: 'AcctGroup', isSortable: true},
                {text: 'kb_app_id', id: 'kb_app_id', isSortable: true},
                {text: 'Submission Time', id: 'QDateHuman', isSortable: true},
                {text: 'Queue', id: 'CLIENTGROUP', isSortable: true},
                {text: 'Job Status', id: 'JobStatusHuman', isSortable: true},
                {text: '# Jobs Ahead', id: 'JobsAhead', isSortable: true},

            ];

            //See all jobs as Admin
            if (self.isAdmin) {
                allHeaders.splice(1, 0, {text: 'KBase Job UUID', id: 'id', isSortable: true});
                allHeaders.splice(2, 0, {text: 'Job ID', id: 'ClusterId', isSortable: true});
                allHeaders.splice(allHeaders.length, 0, {text: 'RemoteHost', id: 'RemoteHost', isSortable: true});
                allHeaders.splice(allHeaders.length, 0, {
                    text: 'Possible Issues *',
                    id: 'LastRejMatchReason',
                    isSortable: true
                });
            }
            return allHeaders;
        },

        authenticated: function (singleUserMode) {
            var self = this;
            var authenticated = true;
            if (self.jobStats == null) {
                self.$basicStatsDiv.append($('<p>').addClass('label label-warning').text('Queue status not available.').css('font-size', 'large'));
                self.$basicStatsDiv.append($('<hr>'));
                authenticated = false;
            }
            if (singleUserMode && !self.userJobStatsPositions.length) {
                self.$basicStatsDiv.append($('<p>').addClass('label label-danger').text('You have no queued or running jobs.').css('font-size', 'large'));
                self.$basicStatsDiv.append($('<hr>'));
                authenticated = false;
            }
            return authenticated;
        },


        //This function is used to render queue stats from the condor_status service
        renderJobStats: function (singleUserMode) {
            var self = this;
            if (!self.authenticated(singleUserMode)) return;

            var $basicJobStatsContainer = $('<div>').css('width', '100%');
            //Headers for single user mode, and for seeing all jobs
            var basicJobStatsConfig = {
                rowsPerPage: 50,
                headers: singleUserMode ? self.getPersonalHeaders() : self.getAllHeaders()
            };

            var jobStats = self.jobStats;
            if (singleUserMode) {
                jobStats = [];
                for (var i in self.userJobStatsPositions) {
                    jobStats.push(self.jobStats[self.userJobStatsPositions[i]]);
                }
            }
            //Dont show regular users held jobs, it's not private, just not useful
            if(!singleUserMode  && !self.isAdmin ){
                jobStats = jobStats.filter(function(row){
                    return row['JobStatus'] !== '5';
                })
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
            var title = 'All Jobs (Last updated ' + self.jobStatsCreated + ')';
            if (singleUserMode)
                title = 'Job Status for <' + self.username + '> (Last updated ' + self.jobStatsCreated + ')'

            var $refreshButton = self.getRefreshButton();

            var row = $('<div>').addClass('row').append($('<div>').addClass('col-md-10').append($('<h2>').text(title + ' ').append($refreshButton)))
            if (self.options.appendJobStatusTable) {
                self.$basicStatsDiv.append(row.append($basicJobStatsContainer));
            }
            self.$basicStatsDiv.append($('<hr>'));
        },

        //TODO BREAK INTO SMALLER FUNCTIONS ONCE FUNCTIONALITY AND LOOK IS APPROVED
        //TODO MAYBE MOVE QUEUE NAME LOGIC INTO ANOTHER ENDPOINT or CONFIG FILE OR INTO THE SERVICE
        //This function is used to render queue stats from the condor_status service
        //CREATE  OWN CSS <TH> CLASS?


        animateQueueStatus: function () {
            $('.progress-bar').each(function () {
                var $element = $(this);
                var current_value = $element.attr('aria-valuenow');
                $element.animate({
                    width: current_value + '%'
                }, 1);
            });
        },

        getQueues: function () {
            var self = this;

            var available_queues = [];
            var unavailable_queues = [];

            var queue_names_clean = {
                'kb_upload': 'Data Import Queue',
                'njs': 'Normal Queue',
                'bigmem': 'Large Memory Queue',
                'bigmemlong': 'Very Large Memory Queue'
            };


            self.queueStats.forEach(function (item) {
                var row = $('<tr>');
                var usedFraction = '(' + item.used_slots + '/' + item.total_slots + ')';
                var utilizationPercentage = (item.used_slots / item.total_slots);
                var utilizationMsg = ' ' + ((item.used_slots / item.total_slots) * 100).toFixed(0) + '%  ' + usedFraction;

                var queue_name = queue_names_clean[item.id] || 'Experimental Queue';
                var queue_name_full = $('<p>').text(queue_name).css({'font-size': 'medium', 'font-weight': 'bold'});
                var queue_name_sub = $('<p>').text('(' + item.id + ')').css('font-size', 'small');
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
                    .width(0 * 100 + '%')
                    .append(message);

                if (item.used_slots === undefined || item.total_slots === undefined || usedFraction === '(0/0)') {
                    progressBar.text('Resource Unavailable')
                        .width('100%')
                        .addClass('progress-bar-danger')
                        .css('font-size', 'medium')
                    available = false;
                }

                if (queue_name === 'Experimental Queue')
                    available = false;

                var progress = $('<div>').addClass('progress active').append(progressBar).height('30px');
                custom.append(progress);
                row.append([queue_name_combined, custom, queued,]);
                if (self.isAdmin)
                    row.append(held)

                if (available)
                    available_queues.push(row);
                else
                    unavailable_queues.push(row);
            });
            return [available_queues, unavailable_queues];
        },


        getRefreshButton: function () {
            var self = this;
             return $('<button>')
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

        },

        getCollapseButton: function () {
            var collapseButton = $('<button>').addClass('btn').addClass('btn-info').text('Show other queues');
            collapseButton.attr('data-target', '#demo');
            collapseButton.attr('data-toggle', 'collapse');
            return collapseButton;
        },

        getQueueStatusTables: function () {
            var self = this;

            var normal_table = $('<table>').css('table-layout', 'fixed').addClass('table').attr('style', 'font-size: medium !important');
            normal_table.append($('<th>').text('Queue Name').width('250px').css('font-size', 'large'))
                .append($('<th>').text('Utilization (Used/Available)').width('400px').css('font-size', 'large'))
                .append($('<th>').text('# Queued').width('250px').css('font-size', 'large'))

            if (self.isAdmin)
                normal_table.append($('<th>').text('# Held').width('250px').css('font-size', 'large'))

            var experimental_table = $('<table>').css('table-layout', 'fixed').addClass('table').attr('style', 'font-size: medium !important');
            experimental_table.append($('<th>').text('Experimental Queues ').width('250px').css('font-size', 'large'))
                .append($('<th>').text('Utilization Percentage (Used/Available)').width('400px').css('font-size', 'large'))
                .append($('<th>').text('# Queued').width('250px').css('font-size', 'large'));

            if (self.isAdmin)
                experimental_table.append($('<th>').text('# Held').width('250px').css('font-size', 'large'))


            return {'normal_table': normal_table, 'experimental_table': experimental_table};
        },

        //Render the queue status tables, depending on whether or not the queues are available or not
        //TODO Maybe add a collapse button
        renderQueueStats: function () {
            var self = this;
            if (self.queueStats == null) {
                console.log('Queue stats not found');
                return;
            }

            // prep the container + data for basic stats
            var $basicQueueStatsContainer = $('<div>').css('width', '100%');
            var qst = self.getQueueStatusTables()
            var normal_table = qst.normal_table;
            var experimental_table = qst.experimental_table;

            var queues = self.getQueues();
            var available_queues = queues[0];
            var unavailable_queues = queues[1];

            normal_table.append(available_queues);
            experimental_table.attr('id', 'demo');
            experimental_table.append(unavailable_queues);

            var $refreshButton = self.getRefreshButton();
            $basicQueueStatsContainer.append(normal_table);
            $basicQueueStatsContainer.append(experimental_table);

            var queue_title = $('<h2>').text('Overview of the KBase Job Queue ')
            var $container = $('<div>')//.addClass('container-fluid')
                .append($('<div>').addClass('row')
                    .append($('<div>').addClass('col-md-11')
                        .append(queue_title.append($refreshButton))
                        .append('<h6>Last updated: ' + self.jobStatsCreated + '. Learn more about our queues  <a href=\'https://kbase.github.io/kb_sdk_docs/references/execution_engine.html\'>here</a></h6>')
                    )
                )
                .append($('<div>').addClass('row')
                    .append($('<div>').addClass('col-md-12').append($basicQueueStatsContainer)));

            if (self.options.appendQueueStatusTable) {
                self.$basicStatsDiv.append($container);
            }
            self.$basicStatsDiv.append($('<hr>'));
            self.animateQueueStatus();
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
            var self = this;
            var $mainPanel = $('<div>').addClass('container-fluid');


            if (!self.options.dontShowBackButton) {
                $mainPanel.append($('<div>').addClass('kbcb-back-link')
                    .append($('<a href=\'#catalog\'>').append('<i class=\'fa fa-chevron-left\'></i> back to the Catalog Index')));
            }


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

        //Collect the queue status data from the condor status service
        getQueueStatus: function () {

            function compare(a, b) {
                if (a.id.toString() < b.id.toString())
                    return -1;
                if (a.id.toString() > b.id.toString())
                    return 1;
                return 0;
            }

            var self = this;

            if (self.username == null)
                return;

            return self.condor_statsClient.callFunc('queue_status', [{}])
                .then(function (data) {
                    self.queueStats = [];
                    data = data[0];
                    if (data) {
                        $.each(data, function (key, value) {
                            if (jQuery.type(value) === 'object') {
                                value.id = key;
                                for (var k in value) {
                                    //Fix for zero values not being rendered as a numeric type
                                    // value[k] = value[k].toString();
                                }
                                if (key !== 'unknown')
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
            if (jobStatus === 'Running')
                return '<span class=\'label label-success\'>Running</span>';
            else if (jobStatus === 'Held')
                return '<span class=\'label label-danger\'>Held</span>';
            return '<span class=\'label label-warning\'>Queued</span>';
        },

        getJobStats: function () {
            var self = this;
            if (self.username == null)
                return;

            return self.condor_statsClient.callFunc('job_status', [{}])
                .then(function (data) {
                    self.jobStats = [];
                    self.userJobStatsPositions = [];

                    self.jobStatsCreated = new Date((data[0].created) + ' UTC').toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    var rows = data[0].rows;
                    var row_count = 0

                    if (rows) {
                        $.each(rows, function (key, value) {

                            if (jQuery.type(value) === 'object') {
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
                                    if (k === 'JobStatusHuman') {
                                        value[k] = self.labelJob(value[k]);
                                    }
                                    if (k === 'QDateHuman') {
                                        value['QDateHuman'] = new Date((value[k]) + ' UTC').toLocaleString();
                                    }
                                    //TODO MOVE THIS INTO THE SERVICE MAYBE
                                    if (k === 'JobsAhead') {
                                        var jh = value['JobsAhead'];
                                        if (jh != '0')
                                            value['JobsAhead'] = jh + ' (' + value['CLIENTGROUP'] + ')';

                                    }
                                    //Sometimes kb_app_id is null
                                    if (k === 'kb_app_id') {
                                        if (value[k] === 'null') {
                                            value[k] += '(' + value['kb_function_name'] + ')';
                                        }
                                    }

                                }
                                if (value['AcctGroup'] === self.username) {
                                    self.userJobStatsPositions.push(row_count);
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


        checkIsAdmin: function () {
            var self = this;
            self.isAdmin = false

            var me = self.runtime.service('session').getUsername();
            self.username = me;
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
