// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/charts/Plot',
  'cloudera/cmf/charts/TimeSeriesViewModel'
], function(Plot, TimeSeriesViewModel) {
  describe("TimeSeriesViewModel Tests", function() {
    var module, options = {
      tsquery: "Some Query",
      chartType: Plot.ChartType.LINE
    };

    beforeEach(function() {
    });

    afterEach(function() {
    });

    it("should create a TimeSeriesViewModel object", function() {
      module = new TimeSeriesViewModel(options);

      expect(module.renderer()).toEqual(Plot.ChartType.LINE);
      expect(module.offset()).toEqual("value");
      expect(module.interpolation()).toEqual("linear");
    });

    it("should create a TimeSeriesViewModel object for Stack area", function() {
      module = new TimeSeriesViewModel($.extend({}, options, {chartType: Plot.ChartType.STACKAREA}));

      expect(module.renderer()).toEqual("area");
      expect(module.offset()).toEqual("zero");
      expect(module.interpolation()).toEqual("linear");
    });

    it("should set the chartType", function() {
      module = new TimeSeriesViewModel(options);
      var config = {};
      var mockViz = {
        update: function(c) {
          config = c;
        },
        setDimension: function(width, height) {}
      };
      module.setVisualizer(mockViz);

      module.setChartType(Plot.ChartType.BAR);
      module.setDimension(10, 20);

      expect(config.interpolation).toEqual("linear");
      expect(config.renderer).toEqual(Plot.ChartType.BAR);
      expect(config.offset).toEqual("zero");
      expect(config.width).toEqual(10);
      expect(config.height).toEqual(20);

      expect(module.setChartType("SOME_DUMMY_CHART_TYPE")).toBeFalsy();
    });

    it("should resolve the context object", function() {
      module = new TimeSeriesViewModel($.extend({}, options, {
        tsquery: "SELECT * WHERE entityName = $FOO"
      }));
      var context = {
        "$FOO": "foo"
      };
      module.setContext(context);
      expect(module.getBoundTsquery()).toEqual('SELECT * WHERE entityName = "foo"');
    });

    it("should test updateConfig", function() {
      module = new TimeSeriesViewModel(options);
      var config = {};
      var mockViz = {
        update: function(c) {
          config = c;
        }
      };
      module.setVisualizer(mockViz);

      module.setYRange(10, 20);
      expect(config.ymin).toEqual(10);
      expect(config.ymax).toEqual(20);

      module.setYRange(undefined, 20);
      expect(config.ymin).toBeUndefined();
      expect(config.ymax).toEqual(20);

      module.setYRange(10, undefined);
      expect(config.ymin).toEqual(10);
      expect(config.ymax).toBeUndefined();

      module.setYRange(undefined, undefined);
      expect(config.ymin).toBeUndefined();
      expect(config.ymax).toBeUndefined();
    });
  });
});
