// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/charts/include/heatmap/HeatmapPopupLauncher"
], function(HeatmapPopupLauncher) {
  describe("HeatmapPopupLauncher Tests", function() {
    beforeEach(function() {
      jasmine.Ajax.useMock();
    });

    it("should render the popup's URL.", function() {
      var $elem = $("<a>");
      $elem
        .attr("data-timestamp", 100)
        .attr("data-current-mode", true)
        .attr("data-ajax-url", "url")
        .attr("data-key", "bar");

      $elem.HeatmapPopupLauncher();

      jQuery.publish("heatmapSelectionChanged", ["myTestName"]);
      expect($elem.attr("href")).toEqual("url?timestamp=100&currentMode=true&testName=myTestName&key=bar");

      jQuery.publish("markerDateChanged", [new Date(200), false]);
      jQuery.publish("heatmapSelectionChanged", ["myTestName1"]);
      expect($elem.attr("href")).toEqual("url?timestamp=200&currentMode=false&testName=myTestName1&key=bar");
    });
  });
});
