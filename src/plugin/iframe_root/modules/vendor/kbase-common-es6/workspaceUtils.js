define([
    './time'
], function (
    time
) {
    'use strict';
    return Object.create({}, {
        workspaceInfoToObject: {
            value: function (wsInfo) {
                return {
                    id: wsInfo[0],
                    name: wsInfo[1],
                    owner: wsInfo[2],
                    moddate: wsInfo[3],
                    object_count: wsInfo[4],
                    user_permission: wsInfo[5],
                    globalread: wsInfo[6],
                    lockstat: wsInfo[7],
                    metadata: wsInfo[8],
                    modDate: time.iso8601ToDate(wsInfo[3])
                };
            }
        },

        objectInfoToObject: {
            value: function (data) {
                const type = data[2].split(/[-.]/);

                return {
                    id: data[0],
                    name: data[1],
                    type: data[2],
                    save_date: data[3],
                    version: data[4],
                    saved_by: data[5],
                    wsid: data[6],
                    ws: data[7],
                    checksum: data[8],
                    size: data[9],
                    metadata: data[10],
                    ref: data[6] + '/' + data[0] + '/' + data[4],
                    obj_id: 'ws.' + data[6] + '.obj.' + data[0],
                    typeModule: type[0],
                    typeName: type[1],
                    typeMajorVersion: type[2],
                    typeMinorVersion: type[3],
                    saveDate: time.iso8601ToDate(data[3])
                };
            }
        },

        makeWorkspaceObjectId: {
            value: function (workspaceId, objectId) {
                return 'ws.' + workspaceId + '.obj.' + objectId;
            }
        },
        makeWorkspaceObjectRef: {
            value: function (workspaceId, objectId, objectVersion) {
                return workspaceId + '/' + objectId + (objectVersion ? ('/' + objectVersion) : '');
            }
        },
        buildObjectIdentity: {
            value: function (workspaceID, objectId) {
                var obj = {};
                if (/^\d+$/.exec(workspaceID)) {
                    obj.wsid = workspaceID;
                } else {
                    obj.workspace = workspaceID;
                }

                // same for the id
                if (/^\d+$/.exec(objectId)) {
                    obj.objid = objectId;
                } else {
                    obj.name = objectId;
                }
                return obj;
            }
        },
        parseTypeId: {
            value: function (typeId) {
                const [module, name, version] = typeId.match(/^(.+?)\.(.+?)-(.+)$/);
                return {module, name, version};
            }
        }

    });
});