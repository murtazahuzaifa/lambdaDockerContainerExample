export {};
const AWS = require("aws-sdk");
import axios from 'axios';
import { Guid } from "guid-typescript";
const grafana = require('/opt/nodejs/grafana');
import {Base64} from 'js-base64';
const dbclient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event: any) => {

    console.log(event);

    const { subscriptionId, apiId, subscriber_email, owner_email } = event.data;
    const encoding = Base64.encode(`${process.env.USERNAME}:${process.env.PASSWORD}`)
    console.log(encoding);

    try{

        // const check_user = await grafana.instance.get(`/api/users/lookup?loginOrEmail=${subscriber_email}`, {
        //     headers: {'Authorization': `Basic ${encoding}`}
        // })

        // if(!check_user?.data?.id){
        //     return "User not found!"
        // }

        // const check_user_admin = await grafana.instance.get(`/api/users/lookup?loginOrEmail=${owner_email}`, {
        //     headers: {'Authorization': `Basic ${encoding}`}
        // })

        // if(!check_user_admin?.data?.id){
        //     return "User not found!"
        // }

        ///Create Tenant
        const creat_org = await grafana.instance.post("/api/orgs", {name : `SUBSCRIBED#${subscriptionId}`}, {
            headers: {'Authorization': `Basic ${encoding}`}
        })

        console.log('GRAFANA', creat_org.data.orgId);

        const create_user_data = {
          TableName: process.env.TABLE,
          Item : {
              PK: `${subscriptionId}`,
              org_id: `${creat_org.data.orgId}`
          }
        }

        await dbclient.put(create_user_data).promise();


        /// Add user tot tenant

        const add_admin_user_to_org = await grafana.instance.post(`/api/orgs/${creat_org.data.orgId}/users`, {loginOrEmail: owner_email, role: "Viewer"}, {
            headers: {'Authorization': `Basic ${encoding}`}
        })

        const add_tenant_user_to_org = await grafana.instance.post(`/api/orgs/${creat_org.data.orgId}/users`, {loginOrEmail: subscriber_email, role: "Viewer"}, {
            headers: {'Authorization': `Basic ${encoding}`}
        })

        console.log('GRAFANA ADDed', add_admin_user_to_org.data);
        console.log('GRAFANA ADDed', add_tenant_user_to_org.data);

        /// Switch User to particular tenant
        const switch_org = await grafana.instance.post(`/api/user/using/${creat_org.data.orgId}`, {}, {
            headers: {'Authorization': `Basic ${encoding}`}
        })

        console.log('GRAFANA Switch ORG', switch_org.data);

        console.log('ACCESS KEY', process.env.ACCESS_KEY)
        
        /// Add datasource to tenanat
         /// Add datasource to tenanat
         const create_datasource = await grafana.instance.post(`/api/datasources`, {
            "name": "grafana_timestream",
            "type": "grafana-timestream-datasource",
            "access": "proxy",
            "jsonData": {
            "authType": "keys",
            "defaultRegion": "us-east-1"
            },
            "secureJsonData": {
                "accessKey": process.env.ACCESS_KEY,
                "secretKey": process.env.SECRET_KEY
                }
            }, 
            {
                headers: {'Authorization': `Basic ${encoding}`}
            }
        )

        console.log('GRAFANA create Datasource', create_datasource.data);

        const create_dashboard_lambda = await grafana.instance.post(`/api/dashboards/db`, {
            "dashboard": {
                "annotations": {
                  "list": [
                    {
                      "builtIn": 1,
                      "datasource": "-- Grafana --",
                      "enable": true,
                      "hide": true,
                      "iconColor": "rgba(0, 211, 255, 1)",
                      "name": "Annotations & Alerts",
                      "type": "dashboard"
                    }
                  ]
                },
                "editable": true,
                "gnetId": null,
                "graphTooltip": 0,
                "id": null,
                "links": [],
                "panels": [
                  {
                    "aliasColors": {},
                    "bars": false,
                    "dashLength": 10,
                    "dashes": false,
                    "datasource": "grafana_timestream",
                    "fieldConfig": {
                      "defaults": {
                        "custom": {},
                        "displayName": "duration (ms)",
                        "unit": "ms"
                      },
                      "overrides": []
                    },
                    "fill": 1,
                    "fillGradient": 0,
                    "gridPos": {
                      "h": 9,
                      "w": 12,
                      "x": 0,
                      "y": 0
                    },
                    "hiddenSeries": false,
                    "id": 2,
                    "legend": {
                      "avg": false,
                      "current": false,
                      "max": false,
                      "min": false,
                      "show": true,
                      "total": false,
                      "values": false
                    },
                    "lines": true,
                    "linewidth": 1,
                    "nullPointMode": "null",
                    "options": {
                      "alertThreshold": true
                    },
                    "percentage": false,
                    "pluginVersion": "7.3.5",
                    "pointradius": 2,
                    "points": false,
                    "renderer": "flot",
                    "seriesOverrides": [],
                    "spaceLength": 10,
                    "stack": false,
                    "steppedLine": false,
                    "targets": [
                      {
                        "database": "\"demo-timestream-db\"",
                        "queryType": "raw",
                        "rawQuery": `SELECT * FROM $__database.$__table WHERE apiId = '${apiId}' and measure_name = 'billedDurationMs'`,
                        "refId": "A",
                        "table": "\"timestream-table\""
                      }
                    ],
                    "thresholds": [],
                    "timeFrom": null,
                    "timeRegions": [],
                    "timeShift": null,
                    "title": "Billed Duration (ms)",
                    "tooltip": {
                      "shared": true,
                      "sort": 0,
                      "value_type": "individual"
                    },
                    "type": "graph",
                    "xaxis": {
                      "buckets": null,
                      "mode": "time",
                      "name": null,
                      "show": true,
                      "values": []
                    },
                    "yaxes": [
                      {
                        "format": "ms",
                        "label": null,
                        "logBase": 1,
                        "max": null,
                        "min": null,
                        "show": true
                      },
                      {
                        "format": "short",
                        "label": null,
                        "logBase": 1,
                        "max": null,
                        "min": null,
                        "show": true
                      }
                    ],
                    "yaxis": {
                      "align": false,
                      "alignLevel": null
                    }
                  },
                  {
                    "aliasColors": {},
                    "bars": false,
                    "dashLength": 10,
                    "dashes": false,
                    "datasource": "grafana_timestream",
                    "fieldConfig": {
                      "defaults": {
                        "custom": {},
                        "displayName": "duration",
                        "unit": "ms"
                      },
                      "overrides": []
                    },
                    "fill": 1,
                    "fillGradient": 0,
                    "gridPos": {
                      "h": 9,
                      "w": 12,
                      "x": 12,
                      "y": 0
                    },
                    "hiddenSeries": false,
                    "id": 4,
                    "legend": {
                      "avg": false,
                      "current": false,
                      "max": false,
                      "min": false,
                      "show": true,
                      "total": false,
                      "values": false
                    },
                    "lines": true,
                    "linewidth": 1,
                    "nullPointMode": "null",
                    "options": {
                      "alertThreshold": true
                    },
                    "percentage": false,
                    "pluginVersion": "7.3.5",
                    "pointradius": 2,
                    "points": false,
                    "renderer": "flot",
                    "seriesOverrides": [],
                    "spaceLength": 10,
                    "stack": false,
                    "steppedLine": false,
                    "targets": [
                      {
                        "database": "\"demo-timestream-db\"",
                        "queryType": "raw",
                        "rawQuery": `SELECT * FROM $__database.$__table WHERE apiId = '${apiId}' and measure_name = 'durationMs'`,
                        "refId": "A",
                        "table": "\"timestream-table\""
                      }
                    ],
                    "thresholds": [],
                    "timeFrom": null,
                    "timeRegions": [],
                    "timeShift": null,
                    "title": "Consumed Duration (ms)",
                    "tooltip": {
                      "shared": true,
                      "sort": 0,
                      "value_type": "individual"
                    },
                    "type": "graph",
                    "xaxis": {
                      "buckets": null,
                      "mode": "time",
                      "name": null,
                      "show": true,
                      "values": []
                    },
                    "yaxes": [
                      {
                        "format": "ms",
                        "label": null,
                        "logBase": 1,
                        "max": null,
                        "min": null,
                        "show": true
                      },
                      {
                        "format": "short",
                        "label": null,
                        "logBase": 1,
                        "max": null,
                        "min": null,
                        "show": true
                      }
                    ],
                    "yaxis": {
                      "align": false,
                      "alignLevel": null
                    }
                  },
                  {
                    "aliasColors": {},
                    "bars": false,
                    "dashLength": 10,
                    "dashes": false,
                    "datasource": "grafana_timestream",
                    "fieldConfig": {
                      "defaults": {
                        "custom": {},
                        "displayName": "duration (ms)",
                        "unit": "ms"
                      },
                      "overrides": []
                    },
                    "fill": 1,
                    "fillGradient": 0,
                    "gridPos": {
                      "h": 8,
                      "w": 11,
                      "x": 0,
                      "y": 9
                    },
                    "hiddenSeries": false,
                    "id": 6,
                    "legend": {
                      "avg": false,
                      "current": false,
                      "max": false,
                      "min": false,
                      "show": true,
                      "total": false,
                      "values": false
                    },
                    "lines": true,
                    "linewidth": 1,
                    "nullPointMode": "null",
                    "options": {
                      "alertThreshold": true
                    },
                    "percentage": false,
                    "pluginVersion": "7.3.5",
                    "pointradius": 2,
                    "points": false,
                    "renderer": "flot",
                    "seriesOverrides": [],
                    "spaceLength": 10,
                    "stack": false,
                    "steppedLine": false,
                    "targets": [
                      {
                        "database": "\"demo-timestream-db\"",
                        "queryType": "raw",
                        "rawQuery": `SELECT * FROM $__database.$__table WHERE apiId = '${apiId}' and measure_name = 'initDurationMs'`,
                        "refId": "A",
                        "table": "\"timestream-table\""
                      }
                    ],
                    "thresholds": [],
                    "timeFrom": null,
                    "timeRegions": [],
                    "timeShift": null,
                    "title": "Init Duration (ms)",
                    "tooltip": {
                      "shared": true,
                      "sort": 0,
                      "value_type": "individual"
                    },
                    "type": "graph",
                    "xaxis": {
                      "buckets": null,
                      "mode": "time",
                      "name": null,
                      "show": true,
                      "values": []
                    },
                    "yaxes": [
                      {
                        "format": "ms",
                        "label": null,
                        "logBase": 1,
                        "max": null,
                        "min": null,
                        "show": true
                      },
                      {
                        "format": "short",
                        "label": null,
                        "logBase": 1,
                        "max": null,
                        "min": null,
                        "show": true
                      }
                    ],
                    "yaxis": {
                      "align": false,
                      "alignLevel": null
                    }
                  },
                  {
                    "datasource": "grafana_timestream",
                    "description": "",
                    "fieldConfig": {
                      "defaults": {
                        "custom": {},
                        "displayName": "duration",
                        "mappings": [],
                        "thresholds": {
                          "mode": "absolute",
                          "steps": [
                            {
                              "color": "yellow",
                              "value": null
                            },
                            {
                              "color": "red",
                              "value": 1300
                            }
                          ]
                        },
                        "unit": "ms"
                      },
                      "overrides": []
                    },
                    "gridPos": {
                      "h": 8,
                      "w": 7,
                      "x": 11,
                      "y": 9
                    },
                    "id": 10,
                    "options": {
                      "reduceOptions": {
                        "calcs": [
                          "mean"
                        ],
                        "fields": "",
                        "values": false
                      },
                      "showThresholdLabels": false,
                      "showThresholdMarkers": true
                    },
                    "pluginVersion": "7.3.5",
                    "targets": [
                      {
                        "database": "\"demo-timestream-db\"",
                        "queryType": "raw",
                        "rawQuery": `SELECT * FROM $__database.$__table WHERE apiId = '${apiId}' and measure_name = 'billedDurationMs'`,
                        "refId": "A",
                        "table": "\"timestream-table\""
                      }
                    ],
                    "timeFrom": null,
                    "timeShift": null,
                    "title": "Average Billed Duration",
                    "type": "gauge"
                  },
                  {
                    "datasource": "grafana_timestream",
                    "fieldConfig": {
                      "defaults": {
                        "custom": {},
                        "displayName": "duration (ms)",
                        "mappings": [],
                        "thresholds": {
                          "mode": "absolute",
                          "steps": [
                            {
                              "color": "green",
                              "value": null
                            }
                          ]
                        },
                        "unit": "ms"
                      },
                      "overrides": []
                    },
                    "gridPos": {
                      "h": 8,
                      "w": 6,
                      "x": 18,
                      "y": 9
                    },
                    "id": 8,
                    "options": {
                      "reduceOptions": {
                        "calcs": [
                          "sum"
                        ],
                        "fields": "",
                        "values": false
                      },
                      "showThresholdLabels": false,
                      "showThresholdMarkers": true
                    },
                    "pluginVersion": "7.3.5",
                    "targets": [
                      {
                        "database": "\"demo-timestream-db\"",
                        "queryType": "raw",
                        "rawQuery": `SELECT * FROM $__database.$__table WHERE apiId = '${apiId}' and measure_name = 'billedDurationMs'`,
                        "refId": "A",
                        "table": "\"timestream-table\""
                      }
                    ],
                    "timeFrom": null,
                    "timeShift": null,
                    "title": "Total Billed Duration (ms)",
                    "type": "gauge"
                  },
                  {
                    "datasource": "grafana_timestream",
                    "fieldConfig": {
                      "defaults": {
                        "custom": {},
                        "displayName": "duration",
                        "mappings": [],
                        "thresholds": {
                          "mode": "absolute",
                          "steps": [
                            {
                              "color": "green",
                              "value": null
                            },
                            {
                              "color": "red",
                              "value": 1000
                            }
                          ]
                        },
                        "unit": "ms"
                      },
                      "overrides": []
                    },
                    "gridPos": {
                      "h": 8,
                      "w": 15,
                      "x": 0,
                      "y": 17
                    },
                    "id": 14,
                    "options": {
                      "displayMode": "gradient",
                      "orientation": "auto",
                      "reduceOptions": {
                        "calcs": [
                          "mean"
                        ],
                        "fields": "",
                        "limit": 5000,
                        "values": true
                      },
                      "showUnfilled": true
                    },
                    "pluginVersion": "7.3.5",
                    "targets": [
                      {
                        "database": "\"demo-timestream-db\"",
                        "queryType": "raw",
                        "rawQuery": `SELECT * FROM $__database.$__table WHERE apiId = '${apiId}' and subTenantId = 'sub-tenant-id-3' and measure_name = 'billedDurationMs'`,
                        "refId": "A",
                        "table": "\"timestream-table\""
                      }
                    ],
                    "timeFrom": null,
                    "timeShift": null,
                    "title": "Billed Duration ",
                    "type": "bargauge"
                  },
                  {
                    "datasource": "grafana_timestream",
                    "fieldConfig": {
                      "defaults": {
                        "custom": {},
                        "displayName": "Memory",
                        "mappings": [],
                        "thresholds": {
                          "mode": "absolute",
                          "steps": [
                            {
                              "color": "green",
                              "value": null
                            },
                            {
                              "color": "red",
                              "value": 512
                            }
                          ]
                        },
                        "unit": "MB"
                      },
                      "overrides": []
                    },
                    "gridPos": {
                      "h": 8,
                      "w": 9,
                      "x": 15,
                      "y": 17
                    },
                    "id": 12,
                    "options": {
                      "colorMode": "value",
                      "graphMode": "area",
                      "justifyMode": "auto",
                      "orientation": "auto",
                      "reduceOptions": {
                        "calcs": [
                          "mean"
                        ],
                        "fields": "",
                        "values": false
                      },
                      "textMode": "value"
                    },
                    "pluginVersion": "7.3.5",
                    "targets": [
                      {
                        "database": "\"demo-timestream-db\"",
                        "queryType": "raw",
                        "rawQuery": `SELECT * FROM $__database.$__table WHERE apiId = '${apiId}' and measure_name = 'memorySizeMB'`,
                        "refId": "A",
                        "table": "\"timestream-table\""
                      }
                    ],
                    "timeFrom": null,
                    "timeShift": null,
                    "title": "Average Memory Size",
                    "type": "stat"
                  }
                ],
                "refresh": "30s",
                "schemaVersion": 26,
                "style": "dark",
                "tags": [],
                "templating": {
                  "list": []
                },
                "time": {
                  "from": "now-12h",
                  "to": "now"
                },
                "timepicker": {},
                "timezone": "",
                "title": "Lambda Meter",
                "uid": `LAMBDA-${subscriptionId}`
              },
              "folderId": 0,
              "overwrite": false
            }, 
            {
                headers: {'Authorization': `Basic ${encoding}`}
            }
        )

        console.log('GRAFANA create Dashobard Lambda', create_dashboard_lambda.data);

        return 'Organization Created'

    }
    catch(err){
        console.log(err);
        return {
            statusCode: 400,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(err)
        };
    }

}