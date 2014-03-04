// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/Util",
  "cloudera/cmf/charts/Facets",
  "cloudera/cmf/charts/ChartTypeSelector",
  "cloudera/cmf/charts/ChartRangeSelector",
  "cloudera/cmf/charts/PlotContainer",
  "cloudera/cmf/charts/BulkTsqueryFetcher",
  "cloudera/cmf/charts/TimeSeriesViewModel",
  "cloudera/common/UrlParams"
], function (_, Util, Facets, ChartTypeSelector, ChartRangeSelector, PlotContainer, BulkTsqueryFetcher, TimeSeriesViewModel, UrlParams)  {

  /**
   * Renders the result of a tsquery query. This widget is very similar
   * to a ViewContainer, but it has some other responsibilities.
   *
   * options {
   *   container:  (required) "selector or element of the container DOM object",
   *   timeRange:  (required) a TimeRange object,
   *   addPlotUri: (required) "the URI to insert a plot",
   *   plot:       (required) what to plot.
   *   context:    (optional) the context object in edit/add mode
   *   viewName:   (optional) "the name of the view in edit mode."
   *   savePlotUrl:(optional) "the URL to save a plot in edit mode."
   *   returnUrl:  (optional) "the return url after user clicks the Save button in edit mode",
   *   mode:       (optional) "which mode are we in edit/add/<empty>"
   * }
   *
   * If tsquery is empty, this component relies on a "tsqueryChanged" event.
   */
  var ChartsSearchResult = function(options) {
    var self = this;

    var plotOptions = {
      container: options.container,
      plot: options.plot,
      context: options.context,
      resizeContainer: ".charts-result-resizer",
      resizeLabel: ".charts-result-resizer-width-label",
      enableFacets: true
    };
    self.chartTypeSelector = new ChartTypeSelector({
      chartType: options.plot.chartType,
      container: $(options.container).find(".chart-type-selector")
    });

    self.chartRangeSelector = new ChartRangeSelector({
      container: $(options.container).find(".chart-range-selector"),
      min: options.plot.ymin,
      max: options.plot.ymax
    });

    self.plotContainer = new PlotContainer(plotOptions);
    self.timeRange = options.timeRange;
    self.bulkTsqueryFetcher = new BulkTsqueryFetcher({
      updateRecent: true,
      container: options.container,
      plotContainers: [self.plotContainer]
    });

    /**
     * renders the result of a time series query.
     */
    self.render = function(tsquery, skipTitleUpdate) {
      if (!tsquery) {
        return;
      }
      self.plotContainer.setTsquery(tsquery);
      if (skipTitleUpdate === undefined || !skipTitleUpdate) {
        if (options.mode === "edit") {
          $(options.container).find(".plot-title").val(options.plot.title);
        } else {
          $(options.container).find(".plot-title").val(tsquery);
        }
      }

      self.getSpinnerElement().show();
      self.bulkTsqueryFetcher.render(self.timeRange, self.preRenderHook, self.postRenderHook);
    };

    self.preRenderHook = function() {
    };

    self.postRenderHook = function() {
      self.getSpinnerElement().hide();
      $(options.container).show();

      if (self.plotContainer.hasCharts()) {
        self.getPanelElement().show();
        self.getToolbarElement().show();
        self.getNoResultsElement().hide();
      } else {
        self.getPanelElement().hide();
        self.getToolbarElement().hide();
        self.getNoResultsElement().show();
      }
    };

    self.getSpinnerElement = function() {
      return $(".charts-result-spinner");
    };

    self.getToolbarElement = function() {
      return $(options.container).find(".charts-result-toolbar");
    };

    self.getPanelElement = function() {
      return $(options.container).find(".charts-result-panel");
    };

    self.getNoResultsElement = function() {
      return $(options.container).find(".charts-result-none");
    };

    self.updateTimeRange = function(range) {
      if (!range.equals(self.timeRange)) {
        self.timeRange = range;
        self.render(self.plotContainer.getTsquery(), /*skipTitleUpdate=*/true);
      }
    };

    self.onTimeSelectionChanged = function(range) {
      self.updateTimeRange(range);
    };

    self.onTotalRangeChanged = function(range) {
      // do nothing, but can be overwritten.
    };

    self.savePlot = function(plot) {
      var oldPlot = options.plot;
      var params = {
        viewName : options.viewName,
        oldPlotJson: JSON.stringify(oldPlot),
        newPlotJson: JSON.stringify(plot)
      };
      $.post(options.savePlotUrl, params, function(response) {
        if (response.message === "OK") {
          Util.setWindowLocation(options.returnUrl);
        } else {
          $.publish("showError", [response.message]);
        }
      }, 'json');
    };

    var handle1 = $.subscribe("timeSelectionChanged", function(range) {
      // we want this method to be called here, rather
      // than as an argument for subscribe
      // because we want to override it, e.g. in testing.
      self.onTimeSelectionChanged(range);
    });

    var handle2 = $.subscribe("totalTimeRangeChanged", function(range) {
      // we want this method to be called here, rather
      // than as an argument for subscribe
      // because we want to override it, e.g. in testing.
      self.onTotalRangeChanged(range);
    });

    var handle3 = $.subscribe("chartTypeChanged", function(chartType) {
      self.plotContainer.setChartType(chartType);
      UrlParams.set('chartType', chartType);
    });

    var handle4 = $.subscribe("tsqueryChanged", function(tsquery) {
      $(options.container).hide();
      self.render(tsquery, /*skipTitleUpdate=*/false);
      UrlParams.set('tsquery', tsquery);
    });

    var handle5 = $.subscribe("addToView", function(viewName, callback) {
      var $container = $(options.container);
      var plot = self.plotContainer.getPlot();
      plot.title = $container.find(".plot-title").val();

      var params = {
        viewName: viewName,
        plotJson: JSON.stringify(plot)
      };
      $.post(options.addPlotUri, params, function(response) {
        var filteredResponse = Util.filterJsonResponseError(response);
        if (filteredResponse.message !== "OK") {
          $.publish("showError", [filteredResponse.message]);
        } else {
          if ($.isFunction(callback)) {
            callback();
          }

          // Currently, we have two places that respond to this event
          // 1. The Charts global menu.
          // This displays a list of user defined views.
          // 2. The Add To View dropdown.
          // This displays a list of user defined views and system views.
          //
          // We should never add a system view to any list today.
          var view = response.data;
          var $savedViewLinkContainer = $container.find(".saved-view-link-container");

          if (view && view.userCreated) {
            $.publish("viewAdded", [viewName, view]);

            var viewUrlParams = {
              viewName: viewName
            };

            $savedViewLinkContainer.find(".system-defined").hide();
            $savedViewLinkContainer.find(".user-defined").show()
              .find("a")
                .text(viewName)
                .attr("href", "view?" + $.param(viewUrlParams));
          } else {
            $savedViewLinkContainer.find(".user-defined").hide();
            $savedViewLinkContainer.find(".system-defined").show();
          }

          // Show the saved view message.
          // 20 seconds later, hide it.
          $savedViewLinkContainer.show();

          window.setTimeout(function() {
            $savedViewLinkContainer.fadeOut('slow', function() {
              $savedViewLinkContainer.hide();
            });
          }, 20000);
        }
      }, "json");
    });

    var handle6 = $.subscribe("chartRangeChanged", function(min, max) {
      self.plotContainer.setYRange(min, max);
      UrlParams.set({
        ymin:min,
        ymax:max
      });
    });

    self.subscriptionHandles = [handle1, handle2, handle3, handle4, handle5, handle6];

    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    $(".save-plot-button").click(function(evt) {
      var plot = _.clone(self.plotContainer.getPlot());
      plot.title = $(".plot-title").val();
      self.savePlot(plot);
      evt.preventDefault();
    });

    $(".cancel-save-plot-button").click(function(evt) {
      evt.preventDefault();
      Util.setWindowLocation(options.returnUrl);
    });

    // Automatically renders the content.
    if (!_.isEmpty(options.plot.tsquery)) {
      self.render(options.plot.tsquery);
    }
  };

  return ChartsSearchResult;
});
