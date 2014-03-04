// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/chart/TimeRange',
  'cloudera/cmf/charts/ChartsSearchPage',
  'cloudera/common/UrlParams'
], function(TimeRange, ChartsSearchPage, UrlParams) {
  describe("ChartsSearchPage Tests", function() {
    var module, searchId = "chartsSearchContainer",
      resultId = "chartsResultContainer", options;

    beforeEach(function() {
      options = {
        searchContainer: "#" + searchId,
        resultContainer: "#" + resultId,
        timeRange: new TimeRange(new Date(1), new Date(2)),
        metric: "",
        plot: {},
        recentUri: "dontcare",
        searchUri: "dontcare"
      };
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $('<div id="' + searchId + '">' +
        '<int class="metricInput" type="hidden"/>' +
        '<int class="tsqueryInput" data-bind="value: tsquery" type="hidden"/>' +
        '</div>').appendTo(document.body);
      $('<div id="' + resultId + '">').appendTo(document.body);
      $('<div class="chart-type-selector"></div>').appendTo($("#" + resultId));
      $('<div class="chart-range-selector"></div>').appendTo($("#" + resultId));
    });

    afterEach(function() {
      $("#" + searchId).remove();
      $("#" + resultId).remove();
      module.unsubscribe();
    });

    it("should initialize things properly", function() {
      module = new ChartsSearchPage(options);
    });

    it("should update plot options from url hash on page load", function() {
      UrlParams.params = {
        tsquery: "select cpu_percent",
        ymin:10,
        ymax: 100,
        width: 400,
        height: 200,
        facetting: 'hostname',
        chartType: 'bar'
      };
      module = new ChartsSearchPage(options);
      expect(module.chartsSearch.tsquery()).toEqual('select cpu_percent');
      expect(module.chartsSearchResult.plotContainer.args.plot.chartType).toEqual('bar');
      expect(module.chartsSearchResult.plotContainer.args.plot.facetting).toEqual('hostname');
      expect(module.chartsSearchResult.plotContainer.args.plot.width).toEqual(400);
      expect(module.chartsSearchResult.plotContainer.args.plot.height).toEqual(200);
      expect(module.chartsSearchResult.plotContainer.args.plot.ymin).toEqual(10);
      expect(module.chartsSearchResult.plotContainer.args.plot.ymax).toEqual(100);
    });

    it("should use the correct default values when url has no parameters", function() {
      UrlParams.params = {
      };
      module = new ChartsSearchPage(options);
      expect(module.chartsSearch.tsquery()).toEqual('');
      expect(module.chartsSearchResult.plotContainer.args.plot.chartType).toEqual('line');
      expect(module.chartsSearchResult.plotContainer.args.plot.facetting).toEqual('__no_facetting__');
      expect(module.chartsSearchResult.plotContainer.args.plot.width).toEqual(undefined);
      expect(module.chartsSearchResult.plotContainer.args.plot.height).toEqual(undefined);
      expect(module.chartsSearchResult.plotContainer.args.plot.ymin).toEqual(undefined);
      expect(module.chartsSearchResult.plotContainer.args.plot.ymax).toEqual(undefined);
    });

    it("should extend plot options with the parameters in the url hash", function() {
      options.plot = {
        tsquery: 'select stuff',
        facetting: '__single_plot__',
        chartType: 'bar'
      };

      UrlParams.params = {
        ymin:20,
        ymax: 200,
        width: 500,
        height: 250
      };
      module = new ChartsSearchPage(options);
      var plot = module.chartsSearchResult.plotContainer.args.plot;
      expect(module.chartsSearch.tsquery()).toEqual('select stuff');
      expect(plot.chartType).toEqual('bar');
      expect(plot.facetting).toEqual('__single_plot__');
      expect(plot.width).toEqual(500);
      expect(plot.height).toEqual(250);
      expect(plot.ymin).toEqual(20);
      expect(plot.ymax).toEqual(200);
    });

    it("should handle floating point y-range values in url hash correctly", function() {
      options.plot = {
        tsquery: 'select stuff',
        facetting: '__single_plot__',
        chartType: 'bar'
      };

      UrlParams.params = {
        ymin:20.6,
        ymax: 200.5
      };
      module = new ChartsSearchPage(options);
      var plot = module.chartsSearchResult.plotContainer.args.plot;
      expect(plot.ymin).toEqual(20.6);
      expect(plot.ymax).toEqual(200.5);
    });

    it("should use the default values if parameters are deleted from the url", function() {
      options.plot = {
        tsquery: 'select stuff',
        facetting: '__single_plot__',
        chartType: 'bar',
        ymin: 10
      };

      UrlParams.params = {
        ymin:20,
        ymax: 200,
        width: 500,
        height: 250
      };
      module = new ChartsSearchPage(options);
      var plot = module.chartsSearchResult.plotContainer.args.plot;
      expect(plot.ymin).toEqual(20);
      // Delete ymin
      UrlParams.params = {
        width: 500,
        height: 250
      };
      module.updateChartOptionsFromUrlParams();
      var newPlot = module.chartsSearchResult.plotContainer.getViewModel().getPlot();
      expect(newPlot.width).toEqual(500);
      expect(newPlot.ymin).toEqual(undefined);
      expect(newPlot.ymax).toEqual(undefined);
    });

  });
});
