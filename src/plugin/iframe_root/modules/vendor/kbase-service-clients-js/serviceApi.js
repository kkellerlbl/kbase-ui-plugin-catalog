define([
    'bluebird',
    'kb_common/utils',
    './utils',
    './client/workspace',
    './client/userProfile',
    './client/narrativeMethodStore',
    'kb_common/jsonRpc/dynamicServiceClient',
], function (
    Promise,
    Utils,
    APIUtils,
    Workspace,
    UserProfile,
    NarrativeMethodStore,
    GenericClient
) {
    'use strict';

    function factory(config) {
        var runtime = config.runtime,
            workspaceClient = new Workspace(runtime.getConfig('services.workspace.url'), {
                token: runtime.getService('session').getAuthToken()
            }),
            userProfileClient = new UserProfile(runtime.getConfig('services.user_profile.url'), {
                token: runtime.getService('session').getAuthToken()
            }),
            narrativeMethodStoreClient = new NarrativeMethodStore(runtime.getConfig('services.narrative_method_store.url'), {
                token: runtime.getService('session').getAuthToken()
            }),
            narrativeClient = new GenericClient({
                module: 'NarrativeService',
                url: runtime.config('services.service_wizard.url'),
                token: runtime.service('session').getAuthToken()
            });

        function parseMethodId(id) {
            var parts = id.split(/\//).filter(function (part) {
                    return (part.length > 0);
                }),
                method;
            if (parts.length === 1) {
                // legacy method
                method = {
                    id: parts[0]
                };
            } else if (parts.length === 3) {
                method = {
                    module: parts[0],
                    id: parts[1],
                    commitHash: parts[2]
                };
            } else if (parts.length === 2) {
                method = {
                    module: parts[0],
                    id: parts[1]
                };
            } else {
                console.error('ERROR');
                console.error('parts');
                throw new Error('Invalid method metadata');
            }
            return method;
        }

        function getNarratives(cfg) {
            var method_map = {
                narratorial: 'list_narratorials',
                mine: 'list_narratives',
                public: 'list_narratives',
                shared: 'list_narratives',
            };

            var data_key_map = {
                narratorial: 'narratorials',
                mine: 'narratives',
                public: 'narratives',
                shared: 'narratives',
            };

            var method = method_map[cfg.params.type];
            var list_params = { type: cfg.params.type };

            return narrativeClient.callFunc(method, [list_params])
                .then(function (data) {
                    var fetchedNarratives = data[0][data_key_map[cfg.params.type]];
                    // The narrative service, for now, does not provide an option to filter out 
                    // temporary narratives. Generally we don't care about them -- they do not have a title
                    // yet, and thus are not fully-formed in terms of the workspace metadata.
                    var narratives = [];

                    for (var i = 0; i < fetchedNarratives.length; i += 1) {
                        var narrative = fetchedNarratives[i];
                        var workspace = APIUtils.workspaceInfoToObject(narrative.ws);
                        if (workspace.metadata.is_temporary === 'true') {
                            continue;
                        }

                        var object = APIUtils.object_info_to_object(narrative.nar);
                        var cellTypes = { app: 0, markdown: 0, code: 0 };
                        var apps = [];
                        var methods = [];

                        if (object.metadata) {
                            // Convert some narrative-specific metadata properties.
                            if (object.metadata.job_info) {
                                object.metadata.jobInfo = JSON.parse(object.metadata.job_info);
                            }
                            if (object.metadata.methods) {
                                object.metadata.cellInfo = JSON.parse(object.metadata.methods);
                            }

                            /* Old narrative apps and method are stored in the cell info.
                             * metadata: {
                             *    methods: {
                             *       app: {
                             *          myapp: 1,
                             *          myapp2: 1
                             *       },
                             *       method: {
                             *          mymethod: 1,
                             *          mymethod2: 1
                             *       }
                             *    }
                             * }
                             */

                            if (object.metadata.cellInfo) {
                                if (object.metadata.cellInfo.app) {
                                    Object.keys(object.metadata.cellInfo.app).forEach(function (key) {
                                        apps.push(parseMethodId(key));
                                    });
                                }
                                if (object.metadata.cellInfo.method) {
                                    Object.keys(object.metadata.cellInfo.method).forEach(function (key) {
                                        methods.push(parseMethodId(key));
                                    });
                                }
                            }

                            /* New narrative metadata is stored as a flat set of
                             * metdata: {
                             *    app.myapp: 1,
                             *    app.myotherapp: 1,
                             *    method.my_method: 1,
                             *    method.my_other_method: 1
                             * }
                             * Note that cell jupyter cell types are stored as
                             * jupyter.markdown: "n" and
                             * jupyter.code: "n"
                             * The "." is, confusingly, actually a dot in the key has
                             * for the app and method keys.
                             */
                            Object.keys(object.metadata).forEach(function (key) {
                                var keyParts = key.split('.');
                                switch (keyParts[0]) {
                                case 'method':
                                    // New style app cells have the metadata prefix set to
                                    // "method." !!
                                    apps.push(parseMethodId(keyParts[1]));
                                    cellTypes['app'] += 1;
                                    break;
                                case 'app':
                                    // Old style kbase (markdown-app) cells used "app." as the
                                    // metadata key prefix. We just treat them as regular apps
                                    // now.
                                    apps.push(parseMethodId(keyParts[1]));
                                    cellTypes['app'] += 1;
                                    break;
                                case 'ipython':
                                case 'jupyter':
                                    var cellType = keyParts[1];
                                    cellTypes[cellType] += parseInt(object.metadata[key]);
                                    break;
                                default:
                                    // console.log('REALLY?', object.metadata);
                                }
                            });
                        }

                        narratives.push({
                            workspace: workspace,
                            object: object,
                            apps: apps,
                            methods: methods,
                            cellTypes: cellTypes
                        });
                    }

                    return narratives;
                });
        }

        function getPermissions(narratives) {
            return Promise.try(function () {
                if (narratives.length === 0) {
                    return [];
                }
                var permParams = narratives.map(function (narrative) {
                        return {
                            id: narrative.workspace.id
                        };
                    }),
                    username = runtime.service('session').getUsername();
                return workspaceClient.get_permissions_mass({
                        workspaces: permParams
                    })
                    .then(function (result) {
                        var permissions = result.perms;
                        for (var i = 0; i < permissions.length; i++) {
                            var narrative = narratives[i];
                            narrative.permissions = Utils.object_to_array(permissions[i], 'username', 'permission')
                                .filter(function (x) {
                                    return !(x.username === username ||
                                        x.username === '*' ||
                                        x.username === narrative.workspace.owner);
                                })
                                .sort(function (a, b) {
                                    if (a.username < b.username) {
                                        return -1;
                                    } else if (a.username > b.username) {
                                        return 1;
                                    }
                                    return 0;
                                });
                        }
                        return narratives;
                    });
            });
        }

        function getApps() {
            return narrativeMethodStoreClient.list_apps({});
        }

        function getMethods() {
            return narrativeMethodStoreClient.list_methods({});
        }

        function getCollaborators(options) {
            var users = (options && options.users) ? options.users : [];
            users.push(runtime.getService('session').getUsername());
            return Promise.all([
                    narrativeClient.callFunc('list_narratives', [{ type: 'mine' }]),
                    narrativeClient.callFunc('list_narratives', [{ type: 'shared' }])
                ])
                .then(function (results) {
                    return results
                        .reduce(function (accum, result) {
                            return accum.concat(result[0].narratives);
                        }, [])
                        .map(function (narrative) {
                            narrative.object = APIUtils.object_info_to_object(narrative.nar);
                            narrative.workspace = APIUtils.workspaceInfoToObject(narrative.ws);
                            return narrative;
                        });
                })
                .then(function (narratives) {
                    return getPermissions(narratives);
                })
                .then(function (narratives) {
                    var collaborators = {},
                        i, perms;

                    for (i = 0; i < narratives.length; i += 1) {
                        // make sure logged in user is here
                        // make sure subject user is here
                        // I hate this crud, but there ain't no generic array search.
                        perms = narratives[i].permissions;

                        // make sure all users are either owner or in the permissions list.
                        if (users.some(function (user) {
                                return !(
                                    narratives[i].workspace.owner === user ||
                                    perms.some(function (x) {
                                        return x.username === user;
                                    })
                                );
                            })) {
                            continue;
                        }

                        // Remove participants and the public user.
                        var filtered = perms.filter(function (x) {
                            return !(
                                users.indexOf(x.username) >= 0 ||
                                x.username === '*'
                            );
                        });

                        // And what is left are all the users who are collaborating on this same narrative.
                        // okay, now we have a list of all OTHER people sharing in this narrative.
                        // All of these folks are common collaborators.

                        filtered.forEach(function (x) {
                            Utils.incrProp(collaborators, x.username);
                        });
                    }
                    var collabs = Utils.object_to_array(collaborators, 'username', 'count');
                    var usersToFetch = collabs.map(function (x) {
                        return x.username;
                    });
                    return [collabs, usersToFetch, userProfileClient.get_user_profile(usersToFetch)];
                })
                .spread(function (collabs, usersToFetch, data) {
                    var i;
                    for (i = 0; i < data.length; i += 1) {
                        // it is possible that a newly registered user, not even having a stub profile,
                        // are in this list?? If so, remove that user from the network.
                        // TODO: we need a way to report these cases -- they should not occur or be very rare.
                        if (!data[i] || !data[i].user) {
                            console.warn('WARNING: user ' + usersToFetch[i] + ' is a sharing partner but has no profile.');
                        } else {
                            collabs[i].realname = data[i].user.realname;
                        }
                    }
                    collabs = collabs.filter(function (x) {
                        return (x.realname ? true : false);
                    });
                    return collabs;
                });
        }

        return {
            getNarratives: getNarratives,
            getCollaborators: getCollaborators,
            getPermissions: getPermissions,
            getApps: getApps,
            getMethods: getMethods
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});