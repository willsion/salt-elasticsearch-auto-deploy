// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/Util",
  "cloudera/cmf/charts/PlotContainer",
  "cloudera/cmf/charts/BulkTsqueryFetcher"
], function (_, Util, PlotContainer, BulkTsqueryFetcher)  {

  /**
   * Renders a view.
   * options {
   *   container:     (required) "selector or element of the container DOM object",
   *   timeRange:     (required) a TimeRange object,
   *   view:          (required) the view.
   *   context:       (optional) a mapping of placeholder variable names to values.
   *   enableFacets:  (optional) true|false, whether facets should be enabled, default false.
   *   enableEditing: (optional) true|false, whether to enable editing, default false.
   *   enableCloning: (optional) true|false, whether to enable cloning, default false.
   *   enableRemoving:(optional) true|false, whether to enable removing, default false.
   *   enableEnlarging:(optional) true|false, whether to enable show details in a popup, default true.
   *   enableSelection:(optional) true|false, whether to enable chart selection, defalt false.
   *   enableFeedback: (optional) true|false, whether to show errors and warnings, default true.
   *   enableLoadAll:  (optional) true|false, whether to load charts all at once, default false.
   * }
   */
  var ViewContainer = function(options) {

    var self = this, $container = $(options.container);

    self.timeRange = options.timeRange;
    self.view = options.view;

    var enableFeedbackErrors = (options.enableFeedback === false) ? false : true;
    var enableFeedbackWarnings = (options.enableFeedback === false) ? false : true;
    if (self.view.suppressWarnings) {
      enableFeedbackWarnings = false;
    }

    self.initialize = function() {
      // Create one PlotContainer per plot.
      self.plotContainers = _.map(self.view.plots, function(plot) {
        return self.createPlotContainer(plot);
      });

      self.bulkTsqueryFetcher = new BulkTsqueryFetcher({
        container: options.container,
        plotContainers: self.plotContainers,
        enableFeedbackErrors: enableFeedbackErrors,
        enableFeedbackWarnings: enableFeedbackWarnings
      });
    };

    self.createPlotContainer = function(plot, position) {
      var $plotContainer = $('<div class="plot-container">');
      if (position === undefined) {
        $plotContainer.appendTo($container);
      } else {
        var existingContainers = $container.find(".plot-container");
        if (0 <= position && position < existingContainers.length) {
          $(existingContainers[position]).insert($plotContainer);
        } else {
          $plotContainer.appendTo($container);
        }
      }

      if (options.enableSelection) {
        $plotContainer.addClass("selectable");
      }

      var plotOptions = {
        container: $plotContainer,
        plot: plot,
        context: options.context,
        enableFacets: options.enableFacets,
        enableEditing: options.enableEditing,
        enableCloning: options.enableCloning,
        enableRemoving: options.enableRemoving,
        enableEnlarging: options.enableEnlarging,
        enableSelection: options.enableSelection,
        enableLoadAll: options.enableLoadAll
      };
      return new PlotContainer(plotOptions);
    };

    self.appendPlot = function(plot) {
      var plotContainer = self.createPlotContainer(plot);
      self.plotContainers.push(plotContainer);
    };

    self.insertPlot = function(plot, index) {
      var plotContainer = self.createPlotContainer(plot, index);
      self.plotContainers.splice(index, 0, plotContainer);
    };

    self.removePlot = function(index) {
      var plotContainer = self.plotContainers[index];
      plotContainer.remove();
      self.plotContainers.splice(index, 1);
    };

    /**
     * Renders the given view.
     */
    self.render = function() {
      self.getSpinnerElement().show();
      self.bulkTsqueryFetcher.render(self.timeRange, self.preRenderHook, self.postRenderHook);
    };

    /**
     * A hook that is called after data has arrived
     * form the server.
     */
    self.postRenderHook = function() {
      self.getSpinnerElement().hide();
    };

    /**
     * A hook that is called before the request goes out.
     */
    self.preRenderHook = function() {
    };

    /**
     * Expects a spinner icon some where on the page.
     */
    self.getSpinnerElement = function() {
      return $(".charts-result-spinner");
    };

    self.updateTimeRange = function(range) {
      if (!range.equals(self.timeRange)) {
        self.timeRange = range;
        self.render();
      }
    };

    self.onTimeSelectionChanged = function(range) {
      self.updateTimeRange(range);
    };

    self.onTotalRangeChanged = function(range) {
      // do nothing, but can be overwritten.
    };

    /**
     * Sets the dimension of each plot.
     */
    self.setDimension = function(width, height) {
      _.invoke(self.plotContainers, 'setDimension', width, height);
    };

    var handle1 = jQuery.subscribe("timeSelectionChanged", function(range) {
      // we want this method to be called here, rather
      // than as an argument for subscribe
      // because we want to override it, e.g. in testing.
      self.onTimeSelectionChanged(range);
    });

    var handle2 = jQuery.subscribe("totalTimeRangeChanged", function(range) {
      // we want this method to be called here, rather
      // than as an argument for subscribe
      // because we want to override it, e.g. in testing.
      self.onTotalRangeChanged(range);
    });

    /**
     * We should only care when $chartContainer is within $container.
     */
    var hasChartContainer = function($chartContainer) {
      return $container.find($chartContainer).length > 0;
    };

    /**
     * Removes all undefined members.
     */
    var plotToParams = function(plot) {
      var params = _.clone(plot);
      _.each(plot, function(v, k) {
        if (_.isUndefined(v) || _.isNull(v)) {
          delete params[k];
        }
      });
      return params;
    };

    /**
     * Displays the charts search page with params as URL parameters.
     */
    var showSearchPage = function(params) {
      Util.setWindowLocation("/cmf/views/search?"+ $.param(params));
    };

    /**
     * Removes a specific plot.
     */
    var handle3 = jQuery.subscribe("removePlot", function(plot, $chartContainer, callback) {
      if (hasChartContainer($chartContainer)) {
        $.post("/cmf/views/removePlot", {
          viewName: self.view.name,
          plotJson: JSON.stringify(plot)
        }, function(response) {
          if (response.message === "OK") {
            if (_.isFunction(callback)) {
              callback();
            }
          } else {
            $.publish("showError", [response.message]);
          }
        });
      }
    });

    /**
     * Go to the charts search page with the specific plot in edit mode.
     */
    var handle4 = jQuery.subscribe("editPlot", function(plot, $chartContainer) {
      if (hasChartContainer($chartContainer)) {
        var params = plotToParams(plot);
        params.viewName = self.view.name;
        params.returnUrl = Util.getWindowLocation();
        params.mode = "edit";
        if (options.context) {
          params.context = JSON.stringify(options.context);
        }
        showSearchPage(params);
      }
    });

    /**
     * Go to the charts search page with the specific plot pre-filled.
     */
    var handle5 = jQuery.subscribe("clonePlot", function(plot, $chartContainer) {
      if (hasChartContainer($chartContainer)) {
        var params = plotToParams(plot);
        if (options.context) {
          params.context = JSON.stringify(options.context);
        }
        showSearchPage(params);
      }
    });

    /**
     * Handles the searchChanged event.
     * Basically we ask each PlotContainer to update the filter information.
     */
    var handle6 = jQuery.subscribe("searchChanged", function(query) {
      // Remove any parts of the query that are in the view displayName.
      var remainingFilter = Util.removeFilteredQuery(self.view.displayName, query);
      _.invoke(self.plotContainers, 'setFilter', remainingFilter);
    });

    self.subscriptionHandles = [handle1, handle2, handle3, handle4, handle5];

    self.unsubscribe = function() {
      Util.unsubscribe(self);
      _.invoke(self.plotContainers, 'unsubscribe');
    };

    /**
     * @return the state of the view.
     */
    self.getView = function() {
      return {
        plots: _.invoke(self.plotContainers, 'getPlot')
      };
    };

    self.initialize();
  };

  return ViewContainer;
});
