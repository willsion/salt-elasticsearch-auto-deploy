// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/charts/Plot'
], function(Plot) {
  describe("Plot Tests", function() {

    it("should create a Plot", function() {
      var options = {
        tsquery: "FOO",
        title: "BAR"
      };

      var plot = new Plot(options).getPlot();
      expect(plot.tsquery).toEqual("FOO");
      expect(plot.title).toEqual("BAR");
      expect(plot.chartType).toEqual(Plot.ChartType.LINE);
      expect(plot.facetting).toEqual(Plot.FACETTING_NONE);
    });
  });
});
