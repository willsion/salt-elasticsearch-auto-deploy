// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/Util",
  "cloudera/cmf/charts/TimeSeriesVisualizer"
], function (_, Util, TimeSeriesVisualizer)  {

  /**
   * Renders a specific plot.
   * options {
   *   plot:           (required) the plot object.
   *   container:      (required) "selector or element of the container DOM object",
   *   context:        (optional) a mapping of placeholder variable names to values.
   *   resizeContainer:(optional) an element that can resize charts.
   *   resizeLabel:    (optional) an element that shows the width after resize.
   *   enableEditing:  (optional) true|false, whether editing should be enabled, default false.
   *   enableCloning:  (optional) true|false, whether cloning should be enabled, default false.
   *   enableRemoving: (optional) true|false, whether removing should be enabled, default false.
   *   enableFacets:   (optional) true|false, whether facets should be enabled, default false.
   *   enableEnlarging:(optional) true|false, whether charts can be enlarged, default true.
   *   enableSelection:(optional) true|false, whether charts can be selected, default false.
   *   enableLoadAll:  (optional) true|false, whether charts should be loaded all at once, default false.
   * }
   */
  var PlotContainer = function(options) {
    var self = this;

    self.$container = $(options.container);
    self.hideIfNoSeries = options.plot.hideIfNoSeries;

    if (options.enableSelection) {
      self.$container.click(function(evt) {
        if (self.$container.hasClass("selected")) {
          $.publish("unselectPlot", [options.plot]);
          self.$container.removeClass("selected");
        } else {
          $.publish("selectPlot", [options.plot]);
          self.$container.addClass("selected");
        }
      });
      // These two flags are mutually exclusive.
      options.enableEnlarging = false;
    }

    // Used for creating visualizers below.
    self.args = {
      plot: options.plot,
      container: self.$container,
      context: options.context,
      resizeContainer: options.resizeContainer,
      resizeLabel: options.resizeLabel,
      enableEditing: options.enableEditing,
      enableCloning: options.enableCloning,
      enableRemoving: options.enableRemoving,
      enableFacets: options.enableFacets,
      enableEnlarging: options.enableEnlarging,
      enableLoadAll: options.enableLoadAll
    };

    self.initialize(options);
  };

  PlotContainer.prototype.initialize = function(options) {
    var self = this;
    self.visualizer = self.createVisualizer(options.plot.chartType);
    if (_.isNumber(options.plot.width) && _.isNumber(options.plot.height)) {
      self.setDimension(options.plot.width, options.plot.height);
    }
    self.setYRange(options.plot.ymin, options.plot.ymax);
  };

  PlotContainer.prototype.shouldShowPlot = function(data) {
    var self = this;
    if (self.hideIfNoSeries) {
      if (data.timeSeries.length === 0 || data.emptySeries === true) {
        return false;
      }
    }
    return true;
  };

  PlotContainer.prototype.getViewModel = function() {
    var self = this;
    return self.visualizer.getViewModel();
  };

  /**
   * Renders data.
   */
  PlotContainer.prototype.render = function(data) {
    var self = this;
    if (!self.shouldShowPlot(data)) {
      self.$container.hide();
      return;
    }
    if (data) {
      self.visualizer.render(data);
    }
  };

  /**
   * @return the state of the plot.
   */
  PlotContainer.prototype.getPlot = function() {
    var self = this;
    return self.getViewModel().getPlot();
  };

  /**
   * Sets the dimension of each chart.
   */
  PlotContainer.prototype.setDimension = function(width, height) {
    var self = this;
    self.getViewModel().setDimension(width, height);
  };

  /**
   * Sets the chart type.
   */
  PlotContainer.prototype.setChartType = function(chartType) {
    var self = this;
    if (!self.getViewModel().setChartType(chartType)) {
      // we need to switch visualizer.
      if (self.visualizer) {
        self.visualizer.unsubscribe();
      }
      self.visualizer = self.createVisualizer(chartType);
    }
  };

  PlotContainer.prototype.setYRange = function(ymin, ymax) {
    var self = this;
    self.getViewModel().setYRange(ymin, ymax);
  };

  PlotContainer.prototype.createVisualizer = function(chartType) {
    var self = this;
    return new TimeSeriesVisualizer(self.args);
  };

  /**
   * Sets the tsquery for the entire plot.
   */
  PlotContainer.prototype.setTsquery = function(tsquery) {
    var self = this;
    self.getViewModel().tsquery(tsquery);
  };

  /**
   * Gets the current tsquery.
   */
  PlotContainer.prototype.getTsquery = function() {
    var self = this;
    return self.getViewModel().tsquery();
  };

  PlotContainer.prototype.getBoundTsquery = function() {
    var self = this;
    return self.getViewModel().getBoundTsquery();
  };

  PlotContainer.prototype.hasCharts = function() {
    var self = this;
    return self.visualizer.hasCharts();
  };

  /**
   * Removes this plotContainer from the DOM.
   */
  PlotContainer.prototype.remove = function() {
    var self = this;
    self.unsubscribe();
    self.$container.remove();
  };

  PlotContainer.prototype.setFilter = function(query) {
    var self = this;
    if (self.visualizer) {
      self.visualizer.setFilter(query);
    }
  };

  PlotContainer.prototype.unsubscribe = function() {
    var self = this;
    self.visualizer.unsubscribe();
  };

  return PlotContainer;
});
