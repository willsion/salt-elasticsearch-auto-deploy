// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmon/page/TaskDistribution'
], function(TaskDistribution) {
  describe("TaskDistribution tests", function() {

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();

      $('<table id="heatmapTable"><tr><td class="value" data-x-max="2" data-x-min="1" data-y-min="10" data-y-max="20"></td></tr></table>').appendTo("body");
      $('<div id="taskTrackerTable"></div>').appendTo("body");
    });

    it("should trigger a URL to load the task tracker table.", function() {
      var module = new TaskDistribution({
        jobId: "123",
        query: "A_CANNED_QUERY",
        tableUrl: "dontcare",
        tableContainer: "#taskTrackerTable",
        heatmapContainer: "#heatmapTable"
      });
      $("#heatmapTable").find("td").trigger("click");

      var request = mostRecentAjaxRequest();
      expect(request.url).toEqual("dontcare?activityName=123&query=A_CANNED_QUERY&xRange.start=1&xRange.end=2&yRange.start=10&yRange.end=20");
    });

    afterEach(function() {
      $("#heatmapTable").remove();
      $("#taskTrackerTable").remove();
    });
  });
});
