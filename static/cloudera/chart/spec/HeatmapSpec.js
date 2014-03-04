//(c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
    'cloudera/chart/Heatmap',
    'underscore',
    'cloudera/Util'
    ], function(Heatmap, _, Util) {
  describe("Heatmap", function() {
    var $ui = $('<div id="heatmap">'
        + '<section class="cells" data-bind="heatmap: data"/>'
        + '<aside>'
        + '<ul data-bind="foreach: thresholds"/>'
        + '<span id="heatmapPopover" data-bind="with: hovered"/>'
        + '</aside>'
        + '</div>'),
        mockSimpleDescriptor = {
            "attributeDescriptions":{
            },
            "chartId":"hdfs_dfs_capacity_heatmap_id",
            "chartTitle":"Configured capacity",
            "metrics":[
              "DFS_CAPACITY"
            ],
            "numDecimals":1,
            "percentage":false,
            "scale":"(1)(1024)(1024)(1024)(1024)(1024)|(B)(KiB)(MiB)(GiB)(TiB)(PiB)",
            "subjectType":"DATANODE",
            "thresholds":null
          },
        mockDescriptorNoScale = {
            "attributeDescriptions":{
            },
            "chartId":"hdfs_dfs_capacity_heatmap_id",
            "chartTitle":"Configured capacity",
            "metrics":[
              "DFS_CAPACITY"
            ],
            "numDecimals":1,
            "percentage":false,
            "scale":null,
            "subjectType":"DATANODE",
            "thresholds":null
          },
        mockDescriptorWithThresholds = {
            "attributeDescriptions":{
              "health.test.descriptor.data_node_file_descriptor.description.short":"DATA_NODE_FILE_DESCRIPTOR",
              "health.test.descriptor.data_node_gc_duration.description.short":"DATA_NODE_GC_DURATION",
              "health.test.descriptor.data_node_scm_health.description.short":"DATA_NODE_SCM_HEALTH",
              "health.test.descriptor.data_node_ha_connectivity.description.short":"DATA_NODE_HA_CONNECTIVITY",
              "health.test.descriptor.data_node_free_space_remaining.description.short":"DATA_NODE_FREE_SPACE_REMAINING",
              "health.test.descriptor.data_node_volume_failures.description.short":"DATA_NODE_VOLUME_FAILURES",
              "health.test.descriptor.data_node_host_health.description.short":"DATA_NODE_HOST_HEALTH",
              "health.test.descriptor.data_node_block_count.description.short":"DATA_NODE_BLOCK_COUNT",
              "health.test.descriptor.data_node_web_metric_collection.description.short":"DATA_NODE_WEB_METRIC_COLLECTION",
              "health.test.descriptor.data_node_log_directory_free_space.description.short":"DATA_NODE_LOG_DIRECTORY_FREE_SPACE"
            },
            "chartId":"datanode_kaiser_health_heatmap_cdh4_id",
            "chartTitle":"DataNode Health",
            "metrics":[
            "KAISER_HEALTH",
            "SUBJECT_STATUS_1",
            "SUBJECT_STATUS_2"
            ],
            "numDecimals":0,
            "percentage":false,
            "scale":null,
            "subjectType":"DATANODE",
            "thresholds":{
              "items":[{
                "displayName":"Good Health",
                "nameKey":"label.goodStatus",
                  "state":"good",
                  "value":2.0
                },
                {
                  "displayName":"Concerning Health",
                  "nameKey":"label.concerningStatus",
                  "state":"concerning",
                  "value":3.0
                },
                {
                  "displayName":"Bad Health",
                  "nameKey":"label.badStatus",
                  "state":"bad",
                  "value":4.0
                },
                {
                  "displayName":"Unknown Health",
                  "nameKey":"label.unknownStatus",
                  "state":"unknown",
                  "value":1.0
                },
                {
                  "displayName":"Health Checks Disabled",
                  "nameKey":"label.disabledStatus",
                  "state":"disabled",
                  "value":0.0
                }]
              }
            },
        mockData = [
              {
                "attributes" : {
                  "DATA_NODE_FILE_DESCRIPTOR" : "Good",
                  "DATA_NODE_GC_DURATION" : "Good",
                  "DATA_NODE_SCM_HEALTH" : "Good",
                  "DATA_NODE_HA_CONNECTIVITY" : "Good",
                  "DATA_NODE_FREE_SPACE_REMAINING" : "Good",
                  "DATA_NODE_VOLUME_FAILURES" : "Good",
                  "DATA_NODE_HOST_HEALTH" : "Good",
                  "DATA_NODE_BLOCK_COUNT" : "Good",
                  "DATA_NODE_WEB_METRIC_COLLECTION" : "Good",
                  "DATA_NODE_LOG_DIRECTORY_FREE_SPACE" : "Good"
                },
                "data" : 2.0,
                "group" : "/default",
                "id" : 103,
                "name" : "datanode (debian60-20)",
                "role" : {
                  "commissioned" : true,
                  "configGeneration" : 6,
                  "configStale" : false,
                  "configuredStatus" : "RUNNING",
                  "decommissionable" : {
                    "count" : 0,
                    "specialState" : false
                  },
                  "host" : 1,
                  "id" : 103,
                  "maintainable" : {
                    "count" : 0,
                    "specialState" : false
                  },
                  "mergedKeytab" : null,
                  "name" : "hdfs1-DATANODE-1",
                  "processes" : [ 168 ],
                  "roleConfigGroup" : 89,
                  "roleType" : "DATANODE",
                  "service" : 24
                },
                "selected" : false
              },
              {
                "attributes" : {
                  "DATA_NODE_FILE_DESCRIPTOR" : "Good",
                  "DATA_NODE_GC_DURATION" : "Good",
                  "DATA_NODE_SCM_HEALTH" : "Good",
                  "DATA_NODE_HA_CONNECTIVITY" : "Good",
                  "DATA_NODE_FREE_SPACE_REMAINING" : "Good",
                  "DATA_NODE_VOLUME_FAILURES" : "Good",
                  "DATA_NODE_HOST_HEALTH" : "Good",
                  "DATA_NODE_BLOCK_COUNT" : "Good",
                  "DATA_NODE_WEB_METRIC_COLLECTION" : "Good",
                  "DATA_NODE_LOG_DIRECTORY_FREE_SPACE" : "Good"
                },
                "data" : 2.0,
                "group" : "/default",
                "id" : 100,
                "name" : "datanode (debian60-19)",
                "role" : {
                  "commissioned" : true,
                  "configGeneration" : 6,
                  "configStale" : false,
                  "configuredStatus" : "RUNNING",
                  "decommissionable" : {
                    "count" : 0,
                    "specialState" : false
                  },
                  "host" : 2,
                  "id" : 100,
                  "maintainable" : {
                    "count" : 0,
                    "specialState" : false
                  },
                  "mergedKeytab" : null,
                  "name" : "hdfs1-DATANODE-2",
                  "processes" : [ 167 ],
                  "roleConfigGroup" : 89,
                  "roleType" : "DATANODE",
                  "service" : 24
                },
                "selected" : false
              },
              {
                "attributes" : {
                  "DATA_NODE_FILE_DESCRIPTOR" : "Good",
                  "DATA_NODE_GC_DURATION" : "Good",
                  "DATA_NODE_SCM_HEALTH" : "Good",
                  "DATA_NODE_HA_CONNECTIVITY" : "Good",
                  "DATA_NODE_FREE_SPACE_REMAINING" : "Good",
                  "DATA_NODE_VOLUME_FAILURES" : "Good",
                  "DATA_NODE_HOST_HEALTH" : "Good",
                  "DATA_NODE_BLOCK_COUNT" : "Good",
                  "DATA_NODE_WEB_METRIC_COLLECTION" : "Good",
                  "DATA_NODE_LOG_DIRECTORY_FREE_SPACE" : "Good"
                },
                "data" : 2.0,
                "group" : "/default",
                "id" : 97,
                "name" : "datanode (debian60-18)",
                "role" : {
                  "commissioned" : true,
                  "configGeneration" : 6,
                  "configStale" : false,
                  "configuredStatus" : "RUNNING",
                  "decommissionable" : {
                    "count" : 0,
                    "specialState" : false
                  },
                  "host" : 3,
                  "id" : 97,
                  "maintainable" : {
                    "count" : 0,
                    "specialState" : false
                  },
                  "mergedKeytab" : null,
                  "name" : "hdfs1-DATANODE-3",
                  "processes" : [ 170 ],
                  "roleConfigGroup" : 89,
                  "roleType" : "DATANODE",
                  "service" : 24
                },
                "selected" : false
              },
              {
                "attributes" : {
                  "DATA_NODE_FILE_DESCRIPTOR" : "Good",
                  "DATA_NODE_GC_DURATION" : "Good",
                  "DATA_NODE_SCM_HEALTH" : "Good",
                  "DATA_NODE_HA_CONNECTIVITY" : "Good",
                  "DATA_NODE_FREE_SPACE_REMAINING" : "Good",
                  "DATA_NODE_VOLUME_FAILURES" : "Good",
                  "DATA_NODE_HOST_HEALTH" : "Good",
                  "DATA_NODE_BLOCK_COUNT" : "Good",
                  "DATA_NODE_WEB_METRIC_COLLECTION" : "Good",
                  "DATA_NODE_LOG_DIRECTORY_FREE_SPACE" : "Good"
                },
                "data" : 2.0,
                "group" : "/default",
                "id" : 81,
                "name" : "datanode (debian60-17)",
                "role" : {
                  "commissioned" : true,
                  "configGeneration" : 6,
                  "configStale" : false,
                  "configuredStatus" : "RUNNING",
                  "decommissionable" : {
                    "count" : 0,
                    "specialState" : false
                  },
                  "host" : 4,
                  "id" : 81,
                  "maintainable" : {
                    "count" : 0,
                    "specialState" : false
                  },
                  "mergedKeytab" : null,
                  "name" : "hdfs1-DATANODE-4",
                  "processes" : [ 169 ],
                  "roleConfigGroup" : 89,
                  "roleType" : "DATANODE",
                  "service" : 24
                },
                "selected" : false
              } ],
        mockDataGeneratedThresholds = [
          { "attributes" : {  },
            "data" : 10.0,
            "group" : "/default",
            "host" : { "activeCommands" : [  ],
              "commissioned" : true,
              "configContainer" : 1,
              "configGeneration" : 0,
              "decommissionable" : { "count" : 0,
                "specialState" : false
              },
              "hostId" : "debian60-17.ent.cloudera.com",
              "id" : 4,
              "ipAddress" : "172.29.113.134",
              "maintainable" : { "count" : 0,
                "specialState" : false
              },
              "name" : "debian60-17.ent.cloudera.com",
              "processes" : [ 206,
                      204,
                      169,
                      172,
                      166,
                      182,
                      207,
                      171,
                      178,
                      173,
                      177,
                      205,
                      209,
                      208,
                      210
                      ],
              "rackId" : "/default",
              "roles" : [ 95,
                    93,
                    83,
                    90,
                    81,
                    88,
                    80,
                    94,
                    82,
                    89,
                    85,
                    106,
                    86,
                    96,
                    92,
                    87,
                    91,
                    84
                    ],
              "status" : "NA"
            },
            "id" : 4,
            "name" : "debian60-17.ent.cloudera.com",
            "selected" : true
          },
          { "attributes" : {  },
            "data" : 5.0,
            "group" : "/default",
            "host" : { "activeCommands" : [  ],
              "commissioned" : true,
              "configContainer" : 1,
              "configGeneration" : 0,
              "decommissionable" : { "count" : 0,
                "specialState" : false
              },
              "hostId" : "debian60-18.ent.cloudera.com",
              "id" : 3,
              "ipAddress" : "172.29.112.136",
              "maintainable" : { "count" : 0,
                "specialState" : false
              },
              "name" : "debian60-18.ent.cloudera.com",
              "processes" : [ 170,
                      174,
                      181
                      ],
              "rackId" : "/default",
              "roles" : [ 99,
                    98,
                    97
                    ],
              "status" : "NA"
            },
            "id" : 3,
            "name" : "debian60-18.ent.cloudera.com",
            "selected" : false
          },
          { "attributes" : {  },
            "data" : 5.0,
            "group" : "/default",
            "host" : { "activeCommands" : [  ],
              "commissioned" : true,
              "configContainer" : 1,
              "configGeneration" : 0,
              "decommissionable" : { "count" : 0,
                "specialState" : false
              },
              "hostId" : "debian60-19.ent.cloudera.com",
              "id" : 2,
              "ipAddress" : "172.29.111.137",
              "maintainable" : { "count" : 0,
                "specialState" : false
              },
              "name" : "debian60-19.ent.cloudera.com",
              "processes" : [ 175,
                      167
                      ],
              "rackId" : "/default",
              "roles" : [ 102,
                    101,
                    100
                    ],
              "status" : "NA"
            },
            "id" : 2,
            "name" : "debian60-19.ent.cloudera.com",
            "selected" : false
          },
          { "attributes" : {  },
            "data" : 16.0,
            "group" : "/default",
            "host" : { 
              "activeCommands" : [  ],
              "commissioned" : true,
              "configContainer" : 1,
              "configGeneration" : 0,
              "decommissionable" : { "count" : 0,
                "specialState" : false
              },
              "hostId" : "debian60-20.ent.cloudera.com",
              "id" : 1,
              "ipAddress" : "172.29.114.131",
              "maintainable" : { "count" : 0,
                "specialState" : false
              },
              "name" : "debian60-20.ent.cloudera.com",
              "processes" : [ 176,
                      168,
                      179
                      ],
              "rackId" : "/default",
              "roles" : [ 105,
                    103,
                    104
                    ],
              "status" : "NA"
            },
            "id" : 1,
            "name" : "debian60-20.ent.cloudera.com",
            "selected" : false
          }
          ],
        heatmap;

    beforeEach(function() {
      jasmine.Ajax.useMock();
      $ui.appendTo(document.body);
      heatmap = new Heatmap({
        dataSource: '/dataSource',
        descriptorSource: '/descriptorSource',
        urlParams: {
          testName: 'DATA_NODE_HOST_HEALTH',
          timestamp: '1350935415463',
          currentMode: 'true',
          chartId: 'datanode_host_health_heatmap_id'
        },
        popoverContent: '#heatmapPopover',
        container: $ui[0]
      });
    });
    
    afterEach(function() {
      $ui.remove();
    });

    it('should retrieve the heatmap descriptor when "collectDescriptor" is invoked.', function() {
      var response = mockSimpleDescriptor,
        request;
      spyOn(heatmap.viewModel, 'collectData');
      heatmap.viewModel.collectDescriptor();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      expect(heatmap.viewModel.collectData).wasCalled();
    });

    it('should retrieve the heatmap descriptor when "collectDescriptor" is invoked. If the testName is changed while waiting for the response, it should be ignored.', function() {
      var response = mockSimpleDescriptor,
        request;
      spyOn(heatmap.viewModel, 'collectData');
      spyOn(heatmap.viewModel, 'descriptor');
      heatmap.viewModel.collectDescriptor();
      heatmap.options.urlParams.testName = 'blah';
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      expect(heatmap.viewModel.collectData).wasNotCalled();
      expect(heatmap.viewModel.descriptor).wasNotCalled();
    });

    it('should retrieve the heatmap descriptor when "collectDescriptor" is invoked and set thresholds if available.', function() {
      var response = mockDescriptorWithThresholds,
        request;
      spyOn(heatmap.viewModel, 'collectData');
      spyOn(heatmap.viewModel, 'thresholds').andCallThrough();
      heatmap.viewModel.collectDescriptor();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      expect(heatmap.viewModel.collectData).wasCalled();
      expect(heatmap.viewModel.thresholds).wasCalled();
    });
      
    it('should retrieved data from the server when collectData is invoked.', function() {
      var descriptorResponse = mockSimpleDescriptor,
        response = mockData,
        request;
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(descriptorResponse)
      });
      heatmap.viewModel.collectData();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      expect(heatmap.viewModel.groupCount()).toEqual(1);
      expect(heatmap.viewModel.cellCount()).toEqual(4);
      expect(heatmap.viewModel.cells['/default'].cells.length).toEqual(4);
    });
    

    
    it('should retrieved data from the server when collectData is invoked and generate threshold if needed.', function() {
      var descriptorResponse = mockSimpleDescriptor,
        response = mockDataGeneratedThresholds,
        displayScale,
        request;
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(descriptorResponse)
      });
      heatmap.viewModel.collectData();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      expect(heatmap.viewModel.thresholds().length).toEqual(5);
      expect(heatmap.viewModel.thresholds()[0].displayName).toEqual('13.8B - 16.0B');
      expect(heatmap.viewModel.thresholds()[4].displayName).toEqual('4.6B - 6.8B');
      var formatDisplay = heatmap.viewModel.formatDisplay;
      expect(formatDisplay(14)).toEqual('14.0B');
      expect(formatDisplay(14.123)).toEqual('14.1B');
      expect(formatDisplay(14.163)).toEqual('14.2B');
      expect(formatDisplay(1024)).toEqual('1.0KiB');
      expect(formatDisplay(1024*1024)).toEqual('1.0MiB');
      expect(formatDisplay(1024*1024*1024)).toEqual('1.0GiB');
      expect(formatDisplay(1024*1024*1024*1024)).toEqual('1.0TiB');
      expect(formatDisplay(1024*1024*1024*1024*1024)).toEqual('1.0PiB');
    });
      
    it('should retrieved data from the server when collectData is invoked. If the URL params have changed the content should be ignored.', function() {
      var descriptorResponse = mockSimpleDescriptor,
        response = mockData,
        request;
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(descriptorResponse)
      });
      heatmap.viewModel.collectData();
      request = mostRecentAjaxRequest();
      heatmap.options.urlParams.testName = 'blah';
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      expect(heatmap.viewModel.cells).toBeUndefined();
    });
    
    it('should retrieved data from the server when collectData is invoked. If the same data set is loaded multiple times, we shouldn\'t rerender the cells.', function() {
      var descriptorResponse = mockSimpleDescriptor,
        response = mockData,
        request,
        cells,
        cell;
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(descriptorResponse)
      });
      heatmap.viewModel.collectData();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      cells = heatmap.viewModel.cells['/default'].cells;
  
      heatmap.viewModel.collectData();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      _.each(heatmap.viewModel.cells['/default'].cells, function(cell){
        expect(cells).toContain(cell);
      });
    });
    
    it('should retrieved data from the server when collectData is invoked. If a new data set is loaded, we should rerender the cells.', function() {
      var descriptorResponse = mockSimpleDescriptor,
        response = mockData,
        request,
        cells,
        cell;
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(descriptorResponse)
      });
      heatmap.viewModel.collectData();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      cells = heatmap.viewModel.cells['/default'].cells;
      heatmap.options.urlParams.testName = 'blah';
      
      heatmap.viewModel.collectData();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      _.each(heatmap.viewModel.cells['/default'].cells, function(cell){
        expect(cells).toContain(cell);
      });
    });
    

    it('should activate a cell when it is clicked.', function() {
      var descriptorResponse = mockSimpleDescriptor,
        response = mockData,
        $cell,
        cellGroup,
        cellIndex,
        cellData,
        request;
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(descriptorResponse)
      });
      heatmap.viewModel.collectData();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      $cell = $(heatmap.viewModel.cells['/default'].cells[0]);
      spyOn(Util, 'setWindowLocation');
      cellGroup = parseInt($cell.data('group'), 10);
      cellIndex = parseInt($cell.data('cell'), 10);
      cellData = heatmap.viewModel.data()[cellGroup].values[cellIndex];
      $cell.click();
      expect(Util.setWindowLocation).wasCalledWith('/cmf/services/' + cellData.role.service + '/instances/' + cellData.role.id + '/status');
    });
  
    
    it('should set a cell to active if selected.', function() {
      var descriptorResponse = mockSimpleDescriptor,
        response = _.clone(mockData),
        selected = response[2],
        request;
      selected.selected = true;
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(descriptorResponse)
      });
      
      heatmap.viewModel.collectData();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });
      expect(heatmap.viewModel.active()).toEqual(selected);
    });
    
    it('should change the URLParams and reload the descriptor from the server when "changeChart" is invoked.', function() {
      var testName = 'testName', chartId = 'chartId';
      spyOn(heatmap.viewModel, 'collectDescriptor');
      heatmap.changeChart(testName, chartId);
      expect(heatmap.options.urlParams.testName).toEqual(testName);
      expect(heatmap.options.urlParams.chartId).toEqual(chartId);
      expect(heatmap.viewModel.collectDescriptor).wasCalled();
    });
  });
});
