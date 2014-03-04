// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/include/HealthIssues',
  'json!/static/cms/tests/HealthIssues1.json'
], function(HealthIssues, HealthIssuesData) {

  describe("HealthIssues", function() {
    var viewModel, $testContainer;
    var containerId = "testContainer";

    var options = {
      data : HealthIssuesData,
      displayLimit: 1000,
      container : "#" + containerId,
      mgmtClusterName : "Cloudera Management Services"
    };

    beforeEach(function() {
      $testContainer = $("<div>").attr("id", containerId).appendTo($("body"));

      viewModel = new HealthIssues(options);
    });

    afterEach(function() {
      $testContainer.remove();
      viewModel = null;
    });

    it("should be loaded", function() {
      expect(viewModel.loaded()).toBeTruthy();
    });

    it("should show entity view by default", function() {
      expect(viewModel.view()).toEqual("ENTITY");
    });

    it("should show entity view", function() {
      viewModel.setViewToEntity();
      expect(viewModel.view()).toEqual("ENTITY");
    });

    it("should show check view", function() {
      viewModel.setViewToCheck();
      expect(viewModel.view()).toEqual("CHECK");
    });

    it("should have all data", function() {
      expect(viewModel.unhealthyChecks().length).toEqual(HealthIssuesData.unhealthyChecks.length);
      expect(viewModel.rawUnhealthyEntities().length).toEqual(HealthIssuesData.unhealthyEntities.length);
      expect(viewModel.unhealthyEntities().length).toEqual(HealthIssuesData.unhealthyEntities.length);
    });

    it("should report issues", function() {
      expect(viewModel.isNoIssues()).toBeFalsy();
    });

    it("should toggle checks table", function() {
      expect(viewModel.showChecks()).toBeTruthy();
      viewModel.toggleChecks();
      expect(viewModel.showChecks()).toBeFalsy();
      viewModel.toggleChecks();
      expect(viewModel.showChecks()).toBeTruthy();
    });

    it("should show errors because errors exist", function() {
      expect(viewModel.errorsShown()).toBeTruthy();
    });

    it("should hide concerning because errors exist", function() {
      expect(viewModel.concerningsShown()).toBeFalsy();
    });

    it("should toggle errors and warnings", function() {
      viewModel.showErrors();
      expect(viewModel.errorsShown()).toBeTruthy();
      expect(viewModel.concerningsShown()).toBeFalsy();

      viewModel.showConcernings();
      expect(viewModel.errorsShown()).toBeFalsy();
      expect(viewModel.concerningsShown()).toBeTruthy();
    });

    it("should report 5 entity errors", function() {
      viewModel.setViewToEntity();
      expect(viewModel.redLevelCount()).toEqual(5);
    });

    it("should report 3 entity concernings", function() {
      viewModel.setViewToEntity();
      expect(viewModel.yellowLevelCount()).toEqual(3);
    });

    it("should report 2 check errors", function() {
      viewModel.setViewToCheck();
      expect(viewModel.redLevelCount()).toEqual(2);
    });

    it("should report 1 check errors", function() {
      viewModel.setViewToCheck();
      expect(viewModel.yellowLevelCount()).toEqual(1);
    });

    it("should build 2 sorted CheckRow objects when showing errors", function() {
      viewModel.showErrors();
      var arr = viewModel.unhealthyCheckRows();
      expect(arr.length).toEqual(2);
      expect(arr[0].name).toEqual("Process Status");
      expect(arr[0].number).toEqual(4);
      expect(arr[0].health).toEqual("RED");
      expect(arr[1].name).toEqual("Active HBase Master Health");
      expect(arr[1].number).toEqual(1);
      expect(arr[1].health).toEqual("RED");
    });

    it("should build 1 CheckRow object when showing concerning", function() {
      viewModel.showConcernings();
      var arr = viewModel.unhealthyCheckRows();
      expect(arr.length).toEqual(1);
      expect(arr[0].name).toEqual("Agent Status");
      expect(arr[0].number).toEqual(3);
      expect(arr[0].health).toEqual("YELLOW");
    });

    it("should build 1 EntitySection object with 5 entries when showing errors", function() {
      viewModel.showErrors();
      var arr = viewModel.unhealthyEntitySections();
      expect(arr.length).toEqual(1);
      expect(arr[0].clusterName).toEqual("Cluster 1 - CDH4");
      expect(arr[0].numEntries).toEqual(5);
      expect(arr[0].entityTypeToTotalUnhealthy.ROLE).toEqual(4);
      expect(arr[0].entityTypeToTotalUnhealthy.SERVICE).toEqual(1);
    });

    it("should build 1 EntitySection object with 3 entries when showing concerning", function() {
      viewModel.showConcernings();
      var arr = viewModel.unhealthyEntitySections();
      expect(arr.length).toEqual(1);
      expect(arr[0].clusterName).toEqual("Cluster 1 - CDH4");
      expect(arr[0].numEntries).toEqual(3);
      expect(arr[0].entityTypeToTotalUnhealthy.HOST).toEqual(3);
    });

    it("should report results in check mode showing errors", function() {
      viewModel.setViewToCheck();
      viewModel.showErrors();
      expect(viewModel.isNoResults()).toBeFalsy();
    });

    it("should report results in check mode showing concerning", function() {
      viewModel.setViewToCheck();
      viewModel.showConcernings();
      expect(viewModel.isNoResults()).toBeFalsy();
    });
    
    it("should report results in entity mode showing errors", function() {
      viewModel.setViewToEntity();
      viewModel.showErrors();
      expect(viewModel.isNoResults()).toBeFalsy();
    });

    it("should report results in entity mode showing concerning", function() {
      viewModel.setViewToEntity();
      viewModel.showConcernings();
      expect(viewModel.isNoResults()).toBeFalsy();
    });

    it("should toggle entity table visibility", function() {
      viewModel.showErrors();
      expect(viewModel.isClusterCollapsed("Cluster 1 - CDH4")).toBeFalsy();
      viewModel.toggleCluster("Cluster 1 - CDH4");
      expect(viewModel.isClusterCollapsed("Cluster 1 - CDH4")).toBeTruthy();
      viewModel.toggleCluster("Cluster 1 - CDH4");
      expect(viewModel.isClusterCollapsed("Cluster 1 - CDH4")).toBeFalsy();
    });

    it("should update data", function() {
      $.publish("updateHealthIssues", [{
        unhealthyChecks : [],
        unhealthyEntities : []
      }]);
      expect(viewModel.unhealthyChecks.length).toEqual(0);
      expect(viewModel.rawUnhealthyEntities.length).toEqual(0);
      expect(viewModel.unhealthyEntities.length).toEqual(0);
      expect(viewModel.isNoResults()).toBeTruthy();
    });

    it("should filter by service", function() {
      $.publish("healthIssuesFilterChanged", ["HBASE-1", ""]);
      expect(viewModel.redLevelCount()).toEqual(5);
      expect(viewModel.yellowLevelCount()).toEqual(0);
      var arr = viewModel.unhealthyEntitySections();
      // get an unhealhy entity
      expect(arr[0].entityTypeToEntries.SERVICE[0].serviceName).toEqual("HBASE-1");
    });

    it("should filter by cluster and host", function() {
      $.publish("healthIssuesFilterChanged", ["", "Cluster 1 - CDH4"]);
      expect(viewModel.redLevelCount()).toEqual(0);
      expect(viewModel.yellowLevelCount()).toEqual(3);
      var arr = viewModel.unhealthyEntitySections();
      // get an unhealthy entity
      expect(arr[0].entityTypeToEntries.HOST[0].clusterName).toEqual("Cluster 1 - CDH4");
    });

    it("should all issues", function() {
      viewModel.allShown(true);

      viewModel.showErrors();
      expect(viewModel.errorsShown()).toBeTruthy();
      expect(viewModel.concerningsShown()).toBeTruthy();

      viewModel.showConcernings();
      expect(viewModel.errorsShown()).toBeTruthy();
      expect(viewModel.concerningsShown()).toBeTruthy();
    });
  });
});
