// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  "cloudera/common/Monitor",
  'cloudera/cmf/charts/Plot',
  'cloudera/cmf/charts/TimeSeriesVisualizer',
  'cloudera/common/UrlParams',
  'underscore'
], function(Util, Monitor, Plot, TimeSeriesVisualizer, UrlParams, _) {
  describe("TimeSeriesVisualizer Tests", function() {
    var module, id="tcVisualizerContainer", options = {
      plot: {
        tsquery: "Some Query",
        title: "My Chart Title",
        chartType: Plot.ChartType.LINE
      },
      container: "#" + id,
      enableFacets: true
    }, mockVisualizer = {
      isRendered: function() {
        return false;
      },
      render: function() {},
      renderPlaceholder: function() {}
    };
    var timeSeriesResponse = {
      timeSeries: [ {
        data: [{x:1,y:2}],
        metadata: {
          attributes: {}
        }
      }, {
        data: [{x:2,y:3}],
        metadata: {
          attributes: {}
        }
      }, {
        // should ignore this one because it is empty
        data: [],
        metadata: {}
      }, {
        // should ignore this one too.
      } ]
    };
    var monitor = new Monitor("TimeSeriesVisualizer.render");

    beforeEach(function() {
      $('<div id="' + id + '"></div>').appendTo(document.body);
    });

    afterEach(function() {
      module.unsubscribe();
      $("#" + id).remove();
    });

    it("should create a TimeSeriesVisualizer object", function() {
      module = new TimeSeriesVisualizer(options);

      expect(module.facets).toBeDefined();
      expect(module.getViewModel()).toBeDefined();
    });

    it("should test the TimeSeriesVisualizer.render method", function() {
      module = new TimeSeriesVisualizer(options);

      spyOn(module.facets, 'update');
      spyOn(module, 'createVisualizer').andReturn(mockVisualizer);
      spyOn(mockVisualizer, 'renderPlaceholder');

      module.render(timeSeriesResponse);

      expect($("#" + id).find(".yAxis").length).toEqual(2);
      expect($("#" + id).find(".chart").length).toEqual(2);
      expect($("#" + id).find(".chart-container").length).toEqual(2);
      expect($("#" + id).find(".chart-title").length).toEqual(3);

      expect(mockVisualizer.renderPlaceholder).wasCalled();
      expect(module.vizs.length).toEqual(2);
      expect(module.facets.update).wasCalled();
    });

    it("should test the TimeSeriesVisualizer.render method without yAxis", function() {
      var newOptions = $.extend(true, {}, options);
      newOptions.plot.showYAxis = false;
      module = new TimeSeriesVisualizer(newOptions);

      spyOn(module.facets, 'update');
      spyOn(module, 'createVisualizer').andReturn(mockVisualizer);
      spyOn(mockVisualizer, 'renderPlaceholder');

      module.render(timeSeriesResponse);

      expect($("#" + id).find(".yAxis").length).toEqual(0);
      expect($("#" + id).find(".chart").length).toEqual(2);
      expect($("#" + id).find(".chart-container").length).toEqual(2);
      expect($("#" + id).find(".chart-title").length).toEqual(3);

      expect(mockVisualizer.renderPlaceholder).wasCalled();
      expect(module.vizs.length).toEqual(2);
      expect(module.facets.update).wasCalled();
    });

    it("should test the TimeSeriesVisualizer.regroupTimeSeries method", function() {
      module = new TimeSeriesVisualizer(options);

      var timeSeriesArray = [ {
        data: [{x:1,y:2}],
        metadata: {
          attributes: {
            "a": "a0",
            "b": "b1"
          }
        }
      }, {
        data: [{x:2,y:3}],
        metadata: {
          attributes: {
            "a": "a0",
            "b": "b0"
          }
        }
      }, {
        data: [{x:3,y:4}],
        metadata: {
          attributes: {
            "a": "a0",
            "b": "b0"
          }
        }
      } ];

      var grouped = module.regroupTimeSeries(timeSeriesArray, Plot.FACETTING_SINGLE_PLOT);
      expect(grouped[0].value).toEqual(timeSeriesArray);

      grouped = module.regroupTimeSeries(timeSeriesArray, "a");
      expect(grouped[0].value.length).toEqual(3);

      grouped = module.regroupTimeSeries(timeSeriesArray, "b");
      expect(grouped[0].value.length).toEqual(2);
      expect(grouped[1].value.length).toEqual(1);

      grouped = module.regroupTimeSeries(timeSeriesArray, "a,b");
      expect(grouped[0].value.length).toEqual(2);
      expect(grouped[1].value.length).toEqual(1);

      grouped = module.regroupTimeSeries(timeSeriesArray, Plot.FACETTING_NONE);
      expect(grouped[0].value[0]).toEqual(timeSeriesArray[0]);
      expect(grouped[1].value[0]).toEqual(timeSeriesArray[1]);
      expect(grouped[2].value[0]).toEqual(timeSeriesArray[2]);
    });

    it("should catch the clickFacetGroup event", function() {
      module = new TimeSeriesVisualizer(options);

      spyOn(module, "render");
      $.publish("clickFacetGroup", [Plot.FACETTING_NONE]);
      expect(module.render).wasCalled();
    });

    function testRender(module) {
      spyOn(module, 'createVisualizer').andReturn(mockVisualizer);
      spyOn(mockVisualizer, 'renderPlaceholder');

      module.render(timeSeriesResponse);
    }

    it("should ensure enlargeable class is added", function() {
      module = new TimeSeriesVisualizer(options);
      testRender(module);
      var $chartContainer = $("#" + id).find(".chart-container");
      expect($chartContainer.hasClass("enlargeable")).toBeTruthy();
    });

    it("should ensure enlargeable class is not added", function() {
      var newOptions = $.extend({}, options, {
        enableEnlarging: false
      });
      module = new TimeSeriesVisualizer(newOptions);
      testRender(module);
      var $chartContainer = $("#" + id).find(".chart-container");
      expect($chartContainer.hasClass("enlargeable")).toBeFalsy();
    });

    it("should test the various actions", function() {
      var newOptions = $.extend(true, {
        enableEditing: true,
        enableCloning: true,
        enableRemoving: true
      }, options);
      module = new TimeSeriesVisualizer(newOptions);
      testRender(module);

      spyOn($, "publish");

      var $container = $("#" + id);
      $container.find(".edit-chart").trigger("click");
      expect($.publish).wasCalled();
      expect($.publish.mostRecentCall.args[0]).toEqual("editPlot");

      $container.find(".clone-chart").trigger("click");
      expect($.publish).wasCalled();
      expect($.publish.mostRecentCall.args[0]).toEqual("clonePlot");

      $container.find(".remove-chart").trigger("click");
      expect($.publish).wasCalled();
      expect($.publish.mostRecentCall.args[0]).toEqual("removePlot");
    });

    it("should test setDimension", function() {
      module = new TimeSeriesVisualizer(options);

      spyOn(module, "adjustTitleWidth");
      spyOn(module, "setChartDimension");

      module.setDimension(200, 300);

      expect(module.adjustTitleWidth.mostRecentCall.args[1]).toBeDefined();
      expect(module.setChartDimension.mostRecentCall.args[1]).toBeDefined();
    });

    it('should render a legend conditional on the number of streams', function() {
      var createFakePlot = function() {
        return {
          data: [{x: 1, y: 2}],
          metadata: {
            attributes: {}
          }
        };
      };
      var newOptions = _.defaults({
        plot: {
          tsquery: "Some Query",
          chartType: Plot.ChartType.LINE,
          showLegend: true,
          facetting: Plot.FACETTING_SINGLE_PLOT
        }
      }, options);
      module = new TimeSeriesVisualizer(newOptions);
      var timeSeriesResponse = {
        timeSeries: _.map(_.range(50), createFakePlot)
      };
      spyOn(module, 'addLegendContainer');
      spyOn(module, 'createVisualizer').andCallThrough();
      module.render(timeSeriesResponse);
      expect(module.addLegendContainer).wasCalled();
      module.addLegendContainer.reset();
      var visualizerArgs = module.createVisualizer.mostRecentCall.args;
      // Verify that we told the visualizer we want a legend.
      expect(visualizerArgs[0].showLegend).toBeTruthy();

      // Add another streams and we're over the threshold.
      timeSeriesResponse.timeSeries.push(createFakePlot());
      module.render(timeSeriesResponse);
      expect(module.addLegendContainer).wasNotCalled();
      // Verify that we told the visualizer we don't want a legend.
      visualizerArgs = module.createVisualizer.mostRecentCall.args;
      expect(visualizerArgs[0].showLegend).toBeFalsy();
    });

    it("should test setFilter", function() {
      module = new TimeSeriesVisualizer(options);
      spyOn(module, "deferRenderVisibleCharts");
      module.render(timeSeriesResponse);

      module.setFilter("Hello World");
      expect(module.$chartsContainer.find(".chart-container:visible").length).toEqual(0);

      module.setFilter("Chart");
      expect(module.$chartsContainer.find(".chart-container:visible").length).toEqual(2);
      expect(module.deferRenderVisibleCharts).wasCalled();

      // Make sure if we render again, the existing filter is used.
      spyOn(module, "setFilter");
      module.render(timeSeriesResponse);
      expect(module.setFilter).wasCalledWith("Chart");
    });

    it("should test matchesFilter", function() {
      module = new TimeSeriesVisualizer(options);
      module.timeSeriesResponse = {
        timeSeries: [ "dontcare" ]
      };
      spyOn(module, "render");

      // User entered the text "Hello Cloudera"
      module.setFilter("Hello Cloudera");

      // This item should match.
      expect(module.matchesFilter("Hello Cloudera Manager")).toBeTruthy();

      // This item should match too.
      expect(module.matchesFilter("Cloudera Manager Hello")).toBeTruthy();

      // This item should not match because Cloudera is not present.
      expect(module.matchesFilter("Hello Manager")).toBeFalsy();
    });

    it("should make sure matched charts are rendered", function() {
      var newOptions = $.extend({}, options, {
        plot: {
          tsquery: "Some Query",
          chartType: Plot.ChartType.LINE,
          title: "My Plot Title"
        }
      });
      spyOn($.fn, "hide").andCallThrough();

      module = new TimeSeriesVisualizer(newOptions);

      testRender(module);
      module.setFilter("Plot Title");
      // After the first render, the remainingQuery value was not defined.
      // After setting the filter, because the filter query matches the plot title,
      // the remainingQuery value should still be "", so render should not be called again
      //
      // There are two charts, so the count is 2 from the first render.
      expect(module.createVisualizer.callCount).toEqual(2);
      expect($.fn.hide).wasNotCalled();
    });

    it("should make sure unmatched charts are not rendered", function() {
      var newOptions = $.extend({}, options, {
        plot: {
          tsquery: "Some Query",
          chartType: Plot.ChartType.LINE,
          title: "My Plot Title"
        }
      });
      spyOn($.fn, "hide").andCallThrough();

      module = new TimeSeriesVisualizer(newOptions);
      testRender(module);
      module.setFilter("Blah Blah");
      // After the first render, the remainingQuery value was not defined.
      // After setting the filter, because the filter query doesn't match anything.
      // the remainingQuery value should still be "Blah Blah", because it doesn't
      // match anything, render should not be called again.
      //
      // There are two charts, so the count is 2 from the first render.
      expect(module.createVisualizer.callCount).toEqual(2);
      // Because we don't match anything, The title should be hidden.
      expect($.fn.hide).wasCalled();
    });

    it("should not call enableProgressiveLoading if enableLoadAll is true", function() {
      var newOptions = $.extend({}, options, {
        enableLoadAll: true
      });
      spyOn(TimeSeriesVisualizer.prototype, "enableProgressiveLoading").andCallThrough();
      module = new TimeSeriesVisualizer(newOptions);
      expect(TimeSeriesVisualizer.prototype.enableProgressiveLoading).wasNotCalled();
    });

    it("should call enableProgressiveLoading if enableLoadAll is undefined or false", function() {
      var newOptions = $.extend({}, options, {
        enableLoadAll: false
      });
      spyOn(TimeSeriesVisualizer.prototype, "enableProgressiveLoading").andCallThrough();
      module = new TimeSeriesVisualizer(newOptions);
      expect(TimeSeriesVisualizer.prototype.enableProgressiveLoading).wasCalled();
    });

    it("should call render if enableLoadAll is true", function() {
      var newOptions = $.extend({}, options, {
        enableLoadAll: true
      });
      module = new TimeSeriesVisualizer(newOptions);
      spyOn(module, 'createVisualizer').andReturn(mockVisualizer);
      spyOn(mockVisualizer, "render");
      spyOn(mockVisualizer, "renderPlaceholder");
      module.render(timeSeriesResponse);
      expect(mockVisualizer.render).wasCalled();
      expect(mockVisualizer.renderPlaceholder).wasNotCalled();
    });

    it("should call renderPlaceholder if enableLoadAll is false", function() {
      var newOptions = $.extend({}, options, {
        enableLoadAll: false
      });
      module = new TimeSeriesVisualizer(newOptions);
      spyOn(module, 'createVisualizer').andReturn(mockVisualizer);
      spyOn(mockVisualizer, "render");
      spyOn(mockVisualizer, "renderPlaceholder");
      module.render(timeSeriesResponse);

      expect(mockVisualizer.render).wasNotCalled();
      expect(mockVisualizer.renderPlaceholder).wasCalled();
    });

    it("should test shouldRender and result in false", function() {
      module = new TimeSeriesVisualizer(options);
      // too far above
      expect(module.shouldRender(50, 100, 200, 800)).toBeFalsy();
      // too far below
      expect(module.shouldRender(50, 100, 10, 20)).toBeFalsy();
    });

    it("should test shouldRender and result in true", function() {
      module = new TimeSeriesVisualizer(options);
      // same as the view port.
      expect(module.shouldRender(20, 100, 20, 100)).toBeTruthy();
      // top edge same as the view port
      expect(module.shouldRender(20, 100, 20, 30)).toBeTruthy();
      // bottom edge is within the view port.
      expect(module.shouldRender(20, 100, 10, 30)).toBeTruthy();
      // completely within the view port.
      expect(module.shouldRender(20, 100, 30, 80)).toBeTruthy();
      // top edge is within the view port.
      expect(module.shouldRender(20, 100, 80, 120)).toBeTruthy();
      // bottom edge same as the view port
      expect(module.shouldRender(20, 100, 80, 100)).toBeTruthy();
      // larger than the view port.
      expect(module.shouldRender(50, 100, 20, 200)).toBeTruthy();
    });

    it("should test deferRenderVisibleCharts", function() {
      module = new TimeSeriesVisualizer(options);
      Util.setTestMode(false);
      spyOn(_, "defer");
      module.deferRenderVisibleCharts();
      expect(_.defer).wasCalled();
      Util.setTestMode(true);
    });

    it("should test renderVisibleChartWithinRange", function() {
      module = new TimeSeriesVisualizer(options);
      spyOn(module, 'createVisualizer').andReturn(mockVisualizer);
      spyOn(mockVisualizer, 'render');

      // Call render once to pass in the data.
      module.render(timeSeriesResponse);
      var $chartContainer = $("#" + id).find(".chart-container:first");
      spyOn($chartContainer, "offset").andReturn({
        top: 50, left: 0
      });
      spyOn($chartContainer, "height").andReturn(30);
      module.renderVisibleChartWithinRange($chartContainer, 0, 100);
      expect(mockVisualizer.render).wasCalled();
      expect(mockVisualizer.render.callCount).toEqual(1);

      module.renderVisibleChartWithinRange($chartContainer, 100, 200);
      expect(mockVisualizer.render.callCount).toEqual(1);
    });

    it("should test renderVisibleCharts", function() {
      module = new TimeSeriesVisualizer(options);
      // Call render once to pass in the data.
      module.render(timeSeriesResponse);
      spyOn(module, "renderVisibleChartWithinRange");
      spyOn(module, "renderInvisibleChartsWithPlaceholder");

      module.renderVisibleCharts($(window));
      expect(module.renderVisibleChartWithinRange).wasCalled();

      module.$chartsContainer.find(".chart-container").hide();
      module.renderVisibleCharts($(window));
      expect(module.renderInvisibleChartsWithPlaceholder).wasCalled();
    });

    it("should test showPlotDetails", function() {
      module = new TimeSeriesVisualizer(options);
      // Call render once to pass in the data.
      module.render(timeSeriesResponse);
      spyOn($, "publish");

      var $chartContainer = $("#" + id).find(".chart-container:first");
      $chartContainer.trigger("click");

      expect($.publish).wasCalled();
      expect($.publish.mostRecentCall.args[0]).toEqual("showPlotDetails");
      expect($.publish.mostRecentCall.args[1][2]).toEqual("My Chart Title");
    });

    it("should test calculateDynamicRange", function() {
      module = new TimeSeriesVisualizer(options);
      module.viewModel.facetting("metric");

      var timeSeriesResponse = {
        timeSeries: [ {
          data: [{x:1,y:2}, {x:2,y:4}],
          metadata: {
            metric: "Metric 1",
            attributes: {}
          }
        }, {
          data: [{x:2,y:3}, {x:3,y:5}],
          metadata: {
            metric: "Metric 1",
            attributes: {}
          }
        }, {
          data: [{x:3,y:4}, {x:4,y:10}],
          metadata: {
            metric: "Metric 2",
            attributes: {}
          }
        } ]
      };
      var groupedTimeSeries = module.getGroupedTimeSeries(timeSeriesResponse, monitor);
      module.calculateDynamicRange(groupedTimeSeries, monitor);
      expect(groupedTimeSeries[0].ymin).toEqual(2);
      expect(groupedTimeSeries[0].ymax).toEqual(5);
      expect(groupedTimeSeries[1].ymin).toEqual(4);
      expect(groupedTimeSeries[1].ymax).toEqual(10);
    });

    it("should update the url when facet changes", function() {
      module = new TimeSeriesVisualizer(options);
      spyOn(UrlParams, "set");
      spyOn(module, "render");
      $.publish("clickFacetGroup", ["hostname"]);
      expect(UrlParams.set).wasCalledWith("facetting", "hostname");
    });
});
});
