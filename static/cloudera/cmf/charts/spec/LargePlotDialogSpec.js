// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/charts/Plot',
  'cloudera/cmf/charts/LargePlotDialog'
], function(Plot, LargePlotDialog) {
  describe("LargePlotDialog Tests", function() {
    var module, id = "plotDialog";

    beforeEach(function() {
      $('<div id="' + id + '"></div>').appendTo(document.body);
      $("#" + id).append('<div class="modal-header"><h3/></div>');
      $("#" + id).append('<div class="modal-body"><div class="large-plot-container"/></div>');
      $("#" + id).append('<div class="modal-footer"/>');
    });

    afterEach(function() {
      $("#" + id).remove();
      module.unsubscribe();
    });

    it("should create a LargePlotDialog object", function() {
      var options = {
        container: "#" + id
      };
      module = new LargePlotDialog(options);
      spyOn(module.plotContainer, 'setChartType');
      spyOn(module.plotContainer, 'setYRange');
      spyOn(module.plotContainer, 'setTsquery');
      spyOn(module.plotContainer, 'render');
      spyOn(module, 'setTitle');

      var timeSeries = [{
        x: 0, y: 0
      }, {
        x: 1, y: 1
      }];

      var plot = {
        chartType: "bar",
        ymin: 10,
        ymax: 50,
        title: "Some Plot Title",
        tsquery: "Some Query",
        facetting: Plot.FACETTING_NONE
      };
      var subtitle = "Dont Care";

      $.publish("showPlotDetails", [plot, timeSeries, subtitle]);

      expect(module.plotContainer.setChartType).wasCalledWith("bar");
      expect(module.plotContainer.setYRange).wasCalledWith(plot.ymin, plot.ymax);
      expect(module.plotContainer.setTsquery).wasCalledWith(plot.tsquery);
      expect(module.plotContainer.render).wasCalledWith({
        tsquery: plot.tsquery,
        timeSeries: timeSeries
      });
      expect(module.setTitle).wasCalledWith(plot.title);

      plot = {
        chartType: "bar",
        ymin: 10,
        ymax: 50,
        title: "Some Plot Title",
        tsquery: "Some Query",
        facetting: Plot.FACETTING_SINGLE_PLOT
      };
      subtitle = "Some Subtitle";

      $.publish("showPlotDetails", [plot, timeSeries, subtitle]);
      expect(module.setTitle).wasCalledWith(subtitle);
    });
  });
});
