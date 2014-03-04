// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/charts/ChartTypeSelector'
], function(ChartTypeSelector) {

  describe("ChartTypeSelector tests", function() {

    beforeEach(function(){
      $('<div id="chartTypeSelector"></div>').appendTo(document.body);
    });

    afterEach(function() {
      $("#chartTypeSelector").remove();
    });

    it("should set the chartType", function() {
      var selector = new ChartTypeSelector({
        container: "#chartTypeSelector"
      });

      spyOn($, "publish");
      selector.chartType("SomeNewChartType");
      expect($.publish).wasCalledWith("chartTypeChanged", ["SomeNewChartType"]);
    });
  });
});
