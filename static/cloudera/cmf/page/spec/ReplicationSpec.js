// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'komapping',
  'cloudera/common/Humanize',
  'cloudera/cmf/page/Replication',
  'cloudera/Util',
  'cloudera/common/TimeUtil',
  'underscore'
], function(ko, komapping, Humanize, Replication, Util, TimeUtil, _) {
  describe("Replication Test", function() {
    describe("hdfs", function(){
      jasmine.Ajax.useMock();

      var $ui,
        $dialog,
        options = {
            container: '#replication',
            dialog: '#scheduleReplicationDialog',
            serviceUri: '/api/v3/clusters/Cluster 2 - CDH4/services/HDFS-2/',
            commandDetailsUri: '/cmf/command/{commandId}/details',
            serviceType: 'HDFS',
            listingLimit: 50,
            replicationListingUri: '/cmf/replication/{commandId}/logs/LISTING?offset={offset}&limit={limit}',
            replicationStatusUri: '/cmf/replication/{commandId}/logs/STATUS?offset={offset}&limit={limit}',
            replicationErrorsUri: '/api/v3/clusters/Cluster 2 - CDH4/services/HDFS-2/history/hiveErrors?offset={offset}&limit={limit}',
            replicationTablesUri: '/api/v3/clusters/Cluster 2 - CDH4/services/HDFS-2/history/hiveTables?offset={offset}&limit={limit}',
            serviceRef: {
              "peerName" : null,
              "clusterName" : "Cluster 1 - CDH4.1",
              "serviceName" : "hdfs1"
            }
          },
        replication,
        initialRequests;

      clearAjaxRequests();

      function generateMockSources() {
        return [
            {
              "serviceName":"HDFS-2",
              "clusterName":"Cluster 2 - CDH4",
              "peerName":"Nightly"
            },
            {
              "serviceName":"HDFS-1",
              "clusterName":"Cluster 1 - CDH4",
              "peerName":null
            }
          ];
      }

      function generateMockReplication() {
        return {
          "id" : 1,
          "interval" : 1,
          "intervalUnit" : "MINUTE",
          "paused" : false,
          "nextRun" : null,
          "startTime" : "2012-10-18T00:39:08.355Z",
          "endTime" : "2012-10-18T00:41:24.104Z",
          "history" : [ {
            "id" : 630,
            "name" : "DistCpCommand",
            "startTime" : "2012-10-18T00:39:08.355Z",
            "endTime" : "2012-10-18T00:41:24.104Z",
            "active" : false,
            "success" : false,
            "resultMessage" : "Aborted command",
            "serviceRef" : {
              "clusterName" : "Cluster 1 - CDH4",
              "serviceName" : "hdfs1"
            }
          } ],
          "hdfsArguments" : {
            "sourceService" : {
              "serviceName":"HDFS-2",
              "clusterName":"Cluster 2 - CDH4",
              "peerName":"Nightly"
            },
            "sourcePath" : "fsdfsdf",
            "destinationPath" : "sdfsdfsdf",
            "mapreduceServiceName" : "mapreduce1",
            "numMaps" : null,
            "dryRun" : false,
            "logPath": null,
            "bandwidthPerMap": 0,
            "abortOnError": false,
            "removeMissingFiles": false,
            "preserveReplicationCount": true,
            "preserveBlockSize": true,
            "preservePermissions": true
          }
        };
      }

      function generateCommand(withHdfsHistory) {
        var command = {
            "id" : 830,
            "name" : "DistCpCommand",
            "startTime" : "2012-10-24T23:42:40.748Z",
            "active" : true,
            "resultDataUrl": "test",
            "serviceRef" : {
              "clusterName" : "Cluster 1 - CDH4",
              "serviceName" : "hdfs1"
            }
          };

        if (withHdfsHistory) {
          command.hdfsResult = generateHdfsResult();
        }
        return command;
      }

      function generateHdfsResult() {
        return {
          "progress" : 0,
          "counters" : [ {
            "group" : "com.cloudera.enterprise.distcp.mapred.CopyMapper$Counter",
            "name" : "FILESEXPECTED",
            "value" : 1
          }, {
            "group" : "com.cloudera.enterprise.distcp.mapred.CopyMapper$Counter",
            "name" : "DIRSCREATED",
            "value" : 2
          }, {
            "group" : "com.cloudera.enterprise.distcp.mapred.CopyMapper$Counter",
            "name" : "COPY",
            "value" : 1
          }, {
            "group" : "com.cloudera.enterprise.distcp.mapred.CopyMapper$Counter",
            "name" : "BYTESEXPECTED",
            "value" : 4
          }, {
            "group" : "com.cloudera.enterprise.distcp.mapred.CopyMapper$Counter",
            "name" : "BYTESCOPIED",
            "value" : 4
          }, {
            "group" : "org.apache.hadoop.mapreduce.JobCounter",
            "name" : "SLOTS_MILLIS_MAPS",
            "value" : 22264
          }, {
            "group" : "org.apache.hadoop.mapreduce.JobCounter",
            "name" : "TOTAL_LAUNCHED_REDUCES",
            "value" : 1
          }, {
            "group" : "org.apache.hadoop.mapreduce.JobCounter",
            "name" : "FALLOW_SLOTS_MILLIS_REDUCES",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.JobCounter",
            "name" : "FALLOW_SLOTS_MILLIS_MAPS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.JobCounter",
            "name" : "TOTAL_LAUNCHED_MAPS",
            "value" : 2
          }, {
            "group" : "org.apache.hadoop.mapreduce.JobCounter",
            "name" : "SLOTS_MILLIS_REDUCES",
            "value" : 5203
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "MAP_INPUT_RECORDS",
            "value" : 3
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "REDUCE_SHUFFLE_BYTES",
            "value" : 32
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "SPILLED_RECORDS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "MAP_OUTPUT_BYTES",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "COMMITTED_HEAP_BYTES",
            "value" : 231407616
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "CPU_MILLISECONDS",
            "value" : 2930
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "SPLIT_RAW_BYTES",
            "value" : 336
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "COMBINE_INPUT_RECORDS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "REDUCE_INPUT_RECORDS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "REDUCE_INPUT_GROUPS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "COMBINE_OUTPUT_RECORDS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "PHYSICAL_MEMORY_BYTES",
            "value" : 386842624
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "REDUCE_OUTPUT_RECORDS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "VIRTUAL_MEMORY_BYTES",
            "value" : 1299546112
          }, {
            "group" : "org.apache.hadoop.mapreduce.TaskCounter",
            "name" : "MAP_OUTPUT_RECORDS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.FileSystemCounter",
            "name" : "FILE_WRITE_OPS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.FileSystemCounter",
            "name" : "FILE_READ_OPS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.FileSystemCounter",
            "name" : "FILE_LARGE_READ_OPS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.FileSystemCounter",
            "name" : "FILE_BYTES_READ",
            "value" : 20
          }, {
            "group" : "org.apache.hadoop.mapreduce.FileSystemCounter",
            "name" : "HDFS_BYTES_READ",
            "value" : 1210
          }, {
            "group" : "org.apache.hadoop.mapreduce.FileSystemCounter",
            "name" : "FILE_BYTES_WRITTEN",
            "value" : 479551
          }, {
            "group" : "org.apache.hadoop.mapreduce.FileSystemCounter",
            "name" : "HDFS_LARGE_READ_OPS",
            "value" : 0
          }, {
            "group" : "org.apache.hadoop.mapreduce.FileSystemCounter",
            "name" : "HDFS_WRITE_OPS",
            "value" : 6
          }, {
            "group" : "org.apache.hadoop.mapreduce.FileSystemCounter",
            "name" : "HDFS_READ_OPS",
            "value" : 24
          }, {
            "group" : "org.apache.hadoop.mapreduce.FileSystemCounter",
            "name" : "HDFS_BYTES_WRITTEN",
            "value" : 125
          } ],
          "numBytesDryRun" : 0,
          "numFilesDryRun" : 0,
          "numFilesExpected" : 2,
          "numBytesExpected" : 4,
          "numFilesCopied" : 1,
          "numBytesCopied" : 4,
          "numFilesSkipped" : 1,
          "numBytesSkipped" : 0,
          "numFilesDeleted" : 0,
          "numFilesCopyFailed" : 0,
          "numBytesCopyFailed" : 0,
          "dryRun" : false
        };
      }

      function populateActiveSchedule() {
        replication.editViewModel.schedule(komapping.fromJS(generateMockReplication()));
      }

      function findInitialRequestBySuffix(suffix) {
        var i = initialRequests.length, request;
        while (i) {
          i -= 1;
          request = initialRequests[i];
          if (request.url.length >= suffix.length && request.url.slice(suffix.length * -1) === suffix) {
            return request;
          }
        }
      }

      beforeEach(function() {
        jasmine.Ajax.useMock();
         $ui = $('<div id="scheduleReplicationDialog" class="modal">' +
             '<div class="model-body">' +
             '<form id="addReplicationForm">' +
             '<input id="testScheduleField" type="text" required value="test"/>' +
             '</form>' +
             '</div>' +
             '<a id="saveSchedule"></a>' +
             '</div>' +
             '<div id="replication"></div>').appendTo("body");
         $dialog = $ui.filter('#scheduleReplicationDialog').modal();
         replication = new Replication(options);
         if(replication.scheduleRepeater) {
           replication.scheduleRepeater.stop();
         }
         initialRequests = ajaxRequests;
      });

      afterEach(function() {
        $ui.remove();
        $dialog = undefined;
        if(replication.scheduleRepeater) {
          replication.scheduleRepeater.stop();
        }
        $('#saveSchedule').removeClass('disabled');
        replication = undefined;
        initialRequests = undefined;
      });

      it('should parse the destinations response and populate the mapreduceServices and destinationServices observableArrays.', function() {
        var response = {
            "items" : [ {
              "name" : "Cluster 1 - CDH4.1",
              "version" : "CDH4",
              "services" : [ {
                "name" : "mapreduce1",
                "type" : "MAPREDUCE",
                "config" : {
                "roleTypeConfigs" : [ {
                  "roleType" : "GATEWAY",
                  "items" : [ {
                  "name" : "io_sort_mb",
                  "value" : "59"
                  }, {
                    "name" : "mapred_child_java_opts_max_heap",
                    "value" : "250355516"
                  }, {
                    "name" : "mapred_reduce_tasks",
                    "value" : "2"
                  }, {
                    "name" : "mapred_submit_replication",
                    "value" : "2"
                  } ]
                }, {
                  "roleType" : "JOBTRACKER",
                  "items" : [ {
                  "name" : "jobtracker_mapred_local_dir_list",
                  "value" : "/mapred/jt"
                  }, {
                  "name" : "mapred_job_tracker_handler_count",
                  "value" : "28"
                  } ]
                }, {
                  "roleType" : "TASKTRACKER",
                  "items" : [ {
                  "name" : "mapred_tasktracker_instrumentation",
                  "value" : "org.apache.hadoop.mapred.TaskTrackerCmonInst"
                  }, {
                  "name" : "mapred_tasktracker_reduce_tasks_maximum",
                  "value" : "1"
                  }, {
                  "name" : "tasktracker_mapred_local_dir_list",
                  "value" : "/mapred/local"
                  } ]
                } ],
                "items" : [ {
                  "name" : "hdfs_service",
                  "value" : "hdfs1"
                } ]
                },
                "roles" : [ {
                "name" : "mapreduce1-JOBTRACKER-4",
                "type" : "JOBTRACKER",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "jobtracker_java_heapsize",
                  "value" : "250355516"
                  } ]
                }
                }, {
                "name" : "mapreduce1-TASKTRACKER-1",
                "type" : "TASKTRACKER",
                "hostRef" : {
                  "hostId" : "debian60-20.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "task_tracker_java_heapsize",
                  "value" : "406358383"
                  } ]
                }
                }, {
                "name" : "mapreduce1-TASKTRACKER-2",
                "type" : "TASKTRACKER",
                "hostRef" : {
                  "hostId" : "debian60-19.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "task_tracker_java_heapsize",
                  "value" : "406358383"
                  } ]
                }
                }, {
                "name" : "mapreduce1-TASKTRACKER-3",
                "type" : "TASKTRACKER",
                "hostRef" : {
                  "hostId" : "debian60-18.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "task_tracker_java_heapsize",
                  "value" : "406358383"
                  } ]
                }
                }, {
                "name" : "mapreduce1-TASKTRACKER-4",
                "type" : "TASKTRACKER",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "task_tracker_java_heapsize",
                  "value" : "250355516"
                  } ]
                }
                } ]
              }, {
                "name" : "hdfs1",
                "type" : "HDFS",
                "config" : {
                "roleTypeConfigs" : [ {
                  "roleType" : "DATANODE",
                  "items" : [ {
                  "name" : "dfs_data_dir_list",
                  "value" : "/dfs/dn"
                  } ]
                }, {
                  "roleType" : "NAMENODE",
                  "items" : [ {
                  "name" : "dfs_name_dir_list",
                  "value" : "/dfs/nn"
                  } ]
                }, {
                  "roleType" : "SECONDARYNAMENODE",
                  "items" : [ {
                  "name" : "fs_checkpoint_dir_list",
                  "value" : "/dfs/snn"
                  } ]
                } ],
                "items" : [ {
                  "name" : "zookeeper_service",
                  "value" : "zookeeper1"
                } ]
                },
                "roles" : [ {
                "name" : "hdfs1-DATANODE-1",
                "type" : "DATANODE",
                "hostRef" : {
                  "hostId" : "debian60-20.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "datanode_java_heapsize",
                  "value" : "406358383"
                  }, {
                  "name" : "dfs_datanode_du_reserved",
                  "value" : "5087506022"
                  } ]
                }
                }, {
                "name" : "hdfs1-DATANODE-2",
                "type" : "DATANODE",
                "hostRef" : {
                  "hostId" : "debian60-19.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "datanode_java_heapsize",
                  "value" : "406358383"
                  }, {
                  "name" : "dfs_datanode_du_reserved",
                  "value" : "5087506022"
                  } ]
                }
                }, {
                "name" : "hdfs1-DATANODE-3",
                "type" : "DATANODE",
                "hostRef" : {
                  "hostId" : "debian60-18.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "datanode_java_heapsize",
                  "value" : "406358383"
                  }, {
                  "name" : "dfs_datanode_du_reserved",
                  "value" : "5087506022"
                  } ]
                }
                }, {
                "name" : "hdfs1-DATANODE-4",
                "type" : "DATANODE",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "datanode_java_heapsize",
                  "value" : "250355516"
                  }, {
                  "name" : "dfs_datanode_du_reserved",
                  "value" : "5087506022"
                  } ]
                }
                }, {
                "name" : "hdfs1-NAMENODE-4",
                "type" : "NAMENODE",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "namenode_java_heapsize",
                  "value" : "250355516"
                  } ]
                }
                }, {
                "name" : "hdfs1-SECONDARYNAMENODE-4",
                "type" : "SECONDARYNAMENODE",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "secondary_namenode_java_heapsize",
                  "value" : "250355516"
                  } ]
                }
                } ]
              }, {
                "name" : "zookeeper1",
                "type" : "ZOOKEEPER",
                "config" : {
                "roleTypeConfigs" : [ {
                  "roleType" : "SERVER",
                  "items" : [ {
                  "name" : "maxSessionTimeout",
                  "value" : "60000"
                  } ]
                } ],
                "items" : [ ]
                },
                "roles" : [ {
                "name" : "zookeeper1-SERVER-4",
                "type" : "SERVER",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "serverId",
                  "value" : "1"
                  }, {
                  "name" : "zookeeper_server_java_heapsize",
                  "value" : "250355516"
                  } ]
                }
                } ]
              }, {
                "name" : "hbase1",
                "type" : "HBASE",
                "roles" : [ {
                "name" : "hbase1-MASTER-4",
                "type" : "MASTER",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "hbase_master_java_heapsize",
                  "value" : "250355516"
                  } ]
                }
                }, {
                "name" : "hbase1-REGIONSERVER-1",
                "type" : "REGIONSERVER",
                "hostRef" : {
                  "hostId" : "debian60-20.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "hbase_regionserver_java_heapsize",
                  "value" : "406358383"
                  } ]
                }
                }, {
                "name" : "hbase1-REGIONSERVER-2",
                "type" : "REGIONSERVER",
                "hostRef" : {
                  "hostId" : "debian60-19.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "hbase_regionserver_java_heapsize",
                  "value" : "406358383"
                  } ]
                }
                }, {
                "name" : "hbase1-REGIONSERVER-3",
                "type" : "REGIONSERVER",
                "hostRef" : {
                  "hostId" : "debian60-18.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "hbase_regionserver_java_heapsize",
                  "value" : "406358383"
                  } ]
                }
                }, {
                "name" : "hbase1-REGIONSERVER-4",
                "type" : "REGIONSERVER",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "hbase_regionserver_java_heapsize",
                  "value" : "250355516"
                  } ]
                }
                } ]
              }, {
                "name" : "hue1",
                "type" : "HUE",
                "roles" : [ {
                "name" : "hue1-BEESWAX_SERVER-4",
                "type" : "BEESWAX_SERVER",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "beeswax_server_heapsize",
                  "value" : "94290097"
                  } ]
                }
                }, {
                "name" : "hue1-HUE_SERVER-4",
                "type" : "HUE_SERVER",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "secret_key",
                  "value" : "vyhrmKP7HOFQifOTswTQeNlaufSu8i"
                  } ]
                }
                } ]
              }, {
                "name" : "oozie1",
                "type" : "OOZIE",
                "roles" : [ {
                "name" : "oozie1-OOZIE_SERVER-4",
                "type" : "OOZIE_SERVER",
                "hostRef" : {
                  "hostId" : "debian60-17.ent.cloudera.com"
                },
                "config" : {
                  "items" : [ {
                  "name" : "oozie_java_heapsize",
                  "value" : "250355516"
                  } ]
                }
                } ]
              } ]
              } ]
            },
        request = findInitialRequestBySuffix('/clusters?view=export');

        request.response({
          status: 200,
          responseText: JSON.stringify(response)
        });

        expect(replication.editViewModel.mapreduceServices().length).toEqual(1);
        expect(replication.editViewModel.mapreduceServices()[0].name).toEqual('mapreduce1');
      });

      it('should parse the replications response and populate replicas observableArrays with the contents of items', function() {
        var invalidSchedule = generateMockReplication(),
          response = { items: [ generateMockReplication(), invalidSchedule ] },
          request;

        spyOn(replication, 'pairSchedulesToSources');

        invalidSchedule.id = 2;
        invalidSchedule.hdfsArguments.sourceService.serviceName = 'Lunch Box!';

        request = mostRecentAjaxRequest();

        request.response({
          status: 200,
          responseText: JSON.stringify(response)
        });

        expect(replication.pairSchedulesToSources).wasNotCalled();
        expect(replication.viewModel.replicationSchedules().length).toEqual(2);

        /*
         * The structure of the data in replicationSchedules is as follows:
         * [
         *  <The display name of a source>,
         *  <The schedules associated with the source as an Array>
         * ]
         *
         * So in the following code, the first index is to grab a source, the second is to grab the array of schedules
         * associated with the source and the last index is to grab a schedule from the Array.
         */
        expect(replication.viewModel.replicationSchedules()[0][1][0].id()).toEqual(1);
        expect(replication.viewModel.replicationSchedules()[0][1][0].invalid()).toBe(false);
        expect(replication.viewModel.replicationSchedules()[1][1][0].id()).toEqual(2);
        expect(replication.viewModel.replicationSchedules()[1][1][0].invalid()).toBe(false);

        // Initiate loadSchedules request
        findInitialRequestBySuffix('/sources?serviceType=HDFS').response({
          status: 200,
          responseText: JSON.stringify(generateMockSources())
        });

        expect(replication.pairSchedulesToSources).wasCalled();
        expect(replication.viewModel.replicationSchedules().length).toEqual(2);
        expect(replication.viewModel.replicationSchedules()[0][1][0].id()).toEqual(1);
        expect(replication.viewModel.replicationSchedules()[0][1][0].invalid()).toBe(false);
        expect(replication.viewModel.replicationSchedules()[1][1][0].id()).toEqual(2);
        expect(replication.viewModel.replicationSchedules()[1][1][0].invalid()).toBe(false);
      });

      it('should parse the sources response and populate the sources observableArray with the contents', function() {
        var response = generateMockSources(),
          request = findInitialRequestBySuffix('/sources?serviceType=HDFS'),
          source;

        request.response({
          status: 200,
          responseText: JSON.stringify(response)
        });

        expect(replication.viewModel.sources().length).toEqual(2);
        source = replication.viewModel.sources()[0];
        expect(source.value.peerName).toEqual('Nightly');
        expect(source.value.serviceName).toEqual('HDFS-2');
        expect(source.displayName).toEqual('HDFS-2 (Cluster 2 - CDH4 @ Nightly)');
        source = replication.viewModel.sources()[1];
        expect(source.value.peerName).toBeNull();
        expect(source.value.serviceName).toEqual('HDFS-1');
        expect(source.displayName).toEqual('HDFS-1 (Cluster 1 - CDH4)');
        expect(replication.editViewModel.sources().length).toEqual(2);
        source = replication.editViewModel.sources()[0];
        expect(source.value.peerName).toEqual('Nightly');
        expect(source.value.serviceName).toEqual('HDFS-2');
        expect(source.displayName).toEqual('HDFS-2 (Cluster 2 - CDH4 @ Nightly)');
        source = replication.editViewModel.sources()[1];
        expect(source.value.peerName).toBeNull(null);
        expect(source.value.serviceName).toEqual('HDFS-1');
        expect(source.displayName).toEqual('HDFS-1 (Cluster 1 - CDH4)');
        expect(replication.viewModel.sourcesLoaded()).toBe(true);
        expect(replication.editViewModel.sourcesLoaded()).toBe(true);
      });

      it('should pair the sources to schedules correctly', function() {
        var sources = generateMockSources(),
          validSource = komapping.fromJS(generateMockReplication()),
          invalidSource = komapping.fromJS(generateMockReplication()),
          schedules = [];

        sources = _.map(sources, function(source) {
          return {
            displayName: replication.formatReference(source),
            value: source
          };
        });

        validSource.hdfsArguments.sourceService = {
          "serviceName":"HDFS-2",
          "clusterName":"Cluster 2 - CDH4",
          "peerName":"Nightly"
        };
        validSource.invalid = ko.observable(false);
        invalidSource.hdfsArguments.sourceService = {serviceName: 'blah'};
        invalidSource.invalid = ko.observable(false);
        replication.viewModel.sources(sources);
        schedules.push([replication.formatReference(validSource.hdfsArguments.sourceService), [validSource]]);
        schedules.push([replication.formatReference(invalidSource.hdfsArguments.sourceService), [invalidSource]]);
        replication.viewModel.replicationSchedules(schedules);
        replication.pairSchedulesToSources();
        expect(validSource.invalid()).toBeFalsy();
        expect(invalidSource.invalid()).toBeTruthy();
        expect(validSource.hdfsArguments.sourceService).toEqual(sources[0].value);
        expect(invalidSource.hdfsArguments.sourceService).not.toEqual(sources[1].value);
      });

      it('should toggle the paused state when toggleSchedule is invoked', function() {
        var mockReplication = komapping.fromJS(generateMockReplication()),
          request;
        spyOn(replication, 'loadSchedules');

        replication.viewModel.toggleSchedule.call(mockReplication);
        request = mostRecentAjaxRequest();
        expect(mockReplication.paused()).toBe(true);
        request.response({status: 200});
        expect(replication.loadSchedules).wasCalled();
      });

      it('should delete the specified schedule when deleteSchedule is invoked', function() {
        var mockReplication = komapping.fromJS(generateMockReplication()),
          request;
        spyOn(replication, 'loadSchedules');

        replication.viewModel.scheduleToDelete(mockReplication);
        replication.viewModel.deleteSchedule.call(mockReplication);
        request = mostRecentAjaxRequest();
        expect(request.url).toEqual(options.replicationUri + mockReplication.id());
        request.response({status: 200});
        expect(replication.loadSchedules).wasCalled();
      });

      it("should replace all observables with new observables and add back in default values that have been removed", function() {
        var defaults = replication.editViewModel.generateDefaultSchedule(),
            rawMockReplication = generateMockReplication(),
            mockReplication = komapping.fromJS(generateMockReplication());
        mockReplication.hdfsArguments.sourceService = rawMockReplication.hdfsArguments.sourceService;
        replication.editViewModel.schedule(mockReplication);
        expect(replication.editViewModel.type()).toEqual('RECURRING');
        // Verify that the newly created object has the correct values
        expect(replication.editViewModel.schedule().hdfsArguments.sourceService).toEqual(mockReplication.hdfsArguments.sourceService);
        expect(replication.editViewModel.schedule().hdfsArguments.sourcePath()).toEqual(mockReplication.hdfsArguments.sourcePath());
        expect(replication.editViewModel.schedule().hdfsArguments.destinationPath()).toEqual(mockReplication.hdfsArguments.destinationPath());
        expect(replication.editViewModel.schedule().hdfsArguments.mapreduceServiceName()).toEqual(mockReplication.hdfsArguments.mapreduceServiceName());
        expect(replication.editViewModel.schedule().hdfsArguments.schedulerPoolName()).toEqual(defaults.hdfsArguments.schedulerPoolName);
        expect(replication.editViewModel.schedule().hdfsArguments.logPath()).toEqual(mockReplication.hdfsArguments.logPath());
        expect(replication.editViewModel.schedule().hdfsArguments.numMaps()).toEqual(mockReplication.hdfsArguments.numMaps());
        expect(replication.editViewModel.schedule().hdfsArguments.bandwidthPerMap()).toEqual(mockReplication.hdfsArguments.bandwidthPerMap());
        expect(replication.editViewModel.schedule().hdfsArguments.abortOnError()).toEqual(mockReplication.hdfsArguments.abortOnError());
        expect(replication.editViewModel.schedule().hdfsArguments.removeMissingFiles()).toEqual(mockReplication.hdfsArguments.removeMissingFiles());
        expect(replication.editViewModel.schedule().hdfsArguments.preserveReplicationCount()).toEqual(mockReplication.hdfsArguments.preserveReplicationCount());
        expect(replication.editViewModel.schedule().hdfsArguments.preserveBlockSize()).toEqual(mockReplication.hdfsArguments.preserveBlockSize());
        expect(replication.editViewModel.schedule().hdfsArguments.preservePermissions()).toEqual(mockReplication.hdfsArguments.preservePermissions());
        expect(replication.editViewModel.schedule().hdfsArguments.skipChecksumChecks()).toEqual(defaults.hdfsArguments.skipChecksumChecks);
        expect(replication.editViewModel.schedule().alertOnAbort()).toEqual(defaults.alertOnAbort);
        expect(replication.editViewModel.schedule().alertOnFail()).toEqual(defaults.alertOnFail);
        expect(replication.editViewModel.schedule().alertOnStart()).toEqual(defaults.alertOnStart);
        expect(replication.editViewModel.schedule().alertOnSuccess()).toEqual(defaults.alertOnSuccess);
        expect(replication.editViewModel.schedule().startTime()).toEqual(mockReplication.startTime());
        expect(replication.editViewModel.schedule().endTime()).toEqual(mockReplication.endTime());
        expect(replication.editViewModel.schedule().interval()).toEqual(mockReplication.interval());
        expect(replication.editViewModel.schedule().intervalUnit()).toEqual(mockReplication.intervalUnit());

        // Modify everything
        replication.editViewModel.schedule().hdfsArguments.sourceService = 'something else';
        replication.editViewModel.schedule().hdfsArguments.sourcePath('blah');
        replication.editViewModel.schedule().hdfsArguments.destinationPath('blarg');
        replication.editViewModel.schedule().hdfsArguments.mapreduceServiceName('something else');
        replication.editViewModel.schedule().hdfsArguments.schedulerPoolName('and again');
        replication.editViewModel.schedule().hdfsArguments.logPath('then there\'s this one');
        replication.editViewModel.schedule().hdfsArguments.numMaps(100);
        replication.editViewModel.schedule().hdfsArguments.bandwidthPerMap(18);
        replication.editViewModel.schedule().hdfsArguments.abortOnError(true);
        replication.editViewModel.schedule().hdfsArguments.removeMissingFiles(true);
        replication.editViewModel.schedule().hdfsArguments.preserveReplicationCount(false);
        replication.editViewModel.schedule().hdfsArguments.preserveBlockSize(false);
        replication.editViewModel.schedule().hdfsArguments.preservePermissions(false);
        replication.editViewModel.schedule().hdfsArguments.skipChecksumChecks(true);
        replication.editViewModel.schedule().alertOnAbort(true);
        replication.editViewModel.schedule().alertOnFail(true);
        replication.editViewModel.schedule().alertOnStart(true);
        replication.editViewModel.schedule().alertOnSuccess(true);
        replication.editViewModel.schedule().startTime(TimeUtil.getServerNow());
        replication.editViewModel.schedule().endTime(TimeUtil.getServerNow());
        replication.editViewModel.schedule().interval(14);
        replication.editViewModel.schedule().intervalUnit('carts');
        replication.editViewModel.schedule().paused(true);

        // Verify that nothing matches
        expect(replication.editViewModel.schedule().hdfsArguments.sourceService).toNotEqual(mockReplication.hdfsArguments.sourceService);
        expect(replication.editViewModel.schedule().hdfsArguments.sourcePath()).toNotEqual(mockReplication.hdfsArguments.sourcePath());
        expect(replication.editViewModel.schedule().hdfsArguments.destinationPath()).toNotEqual(mockReplication.hdfsArguments.destinationPath());
        expect(replication.editViewModel.schedule().hdfsArguments.mapreduceServiceName()).toNotEqual(mockReplication.hdfsArguments.mapreduceServiceName());
        expect(replication.editViewModel.schedule().hdfsArguments.schedulerPoolName()).toNotEqual(defaults.hdfsArguments.schedulerPoolName);
        expect(replication.editViewModel.schedule().hdfsArguments.logPath()).toNotEqual(mockReplication.hdfsArguments.logPath());
        expect(replication.editViewModel.schedule().hdfsArguments.numMaps()).toNotEqual(mockReplication.hdfsArguments.numMaps());
        expect(replication.editViewModel.schedule().hdfsArguments.bandwidthPerMap()).toNotEqual(mockReplication.hdfsArguments.bandwidthPerMap());
        expect(replication.editViewModel.schedule().hdfsArguments.abortOnError()).toNotEqual(mockReplication.hdfsArguments.abortOnError());
        expect(replication.editViewModel.schedule().hdfsArguments.removeMissingFiles()).toNotEqual(mockReplication.hdfsArguments.removeMissingFiles());
        expect(replication.editViewModel.schedule().hdfsArguments.preserveReplicationCount()).toNotEqual(mockReplication.hdfsArguments.preserveReplicationCount());
        expect(replication.editViewModel.schedule().hdfsArguments.preserveBlockSize()).toNotEqual(mockReplication.hdfsArguments.preserveBlockSize());
        expect(replication.editViewModel.schedule().hdfsArguments.preservePermissions()).toNotEqual(mockReplication.hdfsArguments.preservePermissions());
        expect(replication.editViewModel.schedule().hdfsArguments.skipChecksumChecks()).toNotEqual(defaults.hdfsArguments.skipChecksumChecks);
        expect(replication.editViewModel.schedule().alertOnAbort()).toNotEqual(defaults.alertOnAbort);
        expect(replication.editViewModel.schedule().alertOnFail()).toNotEqual(defaults.alertOnFail);
        expect(replication.editViewModel.schedule().alertOnStart()).toNotEqual(defaults.alertOnStart);
        expect(replication.editViewModel.schedule().alertOnSuccess()).toNotEqual(defaults.alertOnSuccess);
        expect(replication.editViewModel.schedule().startTime()).toNotEqual(mockReplication.startTime());
        expect(replication.editViewModel.schedule().endTime()).toNotEqual(mockReplication.endTime());
        expect(replication.editViewModel.schedule().interval()).toNotEqual(mockReplication.interval());
        expect(replication.editViewModel.schedule().intervalUnit()).toNotEqual(mockReplication.intervalUnit());

        //Reset the form
        replication.editViewModel.reset();

        // Verify that the form values equals the defaults
        expect(replication.editViewModel.schedule().hdfsArguments.sourceService()).toEqual(defaults.hdfsArguments.sourceService);
        expect(replication.editViewModel.schedule().hdfsArguments.sourcePath()).toEqual(defaults.hdfsArguments.sourcePath);
        expect(replication.editViewModel.schedule().hdfsArguments.destinationPath()).toEqual(defaults.hdfsArguments.destinationPath);
        expect(replication.editViewModel.schedule().hdfsArguments.mapreduceServiceName()).toEqual(defaults.hdfsArguments.mapreduceServiceName);
        expect(replication.editViewModel.schedule().hdfsArguments.schedulerPoolName()).toEqual(defaults.hdfsArguments.schedulerPoolName);
        expect(replication.editViewModel.schedule().hdfsArguments.logPath()).toEqual(defaults.hdfsArguments.logPath);
        expect(replication.editViewModel.schedule().hdfsArguments.numMaps()).toEqual(defaults.hdfsArguments.numMaps);
        expect(replication.editViewModel.schedule().hdfsArguments.bandwidthPerMap()).toEqual(defaults.hdfsArguments.bandwidthPerMap);
        expect(replication.editViewModel.schedule().hdfsArguments.abortOnError()).toEqual(defaults.hdfsArguments.abortOnError);
        expect(replication.editViewModel.schedule().hdfsArguments.removeMissingFiles()).toEqual(defaults.hdfsArguments.removeMissingFiles);
        expect(replication.editViewModel.schedule().hdfsArguments.preserveReplicationCount()).toEqual(defaults.hdfsArguments.preserveReplicationCount);
        expect(replication.editViewModel.schedule().hdfsArguments.preserveBlockSize()).toEqual(defaults.hdfsArguments.preserveBlockSize);
        expect(replication.editViewModel.schedule().hdfsArguments.preservePermissions()).toEqual(defaults.hdfsArguments.preservePermissions);
        expect(replication.editViewModel.schedule().hdfsArguments.skipChecksumChecks()).toEqual(defaults.hdfsArguments.skipChecksumChecks);
        expect(replication.editViewModel.schedule().alertOnAbort()).toEqual(defaults.alertOnAbort);
        expect(replication.editViewModel.schedule().alertOnFail()).toEqual(defaults.alertOnFail);
        expect(replication.editViewModel.schedule().alertOnStart()).toEqual(defaults.alertOnStart);
        expect(replication.editViewModel.schedule().alertOnSuccess()).toEqual(defaults.alertOnSuccess);
        expect(replication.editViewModel.schedule().startTime()).toEqual(defaults.startTime);
        expect(replication.editViewModel.schedule().endTime()).toEqual(defaults.endTime);
        expect(replication.editViewModel.schedule().interval()).toEqual(defaults.interval);
        expect(replication.editViewModel.schedule().intervalUnit()).toEqual(defaults.intervalUnit);

        // And that the original wasn't modified
        expect(mockReplication.hdfsArguments.sourceService).toEqual(rawMockReplication.hdfsArguments.sourceService);
        expect(mockReplication.hdfsArguments.sourcePath()).toEqual(rawMockReplication.hdfsArguments.sourcePath);
        expect(mockReplication.hdfsArguments.destinationPath()).toEqual(rawMockReplication.hdfsArguments.destinationPath);
        expect(mockReplication.hdfsArguments.mapreduceServiceName()).toEqual(rawMockReplication.hdfsArguments.mapreduceServiceName);
        expect(mockReplication.hdfsArguments.schedulerPoolName).toEqual(rawMockReplication.hdfsArguments.schedulerPoolName);
        expect(mockReplication.hdfsArguments.logPath()).toEqual(rawMockReplication.hdfsArguments.logPath);
        expect(mockReplication.hdfsArguments.numMaps()).toEqual(rawMockReplication.hdfsArguments.numMaps);
        expect(mockReplication.hdfsArguments.bandwidthPerMap()).toEqual(rawMockReplication.hdfsArguments.bandwidthPerMap);
        expect(mockReplication.hdfsArguments.abortOnError()).toEqual(rawMockReplication.hdfsArguments.abortOnError);
        expect(mockReplication.hdfsArguments.removeMissingFiles()).toEqual(rawMockReplication.hdfsArguments.removeMissingFiles);
        expect(mockReplication.hdfsArguments.preserveReplicationCount()).toEqual(rawMockReplication.hdfsArguments.preserveReplicationCount);
        expect(mockReplication.hdfsArguments.preserveBlockSize()).toEqual(rawMockReplication.hdfsArguments.preserveBlockSize);
        expect(mockReplication.hdfsArguments.preservePermissions()).toEqual(rawMockReplication.hdfsArguments.preservePermissions);
        expect(mockReplication.hdfsArguments.skipChecksumChecks).toEqual(rawMockReplication.hdfsArguments.skipChecksumChecks);
        expect(mockReplication.alertOnAbort).toEqual(rawMockReplication.alertOnAbort);
        expect(mockReplication.alertOnFail).toEqual(rawMockReplication.alertOnFail);
        expect(mockReplication.alertOnStart).toEqual(rawMockReplication.alertOnStart);
        expect(mockReplication.alertOnSuccess).toEqual(rawMockReplication.alertOnSuccess);
        expect(mockReplication.startTime()).toEqual(rawMockReplication.startTime);
        expect(mockReplication.endTime()).toEqual(rawMockReplication.endTime);
        expect(mockReplication.interval()).toEqual(rawMockReplication.interval);
        expect(mockReplication.intervalUnit()).toEqual(rawMockReplication.intervalUnit);
      });

      it("should clear the form when reset is called", function() {
        populateActiveSchedule();
        $dialog.addClass('update').data('update', 'testing');

        replication.editViewModel.reset();

        expect(replication.editViewModel.alert()).toBe(false);
        expect(replication.editViewModel.update()).toBe(false);
        expect(replication.editViewModel.showMore()).toBe(false);
        expect(replication.editViewModel.type()).toEqual('IMMEDIATE');
        expect(replication.editViewModel.schedule().hdfsArguments.sourceService()).toBeNull();
        expect(replication.editViewModel.schedule().hdfsArguments.sourcePath()).toBeNull();
        expect(replication.editViewModel.destinationService()).toEqual(options.serviceRef);
        expect(replication.editViewModel.schedule().hdfsArguments.destinationPath()).toBeNull();
        expect(replication.editViewModel.schedule().hdfsArguments.mapreduceServiceName()).toBeNull();
        expect(replication.editViewModel.schedule().hdfsArguments.schedulerPoolName()).toBeNull();
        expect(replication.editViewModel.schedule().hdfsArguments.logPath()).toBeNull();
        expect(replication.editViewModel.schedule().hdfsArguments.numMaps()).toBeNull();
        expect(replication.editViewModel.schedule().hdfsArguments.bandwidthPerMap()).toBeNull();
        expect(replication.editViewModel.schedule().hdfsArguments.abortOnError()).toBe(false);
        expect(replication.editViewModel.schedule().hdfsArguments.removeMissingFiles()).toBe(false);
        expect(replication.editViewModel.schedule().hdfsArguments.preserveReplicationCount()).toBe(true);
        expect(replication.editViewModel.schedule().hdfsArguments.preserveBlockSize()).toBe(true);
        expect(replication.editViewModel.schedule().hdfsArguments.preservePermissions()).toBe(true);
        expect(replication.editViewModel.schedule().hdfsArguments.skipChecksumChecks()).toBe(false);
        expect(replication.editViewModel.schedule().alertOnAbort()).toBe(false);
        expect(replication.editViewModel.schedule().alertOnFail()).toBe(false);
        expect(replication.editViewModel.schedule().alertOnStart()).toBe(false);
        expect(replication.editViewModel.schedule().alertOnSuccess()).toBe(false);
        expect(replication.editViewModel.schedule().startTime()).toEqual('');
        expect(replication.editViewModel.schedule().endTime()).toEqual('');
        expect(replication.editViewModel.schedule().interval()).toEqual(0);
        expect(replication.editViewModel.schedule().intervalUnit()).toBeNull();
        expect(replication.editViewModel.schedule().paused()).toBeNull();
        expect($dialog.hasClass('update')).toBe(false);
        expect($dialog.data('update')).toBeUndefined();
      });

      it("should submit the form when enter is pressed", function() {
        var which13Event = {which: 13},
          which34Event = {which: 34};
        spyOn($.fn, 'click').andCallThrough();
        expect(replication.editViewModel.keypressSubmit(null, which13Event)).toBe(false);
        expect($.fn.click).wasCalled();
        $.fn.click.reset();
        expect(replication.editViewModel.keypressSubmit(null, which34Event)).toBe(true);
        expect($.fn.click).wasNotCalled();
        $.fn.click.reset();
      });

      it("should display the dialog in update mode if editSchedule is invoked", function() {
        spyOn($.fn, 'modal');
        var mockReplication = komapping.fromJS(generateMockReplication());
        replication.viewModel.editSchedule.call(mockReplication);
        expect(replication.editViewModel.type()).toEqual('RECURRING');
        mockReplication.interval(undefined);
        replication.viewModel.editSchedule.call(mockReplication);
        expect(replication.editViewModel.type()).toEqual('ONCE');
        mockReplication.startTime(undefined);
        replication.viewModel.editSchedule.call(mockReplication);
        expect(replication.editViewModel.type()).toEqual('IMMEDIATE');
        expect($.fn.modal).toHaveBeenCalledWith('show');
        expect(replication.editViewModel.schedule().id()).toEqual(mockReplication.id());
        expect($.fn.modal).wasCalled();
        replication.editViewModel.reset();
      });

      it("should ensure that there are skipped files before loading 'Files not copied' list", function() {
        var command = generateCommand(true),
          previous = mostRecentAjaxRequest(),
          scrollState = {};
        replication.viewModel.prepareCommandForDisplay('blah', command, replication);
        command.hdfsResult.numFilesSkipped = 0;
        command.infiniteScrollNotCopied(scrollState);
        expect(scrollState.complete).toBeTruthy();
        expect(mostRecentAjaxRequest()).toEqual(previous);
        command.hdfsResult.numFilesSkipped = 1;
        scrollState.complete = false;
        command.infiniteScrollNotCopied(scrollState);
        expect(scrollState.complete).toBeFalsy();
        expect(mostRecentAjaxRequest()).toNotEqual(previous);
      });

      it("should PUT the replication information to the server when saveSchedule is called and update is true", function() {
        populateActiveSchedule();
        replication.editViewModel.update(true);
        var hdfsArguments = replication.editViewModel.schedule().hdfsArguments,
            saveSchedule = $('#saveSchedule');

        replication.editViewModel.schedule().startTime('');
        replication.editViewModel.schedule().endTime('');
        hdfsArguments.schedulerPoolName = '';
        hdfsArguments.userName = '';
        hdfsArguments.logPath = '';
        hdfsArguments.numMaps = 2;
        hdfsArguments.bandwidthPerMap = 2;

        jasmine.Clock.useMock();

        $('#testScheduleField').val('');

        saveSchedule.click();

        jasmine.Clock.tick(1);

        expect(!document.getElementById('addReplicationForm').checkValidity || !saveSchedule.hasClass('disabled')).toBeTruthy();

        $('#testScheduleField').val('test');

        saveSchedule.click();

        jasmine.Clock.tick(1);

        expect(saveSchedule.hasClass('disabled')).toBe(true);

        var request = mostRecentAjaxRequest(),
            params = JSON.parse(request.params),
            previousRequest = request;

        saveSchedule.click();

        jasmine.Clock.tick(1);

        request = mostRecentAjaxRequest();

        expect(request).toEqual(previousRequest);

        expect(request.method).toEqual('PUT');
        expect(params.hdfsArguments.schedulerPoolName).toBeNull();
        expect(params.hdfsArguments.userName).toBeNull();
        expect(params.hdfsArguments.logPath).toBeNull();
        expect(params.hdfsArguments.bandwidthPerMap).toEqual(2);
        expect(params.hdfsArguments.numMaps).toEqual(2);
        expect(params.startTime).toBeNull();
        expect(params.endTime).toBeNull();
        expect(replication.editViewModel.schedule().id()).toEqual(generateMockReplication().id);
        request.response({status: 200, responseText: '{}'});
        request = mostRecentAjaxRequest();
        expect(request.url).toEqual(options.replicationUri + '?view=SUMMARY');
        expect(request.method).toEqual('GET');
        replication.editViewModel.reset();
      });

      it("should POST the replication information to the server when saveSchedule is called and update is true", function() {
        populateActiveSchedule();
        var saveSchedule = $('#saveSchedule');
        replication.editViewModel.update(false);

        jasmine.Clock.useMock();

        saveSchedule.click();

        jasmine.Clock.tick(1);

        expect(saveSchedule.hasClass('disabled')).toBe(true);

        var request = mostRecentAjaxRequest(),
            previousRequest = request;

        saveSchedule.click();

        jasmine.Clock.tick(1);

        request = mostRecentAjaxRequest();

        expect(request).toEqual(previousRequest);

        expect(request.method).toEqual('POST');
        expect(replication.editViewModel.schedule().id()).toEqual(generateMockReplication().id);
        request.response({status: 200, responseText: '{}'});
        request = mostRecentAjaxRequest();
        expect(request.url).toEqual(options.replicationUri + '?view=SUMMARY');
        expect(request.method).toEqual('GET');
        replication.editViewModel.reset();
      });

      it('should clear the form when the dialog is hidden', function() {
        spyOn(replication.editViewModel, 'reset');
        spyOn($.fn, 'modal').andCallThrough();
        replication.editViewModel.show();
        expect($.fn.modal).wasCalledWith('show');
        replication.editViewModel.hide();
        expect($.fn.modal).wasCalledWith('hide');
        expect(replication.editViewModel.reset).wasCalled();
      });

      it('should set the readOnly property of viewModel to false and not instantiate the editViewModel', function() {
        var opts = _.extend(_.clone(options), {readOnly: true}),
          repl = new Replication(opts);
        if(repl.scheduleRepeater) {
          repl.scheduleRepeater.stop();
        }

        expect(repl.viewModel.readOnly).toBe(true);
        expect(repl.editViewModel).toBeUndefined();
      });

      it('should format the display string for replication progress correctly', function() {
        var schedule = komapping.fromJS(generateMockReplication()),
            now = TimeUtil.getServerNow(),
            formattedNow = Util.dateToIsoString(now);
        schedule.lastRun = ko.observable(generateCommand());
        schedule.invalid = ko.observable(true);
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.invalidPeerSourceService');
        schedule.invalid(false);
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.initializing');
        schedule.nextRun(Util.dateToIsoString(TimeUtil.getServerNow()));
        schedule.lastRun().active = false;
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.initializing');
        schedule.hdfsResult = generateHdfsResult();
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.initializing');
        schedule.nextRun(undefined);
        schedule.lastRun().active = false;
        schedule.lastRun().endTime = formattedNow;
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('');
      });

      it('should identify the availability of a listing log', function() {
        var status = generateCommand(true);
        expect(replication.viewModel.commandListingAvailable(status)).toBeFalsy();
        status.endTime = new Date();
        expect(replication.viewModel.commandListingAvailable(status)).toBeTruthy();
        status.hdfsResult.setupError = '';
        expect(replication.viewModel.commandListingAvailable(status)).toBeTruthy();
        status.hdfsResult.setupError = 'yep';
        expect(replication.viewModel.commandListingAvailable(status)).toBeFalsy();
        delete status.hdfsResult;
        expect(replication.viewModel.commandListingAvailable(status)).toBeFalsy();
      });

      it('should identify the availability of a status log', function() {
        var status = generateCommand(true);
        expect(replication.viewModel.commandStatusAvailable(status)).toBeFalsy();
        status.endTime = new Date();
        expect(replication.viewModel.commandStatusAvailable(status)).toBeTruthy();
        status.hdfsResult.numFilesSkipped = 0;
        expect(replication.viewModel.commandStatusAvailable(status)).toBeFalsy();
      });

      it('should return the correct number of files not copied to the destination', function() {
        var status = generateCommand(true);
        status.hdfsResult.numFilesSkipped = 0;
        status.hdfsResult.numFilesCopyFailed = 0;
        expect(replication.viewModel.commandFilesNotCopied(status)).toEqual(0);
        status.hdfsResult.numFilesCopyFailed = 12;
        expect(replication.viewModel.commandFilesNotCopied(status)).toEqual(12);
        status.hdfsResult.numFilesCopyFailed = 12;
        status.hdfsResult.numFilesSkipped = 13;
        expect(replication.viewModel.commandFilesNotCopied(status)).toEqual(25);
        status.hdfsResult.numFilesCopyFailed = 0;
        status.hdfsResult.numFilesSkipped = 13;
        expect(replication.viewModel.commandFilesNotCopied(status)).toEqual(13);
      });

      it('should format the display string for replication command progress correctly', function() {
        var status = generateCommand(),
            now = TimeUtil.getServerNow(),
            formattedNow = Util.dateToIsoString(now);
        expect(replication.viewModel.formatDisplayStatus(status)).toEqual('ui.initializing');
        status.hdfsResult = generateHdfsResult();
        status.hdfsResult.progress = 25;
        expect(replication.viewModel.formatDisplayStatus(status)).toEqual('ui.replication.ofProcessed');
        status.active = false;
        status.endTime = formattedNow;
        expect(replication.viewModel.formatDisplayStatus(status)).toEqual('ui.complete');
      });

      it('should format the display string for replication command progress correctly when performing a dry run', function() {
        var status = generateCommand(true),
          now = TimeUtil.getServerNow(),
          formattedNow = Util.dateToIsoString(now);
        status.hdfsResult.dryRun = true;
        expect(replication.viewModel.formatDisplayStatus(status)).toEqual('0%ui.replication.dryRunSuffix');
        status.hdfsResult.progress = 25;
        expect(replication.viewModel.formatDisplayStatus(status)).toEqual('25%ui.replication.dryRunSuffix');
        status.active = false;
        status.endTime = formattedNow;
        expect(replication.viewModel.formatDisplayStatus(status)).toEqual('ui.completeui.replication.dryRunSuffix');
      });

      it('should monitor any active commands and update status', function() {
        var schedule = ko.observable(komapping.fromJS(generateMockReplication())),
          command = generateCommand(),
          status = generateHdfsResult(),
          request;
        jasmine.Clock.useMock();
        replication.monitorCommand(schedule, command);
        expect(replication.monitors.length).toEqual(1);
        command.hdfsResult = status;
        jasmine.Clock.tick(5 * 1000);
        request = mostRecentAjaxRequest();
        status.progress = 20;
        request.response({status: 200, responseText: JSON.stringify(status)});
        expect(command.hdfsResult.progress).toEqual(20);
        jasmine.Clock.tick(5 * 1000);
        request = mostRecentAjaxRequest();
        status.progress = 100;
        status.success = true;
        request.response({status: 200, responseText: JSON.stringify(status)});
        expect(command.active).toBe(false);
        expect(replication.monitors.length).toEqual(0);
        // This is to ensure that a monitors are cleared, even if the expectation isn't met.
        _.each(replication.monitors, function(monitor) {
          clearInterval(monitor.intervalId);
        });
      });

      it('should format the serviceReference correctly', function() {
        var sources = generateMockSources();
        expect(replication.formatReference(sources[0])).toEqual('HDFS-2 (Cluster 2 - CDH4 @ Nightly)');
        expect(replication.formatReference(sources[1])).toEqual('HDFS-1 (Cluster 1 - CDH4)');
        expect(replication.formatReference(sources[0], '/testing')).toEqual('HDFS-2://testing (Cluster 2 - CDH4 @ Nightly)');
        expect(replication.formatReference(sources[1], '/1234')).toEqual('HDFS-1://1234 (Cluster 1 - CDH4)');
      });
    });

    describe("hive", function() {

      var $ui,
          $dialog,
          options = {
            container: '#replication',
            dialog: '#scheduleReplicationDialog',
            serviceUri: '/api/v3/clusters/Cluster 2 - CDH4/services/HIVE-2/',
            commandDetailsUri: '/cmf/command/{commandId}/details',
            replicationErrorsUri: '/api/v3/clusters/Cluster 2 - CDH4/services/HDFS-2/replications/{scheduleId}/history/{commandId}/hiveErrors?offset={offset}&limit={limit}',
            replicationTablesUri: '/api/v3/clusters/Cluster 2 - CDH4/services/HDFS-2/replications/{scheduleId}/history/{commandId}/hiveTables?offset={offset}&limit={limit}',
            serviceType: 'HIVE',
            serviceRef: {
              "peerName" : null,
              "clusterName" : "Cluster 1 - CDH4.1",
              "serviceName" : "hive1"
            }
          },
          replication,
          initialRequests;


      beforeEach(function() {
        jasmine.Ajax.useMock();
        $ui = $('<div id="scheduleReplicationDialog" class="modal">' +
            '<div class="model-body" data-disable-after-click-once="true">' +
            '<form id="addReplicationForm">' +
            '<input id="testScheduleField" type="text" required value="test"/>' +
            '</form>' +
            '</div>' +
            '<a id="saveSchedule"></a>' +
            '</div>' +
            '<div id="replication"></div>').appendTo("body");
        $dialog = $ui.filter('#scheduleReplicationDialog').modal();
        replication = new Replication(options);
        if(replication.scheduleRepeater) {
          replication.scheduleRepeater.stop();
        }
        initialRequests = ajaxRequests;
      });

      afterEach(function() {
        $ui.remove();
        $dialog = undefined;
        if(replication.scheduleRepeater) {
          replication.scheduleRepeater.stop();
        }
        $('#saveSchedule').removeClass('disabled');
        replication = undefined;
        initialRequests = undefined;
      });

      function generateMockHiveSources() {
        return [
          {
            "serviceName":"HIVE-2",
            "clusterName":"Cluster 2 - CDH4",
            "peerName":"Nightly"
          },
          {
            "serviceName":"HIVE-1",
            "clusterName":"Cluster 1 - CDH4",
            "peerName":null
          }
        ];
      }

      function generateMockHiveReplication(generateCommand, generateResult) {
        var schedule = {
          "id" : 1,
          "interval" : 1,
          "intervalUnit" : "MINUTE",
          "paused" : false,
          "nextRun" : null,
          "startTime" : "2012-10-18T00:39:08.355Z",
          "endTime" : "2012-10-18T00:41:24.104Z",
          "history" : [],
          "hiveArguments": {
            "sourceService": {
              "serviceName":"HIVE-2",
              "clusterName":"Cluster 2 - CDH4",
              "peerName":"Nightly"
            },
            "hdfsArguments" : {
              "sourceService" : {
                "serviceName":"HDFS-2",
                "clusterName":"Cluster 2 - CDH4",
                "peerName":"Nightly"
              },
              "sourcePath" : "fsdfsdf",
              "destinationPath" : "sdfsdfsdf",
              "mapreduceServiceName" : "mapreduce1",
              "numMaps" : null,
              "dryRun" : false,
              "logPath": null,
              "bandwidthPerMap": 0,
              "abortOnError": false,
              "removeMissingFiles": false,
              "preserveReplicationCount": true,
              "preserveBlockSize": true,
              "preservePermissions": true
            }
          }
        };

        if (generateCommand) {
          schedule.history.push(generateMockHiveCommand(generateResult));
        }

        return schedule;
      }

      function generateMockHiveCommand(generateResult) {
        var command = {
          "id": 165,
          "name": "HiveReplicationCommand",
          "startTime": "2013-04-17T21:27:29.528Z",
          "endTime": "2013-04-17T21:29:24.339Z",
          "active": false,
          "success": true,
          "resultMessage": "Hive Replication Finished Successfully.",
          "resultDataUrl": "/cmf/command/165/download",
          "serviceRef": {
            "clusterName": "Cluster 1 - CDH4",
            "serviceName": "HIVE-1"
          }
        };

        if (generateResult) {
          command.hiveResult = generateMockHiveResult();
        }

        return command;
      }

      function generateMockHiveResult() {
        return {
          "tableCount": 2,
          "errorCount": 0,
          "dataReplicationResult": {
            "progress": 100,
            "counters": [
              {
                "group": "com.cloudera.enterprise.distcp.mapred.CopyMapper$Counter",
                "name": "FILESDRYRUN",
                "value": 2
              },
              {
                "group": "com.cloudera.enterprise.distcp.mapred.CopyMapper$Counter",
                "name": "BYTESSKIPPED",
                "value": 92124
              },
              {
                "group": "com.cloudera.enterprise.distcp.mapred.CopyMapper$Counter",
                "name": "SKIP",
                "value": 2
              },
              {
                "group": "com.cloudera.enterprise.distcp.mapred.CopyMapper$Counter",
                "name": "BYTESDRYRUN",
                "value": 1024
              },
              {
                "group": "org.apache.hadoop.mapreduce.JobCounter",
                "name": "SLOTS_MILLIS_MAPS",
                "value": 24495
              },
              {
                "group": "org.apache.hadoop.mapreduce.JobCounter",
                "name": "TOTAL_LAUNCHED_REDUCES",
                "value": 1
              },
              {
                "group": "org.apache.hadoop.mapreduce.JobCounter",
                "name": "FALLOW_SLOTS_MILLIS_REDUCES",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.JobCounter",
                "name": "FALLOW_SLOTS_MILLIS_MAPS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.JobCounter",
                "name": "TOTAL_LAUNCHED_MAPS",
                "value": 4
              },
              {
                "group": "org.apache.hadoop.mapreduce.JobCounter",
                "name": "SLOTS_MILLIS_REDUCES",
                "value": 4779
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "MAP_INPUT_RECORDS",
                "value": 4
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "REDUCE_SHUFFLE_BYTES",
                "value": 64
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "SPILLED_RECORDS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "MAP_OUTPUT_BYTES",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "COMMITTED_HEAP_BYTES",
                "value": 385679360
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "CPU_MILLISECONDS",
                "value": 4210
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "SPLIT_RAW_BYTES",
                "value": 672
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "COMBINE_INPUT_RECORDS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "REDUCE_INPUT_RECORDS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "REDUCE_INPUT_GROUPS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "COMBINE_OUTPUT_RECORDS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "PHYSICAL_MEMORY_BYTES",
                "value": 735961088
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "REDUCE_OUTPUT_RECORDS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "VIRTUAL_MEMORY_BYTES",
                "value": 2286002176
              },
              {
                "group": "org.apache.hadoop.mapreduce.TaskCounter",
                "name": "MAP_OUTPUT_RECORDS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.FileSystemCounter",
                "name": "FILE_WRITE_OPS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.FileSystemCounter",
                "name": "FILE_READ_OPS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.FileSystemCounter",
                "name": "FILE_LARGE_READ_OPS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.FileSystemCounter",
                "name": "FILE_BYTES_READ",
                "value": 20
              },
              {
                "group": "org.apache.hadoop.mapreduce.FileSystemCounter",
                "name": "HDFS_BYTES_READ",
                "value": 3480
              },
              {
                "group": "org.apache.hadoop.mapreduce.FileSystemCounter",
                "name": "FILE_BYTES_WRITTEN",
                "value": 816885
              },
              {
                "group": "org.apache.hadoop.mapreduce.FileSystemCounter",
                "name": "HDFS_LARGE_READ_OPS",
                "value": 0
              },
              {
                "group": "org.apache.hadoop.mapreduce.FileSystemCounter",
                "name": "HDFS_WRITE_OPS",
                "value": 1
              },
              {
                "group": "org.apache.hadoop.mapreduce.FileSystemCounter",
                "name": "HDFS_READ_OPS",
                "value": 34
              },
              {
                "group": "org.apache.hadoop.mapreduce.FileSystemCounter",
                "name": "HDFS_BYTES_WRITTEN",
                "value": 78
              }
            ],
            "numBytesDryRun": 1024,
            "numFilesDryRun": 2,
            "numFilesExpected": 2,
            "numBytesExpected": 0,
            "numFilesCopied": 0,
            "numBytesCopied": 0,
            "numFilesSkipped": 2,
            "numBytesSkipped": 92124,
            "numFilesDeleted": 0,
            "numFilesCopyFailed": 0,
            "numBytesCopyFailed": 0,
            "jobId": "job_201304161715_0020",
            "jobDetailsUri": "/cmf/services/5/activities/job_201304161715_0020/?startTime=1366234049528&endTime=1366234164339",
            "dryRun": false
          },
          "dryRun": false
        };
      }

      function findInitialRequestBySuffix(suffix) {
        var i = initialRequests.length, request;
        while (i) {
          i -= 1;
          request = initialRequests[i];
          if (request.url.length >= suffix.length && request.url.slice(suffix.length * -1) === suffix) {
            return request;
          }
        }
      }

      function populateActiveHiveSchedule() {
        replication.editViewModel.schedule(komapping.fromJS(generateMockHiveReplication()));
      }

      it('should format the display string for replication progress correctly', function() {
        var schedule = komapping.fromJS(generateMockHiveReplication()),
          now = TimeUtil.getServerNow(),
          formattedNow = Util.dateToIsoString(now),
          lastRun = generateMockHiveCommand();

        // Test with invalid source state
        lastRun.active = true;
        schedule.lastRun = ko.observable(lastRun);
        schedule.invalid = ko.observable(true);
        schedule.history.push(lastRun);
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.invalidPeerSourceService');
        // Initializing phase
        schedule.invalid(false);
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.initializing');
        // Exporting phase
        lastRun.hiveResult = generateMockHiveResult();
        lastRun.hiveResult.phase = 'EXPORT';
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.replication.exporting');
        // Data replication phase
        lastRun.hiveResult.phase = 'DATA';
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.replication.ofProcessed');
        // Importing phase
        lastRun.hiveResult.phase = 'IMPORT';
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.replication.importing');
        // Initializing with nextRun
        schedule.nextRun(Util.dateToIsoString(TimeUtil.getServerNow()));
        lastRun.active = false;
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.initializing');
        // Complete
        schedule.nextRun(undefined);
        lastRun.endTime = ko.observable(formattedNow);
        expect(replication.viewModel.formatScheduleStatus(schedule)).toEqual('ui.replication.tablesCopied');
      });

      it("should format the command result correctly for Hive commands", function() {
        var command = generateMockHiveCommand(true),
          resultString;

        command.hiveResult.dryRun = false;
        command.hiveResult.tableCount = 5;

        // If this isn't a dry run, it should format a string describing the number of tables copied.
        resultString = replication.viewModel.formatHiveCommandResult(command);

        expect(resultString).toEqual('ui.replication.tablesCopied');

        command.hiveResult.dryRun = true;

        // If it is a dry run, it should format a string describing the number of tables available for replication.
        resultString = replication.viewModel.formatHiveCommandResult(command);

        expect(resultString).toEqual('ui.replication.tablesAvailableFor');

        delete command.hiveResult;
        command.resultMessage = 'bob';

        // If there isn't a hiveResult, it should return the resultMessage from the server if available.
        resultString = replication.viewModel.formatHiveCommandResult(command);

        expect(resultString).toEqual('bob');

        delete command.resultMessage;

        // If there isn't a hiveResult and there isn't a resultMessage,
        // it should inform the user that the result info isn't available.
        resultString = replication.viewModel.formatHiveCommandResult(command);

        expect(resultString).toEqual('label.resultUnavailable');
      });

      it("should ensure that there are errors before loading error list", function() {
        var command = generateMockHiveCommand(true),
          previous = mostRecentAjaxRequest(),
          scrollState = {};
        replication.viewModel.prepareCommandForDisplay('blah', command, replication);
        command.hiveResult.errorCount = 0;
        command.infiniteScrollErrors(scrollState);
        expect(scrollState.complete).toBeTruthy();
        expect(mostRecentAjaxRequest()).toEqual(previous);
        command.hiveResult.errorCount = 1;
        scrollState.complete = false;
        command.infiniteScrollErrors(scrollState);
        expect(scrollState.complete).toBeFalsy();
        expect(mostRecentAjaxRequest()).toNotEqual(previous);
      });

      it("should ensure that there are tables before loading table list", function() {
        var command = generateMockHiveCommand(true),
          previous = mostRecentAjaxRequest(),
          scrollState = {};
        replication.viewModel.prepareCommandForDisplay('blah', command, replication);
        command.hiveResult.tableCount = 0;
        command.infiniteScrollTables(scrollState);
        expect(scrollState.complete).toBeTruthy();
        expect(mostRecentAjaxRequest()).toEqual(previous);
        command.hiveResult.tableCount = 1;
        scrollState.complete = false;
        command.infiniteScrollTables(scrollState);
        expect(scrollState.complete).toBeFalsy();
        expect(mostRecentAjaxRequest()).toNotEqual(previous);
      });

      it("should PUT the replication information to the server when saveSchedule is called and update is true", function() {
        populateActiveHiveSchedule();
        replication.editViewModel.update(true);
        var schedule = replication.editViewModel.schedule(),
            hiveArguments = schedule.hiveArguments,
            hdfsArguments = hiveArguments.hdfsArguments,
            saveSchedule = $('#saveSchedule');
        schedule.startTime(TimeUtil.getServerNow());
        schedule.endTime(TimeUtil.getServerNow());
        hiveArguments.exportDir = '';
        hdfsArguments.destinationPath = '';
        hdfsArguments.schedulerPoolName = '';
        hdfsArguments.userName = '';
        hdfsArguments.logPath = '';
        hdfsArguments.numMaps = '';
        hdfsArguments.bandwidthPerMap = '';
        saveSchedule.click();
        var request = mostRecentAjaxRequest(),
            params = JSON.parse(request.params);
        expect(request.method).toEqual('PUT');
        expect(params.startTime).toEqual(Util.dateToIsoString(schedule.startTime()));
        expect(params.endTime).toEqual(Util.dateToIsoString(schedule.endTime()));
        expect(params.hiveArguments.exportDir).toBeNull();
        expect(params.hiveArguments.hdfsArguments.destinationPath).toBeNull();
        expect(params.hiveArguments.hdfsArguments.schedulerPoolName).toBeNull();
        expect(params.hiveArguments.hdfsArguments.userName).toBeNull();
        expect(params.hiveArguments.hdfsArguments.logPath).toBeNull();
        expect(params.hiveArguments.hdfsArguments.numMaps).toBeNull();
        expect(params.hiveArguments.hdfsArguments.bandwidthPerMap).toBeNull();
        expect(params.id).toEqual(generateMockHiveReplication().id);
        request.response({status: 200, responseText: '{}'});
        request = mostRecentAjaxRequest();
        expect(request.url).toEqual(options.replicationUri + '?view=SUMMARY');
        expect(request.method).toEqual('GET');
        replication.editViewModel.reset();
      });

      it('should parse the replications response and populate replicas observableArrays with the contents of items', function() {
        var invalidSchedule = generateMockHiveReplication(),
            response = { items: [ generateMockHiveReplication(), invalidSchedule ] },
            request,
            schedules;

        invalidSchedule.id = 2;
        invalidSchedule.hiveArguments.sourceService.serviceName = 'Lunch Box!';
        invalidSchedule.hiveArguments.exportDir = '/tmp/car';

        // Initiate loadSchedules request
        findInitialRequestBySuffix('/sources?serviceType=HIVE').response({
          status: 200,
          responseText: JSON.stringify(generateMockHiveSources())
        });

        request = mostRecentAjaxRequest();

        request.response({
          status: 200,
          responseText: JSON.stringify(response)
        });

        schedules = replication.viewModel.replicationSchedules();
        expect(schedules.length).toEqual(2);
        expect(schedules[0][1][0].id()).toEqual(1);
        expect(schedules[0][1][0].invalid()).toBe(false);
        expect(schedules[0][1][0].hiveArguments.exportDir()).toBeNull();
        expect(schedules[1][1][0].id()).toEqual(2);
        expect(schedules[1][1][0].invalid()).toBe(true);
        expect(schedules[1][1][0].hiveArguments.exportDir()).toEqual(invalidSchedule.hiveArguments.exportDir);
      });

      it("should clear the form when reset is called", function() {
        populateActiveHiveSchedule();
        $dialog.addClass('update').data('update', 'testing');

        replication.editViewModel.reset();

        expect(replication.editViewModel.alert()).toBe(false);
        expect(replication.editViewModel.update()).toBe(false);
        expect(replication.editViewModel.showMore()).toBe(false);
        expect(replication.editViewModel.type()).toEqual('IMMEDIATE');

        expect(replication.editViewModel.schedule().hiveArguments.sourceService()).toBeNull();
        expect(replication.editViewModel.schedule().hiveArguments.exportDir()).toBeNull();
        expect(replication.editViewModel.schedule().hiveArguments.replicateData()).toBeTruthy();
        expect(replication.editViewModel.schedule().hiveArguments.force()).toBe(false);

        expect(replication.editViewModel.destinationService()).toEqual(options.serviceRef);
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.sourceService()).toBeNull();
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.sourcePath()).toBeNull();
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.destinationPath()).toBeNull();
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.mapreduceServiceName()).toBeNull();
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.schedulerPoolName()).toBeNull();
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.logPath()).toBeNull();
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.numMaps()).toBeNull();
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.bandwidthPerMap()).toBeNull();
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.abortOnError()).toBe(false);
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.removeMissingFiles()).toBe(false);
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.preserveReplicationCount()).toBe(true);
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.preserveBlockSize()).toBe(true);
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.preservePermissions()).toBe(true);
        expect(replication.editViewModel.schedule().hiveArguments.hdfsArguments.skipChecksumChecks()).toBe(false);
        expect(replication.editViewModel.schedule().alertOnAbort()).toBe(false);
        expect(replication.editViewModel.schedule().alertOnFail()).toBe(false);
        expect(replication.editViewModel.schedule().alertOnStart()).toBe(false);
        expect(replication.editViewModel.schedule().alertOnSuccess()).toBe(false);
        expect(replication.editViewModel.schedule().startTime()).toEqual('');
        expect(replication.editViewModel.schedule().endTime()).toEqual('');
        expect(replication.editViewModel.schedule().interval()).toEqual(0);
        expect(replication.editViewModel.schedule().intervalUnit()).toBeNull();
        expect(replication.editViewModel.schedule().paused()).toBeNull();
        expect($dialog.hasClass('update')).toBe(false);
        expect($dialog.data('update')).toBeUndefined();
      });
    });
  });
});
