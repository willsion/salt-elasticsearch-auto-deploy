// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/include/ConfigIssues',
  'json!/static/cms/tests/ConfigIssues1.json'
], function(ConfigIssues, ConfigIssuesData) {

  describe("ConfigIssues", function() {
    var viewModel, $testContainer;
    var containerId = "testContainer";

    var options = {
      data : ConfigIssuesData,
      displayLimit: 1000,
      groupBy : "clusterDisplayName",
      container : "#" + containerId,
      mgmtClusterName : "Cloudera Management Services"
    };

    beforeEach(function() {
      $testContainer = $("<div>").attr("id", containerId).appendTo($("body"));

      viewModel = new ConfigIssues(options);
    });

    afterEach(function() {
      $testContainer.remove();
      viewModel = null;
    });

    it("should show errors because errors exist", function() {
      expect(viewModel.errorsShown()).toBeTruthy();
    });

    it("should hide warnings because errors exist", function() {
      expect(viewModel.warningsShown()).toBeFalsy();
    });

    it("should toggle warnings and errors", function() {
      viewModel.showWarnings();
      expect(viewModel.errorsShown()).toBeFalsy();
      expect(viewModel.warningsShown()).toBeTruthy();

      viewModel.showErrors();
      expect(viewModel.errorsShown()).toBeTruthy();
      expect(viewModel.warningsShown()).toBeFalsy();
    });

    it("should group by cluster display name", function() {
      expect(viewModel.groupBy()).toEqual("clusterDisplayName");
    });

    it("should be loaded", function() {
      expect(viewModel.loaded()).toBeTruthy();
    });

    it("should not filter by service", function() {
      expect(viewModel.serviceFilter()).toBeFalsy();
    });

    it("should have all data", function() {
      expect(viewModel.rawData().length).toEqual(ConfigIssuesData.length);
      expect(viewModel.data().length).toEqual(ConfigIssuesData.length);
    });

    it("should have 1 error", function() {
      expect(viewModel.errorLevelCount()).toEqual(1);
    });

    it("should have 6 warnings", function() {
      expect(viewModel.warnLevelCount()).toEqual(6);
    });

    it("should have 1 group showing errors", function() {
      viewModel.showErrors();
      var arr = viewModel.actionablesBySelectedGroup();
      expect(arr.length).toEqual(1);
      expect(arr[0].key).toEqual("Cluster 1 - CDH4");
    });

    it("should have 2 sorted groups showing warnings", function() {
      viewModel.showWarnings();
      var arr = viewModel.actionablesBySelectedGroup();
      expect(arr.length).toEqual(2);
      expect(arr[0].key).toEqual("Cluster 1 - CDH4");
      expect(arr[1].key).toEqual(options.mgmtClusterName);
    });

    it("should toggle visibility", function() {
      viewModel.showWarnings();
      expect(viewModel.isCollapsed("Cluster 1 - CDH4")).toBeFalsy();
      viewModel.toggle("Cluster 1 - CDH4");
      expect(viewModel.isCollapsed("Cluster 1 - CDH4")).toBeTruthy();
      viewModel.toggle("Cluster 1 - CDH4");
      expect(viewModel.isCollapsed("Cluster 1 - CDH4")).toBeFalsy();
    });

    it("should update data", function() {
      $.publish("updateActionables", [{}]);
      expect(viewModel.rawData()).toEqual({});
      expect(viewModel.data()).toEqual({});
      expect(viewModel.isNoResults()).toBeTruthy();
    });

    it("should filter by service", function() {
      $.publish("configIssuesFilterChanged", ["HDFS-1", ""]);
      expect(viewModel.errorLevelCount()).toEqual(0);
      expect(viewModel.warnLevelCount()).toEqual(1);
      var arr = viewModel.actionablesBySelectedGroup();
      // get the only actionable
      expect(arr[0].values()[0].metadata.serviceName).toEqual("HDFS-1");
    });

    it("should filter by cluster and host", function () {
      $.publish("configIssuesFilterChanged", ["", "Cluster 1 - CDH4"]);
      expect(viewModel.errorLevelCount()).toEqual(1);
      expect(viewModel.warnLevelCount()).toEqual(3);
      var arr = viewModel.actionablesBySelectedGroup();
      // get the only actionable
      expect(arr[0].values()[0].metadata.clusterDisplayName).toEqual("Cluster 1 - CDH4");
    });

    it("should show all issues", function() {
      viewModel.showErrors();
      expect(viewModel.filteredData().length).toEqual(1);
      viewModel.showWarnings();
      expect(viewModel.filteredData().length).toEqual(6);
      viewModel.allShown(true);
      expect(viewModel.filteredData().length).toEqual(7);
    });
  });
});
