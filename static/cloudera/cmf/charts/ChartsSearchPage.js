// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/chart/TimeRange",
  "cloudera/cmf/charts/ChartsSearch",
  "cloudera/cmf/charts/ChartsSearchResult",
  "cloudera/cmf/charts/TimeSeriesViewModel",
  "cloudera/common/UrlParams",
  "underscore"
], function(Util, TimeRange, ChartsSearch, ChartsSearchResult, TimeSeriesViewModel, UrlParams, _) {

  /**
   * The JavaScript for the Charts Search page.
   *
   * options = {
   *   searchContainer: (required) "the selector of the parent container of the Search panel",
   *   resultContainer: (required) "the selector of the parent container of the result",
   *   timeRange:       (required) the initial time range,
   *   recentUri:       (required) "the URL to get a list of recent queries",
   *   searchUri:       (required) "the URL of this page, used for changing the page location when a recent entry is selected",
   *   plot:            (required) what to plot,
   *   metric:          (optional) "the initial metric search",
   *   viewName:        (optional) "the name of the view when this page is in edit mode."
   *   savePlotUrl:     (optional) "the URL to save a plot in edit mode."
   *   returnUrl:       (optional) "the return url after user clicks the Save button in edit mode",
   *   context:         (optional) the context object in edit/add mode,
   *   mode:            (required) what mode are we in, edit/add/<empty>"
   * }
   */
  return function(options) {
    var self = this;

    // Create a view model object from the parameters provided
    self.getModelForParams = function(params) {
      params = params || {};
      params.width = parseInt(params.width, 10) || undefined;
      params.height = parseInt(params.height, 10) || undefined;
      params.ymin = parseFloat(params.ymin);
      params.ymin = isNaN(params.ymin) ? undefined : params.ymin;
      params.ymax = parseFloat(params.ymax);
      params.ymax = isNaN(params.ymax) ? undefined : params.ymax;
      return new TimeSeriesViewModel(params);
    };

    // Update the chart parameters on hash change if the value is 
    // different from what is in the current view model
    self.updateChartOptionsFromUrlParams = function() {
      var currViewModel = self.chartsSearchResult.plotContainer.getViewModel();
      var urlParams = _.clone(UrlParams.params);
      // If ymin/ymax are missing set them to undefined so that we don't fall back
      // to the values in the current view model
      urlParams.ymin = urlParams.ymin || undefined;
      urlParams.ymax = urlParams.ymax || undefined;
      // Create a params hash by merging the current model and url parameters
      // and create a new model based on this hash in order to compare it
      // with the current model
      var params = _.extend({}, currViewModel.getPlot(), urlParams);
      var newViewModel = self.getModelForParams(params);

      // Compares attributes between currViewModel and newViewModel
      var attrChanged = function(attrName) {
        return currViewModel[attrName]() !== newViewModel[attrName]();
      };

      // TS Query
      if (attrChanged('tsquery')) {
        self.chartsSearch.tsquery(newViewModel.tsquery());
        $(options.container).hide();
        self.chartsSearchResult.render(newViewModel.tsquery(), /*skipTitleUpdate=*/false);
      }

      // Chart Type
      if (attrChanged('chartType')) {
        self.chartsSearchResult.chartTypeSelector.chartType(newViewModel.chartType());
      }

      // Facetting
      if (attrChanged('facetting')) {
        // TODO: Needs refactoring. We need to have a central view model that is the source of
        // truth for chart options, which would eliminate the need for the ugliness below
        self.chartsSearchResult.plotContainer.visualizer.facets.selectedFacet(newViewModel.facetting());
      }

      // ymin, ymax
      if (attrChanged('ymin') || attrChanged('ymax')) {
        self.chartsSearchResult.chartRangeSelector.update(newViewModel.ymin(), newViewModel.ymax());
      }

      // Dimension
      if (attrChanged('width') || attrChanged('height')) {
        currViewModel.setDimension(newViewModel.width(), newViewModel.height());
      }
      newViewModel = null;
    };

    // Update the plot options from the url at page load.
    // The parameters provided by the options hash are relevant at this stage
    // so merge them with the url parameters and create a new plot based on
    // that merged params hash
    var params = _.extend({}, options.plot, UrlParams.params);
    options.plot = self.getModelForParams(params).getPlot();

    var searchOptions = {
      container: options.searchContainer,
      metric: options.metric,
      tsquery: options.plot.tsquery,
      recentUri: options.recentUri,
      searchUri: options.searchUri,
      context: options.context
    };
    self.chartsSearch = new ChartsSearch(searchOptions);

    var resultOptions = {
      container: options.resultContainer,
      timeRange : options.timeRange,
      addPlotUri: options.addPlotUri,
      plot: options.plot,
      context: options.context,
      viewName: options.viewName,
      savePlotUrl: options.savePlotUrl,
      returnUrl: options.returnUrl,
      mode: options.mode
    };
    self.chartsSearchResult = new ChartsSearchResult(resultOptions);

    var handle1 = jQuery.subscribe("urlHashChanged",
      _.bind(self.updateChartOptionsFromUrlParams, self));    

    self.subscriptionHandles = [handle1];

    self.unsubscribe = function() {
      Util.unsubscribe(self);
      self.chartsSearchResult.unsubscribe();
    };
    $(".showTooltip").tooltip();
  };
});
