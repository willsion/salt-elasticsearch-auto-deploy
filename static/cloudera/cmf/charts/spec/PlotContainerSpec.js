// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/charts/PlotContainer'
], function(PlotContainer) {
  describe("PlotContainer Tests", function() {
    var module, id = "plotContainer", options = {
      container: "#" + id,
      plot: {
        tsquery: "Some Query",
        chartType: "line"
      }
    };

    beforeEach(function() {
      $('<div></div>').attr("id", id).appendTo(document.body);
    });

    afterEach(function() {
      $("#" + id).remove();
      module.unsubscribe();
    });

    it("should create a PlotContainer object", function() {
      module = new PlotContainer(options);
      var plot = module.getPlot();
      expect(options.plot.tsquery).toEqual(plot.tsquery);
      expect(options.plot.chartType).toEqual(plot.chartType);
    });

    it("should call setChartType", function() {
      module = new PlotContainer(options);
      spyOn(module.getViewModel(), "setChartType").andCallThrough();
      module.setChartType("stackarea");
      expect(module.getViewModel().setChartType).wasCalledWith("stackarea");

      var plot = module.getPlot();
      expect(plot.chartType).toEqual("stackarea");
    });

    it("should call setTsquery", function() {
      module = new PlotContainer(options);
      module.setTsquery("SOMEOTHERQUERY");
      expect(module.getViewModel().tsquery()).toEqual("SOMEOTHERQUERY");
      var plot = module.getPlot();
      expect(plot.tsquery).toEqual("SOMEOTHERQUERY");
    });

    it("should call setDimension", function() {
      module = new PlotContainer(options);
      spyOn(module.getViewModel(), "setDimension");
      module.setDimension(10, 20);
      expect(module.getViewModel().setDimension).wasCalledWith(10, 20);
    });

    it("should call getBoundTsquery", function() {
      module = new PlotContainer(options);
      spyOn(module.getViewModel(), "getBoundTsquery");
      module.getBoundTsquery();
      expect(module.getViewModel().getBoundTsquery).wasCalled();
    });

    it("should test selection", function() {
      var newOptions = $.extend({}, options, {
        enableSelection: true
      });
      module = new PlotContainer(newOptions);
      var $container = $("#" + id);

      spyOn(module.getViewModel(), "getBoundTsquery");
      spyOn($, "publish");

      $container.trigger("click");
      expect($.publish).wasCalledWith("selectPlot", [options.plot]);
      expect($container.hasClass("selected")).toBeTruthy();

      $container.trigger("click");
      expect($.publish).wasCalledWith("unselectPlot", [options.plot]);
      expect($container.hasClass("selected")).toBeFalsy();
    });

    it("should propagate the setFilter call", function() {
      module = new PlotContainer(options);
      spyOn(module.visualizer, "setFilter");
      module.setFilter("foo");
      expect(module.visualizer.setFilter).wasCalledWith("foo");
    });

    it("should propagate the enableLoadAll parameter", function() {
      var newOptions = $.extend({}, options, {
        enableLoadAll: true
      });
      module = new PlotContainer(newOptions);
      expect(module.visualizer.options.enableLoadAll).toBeTruthy();
    });
  });
});
