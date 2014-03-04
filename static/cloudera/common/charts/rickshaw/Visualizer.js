// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
/*global Rickshaw: true */
define([
  "underscore",
  "cloudera/Util",
  'cloudera/common/Humanize',
  "cloudera/common/charts/rickshaw/Series",
  "cloudera/common/charts/rickshaw/HoverDetail",
  "cloudera/common/charts/rickshaw/FormatUtils",
  "cloudera/common/charts/rickshaw/AxisTime",
  "cloudera/common/charts/rickshaw/AxisY",
  "cloudera/common/Monitor",
  "rickshaw"
], function(_, Util, Humanize, Series, HoverDetail, FormatUtils, AxisTime, AxisY, Monitor) {

  /**
   * Renders one chart containing 1 or more time series.
   * options = {
   *   container:       (required) "the DOM or the selector of the chart's container element",
   *   width:           (required) the width of a single chart,
   *   height:          (required) the height of a single chart,
   *   yAxisWidth:      (required) the width of the y Axis.
   *   min:             (optional) the minimum Y value calculated dynamically from the plot
   *                               containing this chart, not just the dataset on this chart,
   *   max:             (optional) the maximum Y value calculated dynamically from the plot
   *                               containing this chart, not just the dataset on this chart,
   *   ymin:            (optional) the explicit minimum Y value,
   *   ymax:            (optional) the explicit maximum Y value,
   *   interpolation:   (optional) "rickshaw specific: linear || step-after",
   *   offset:          (optional) "rickshaw specific: value || zero",
   *   renderer:        (optional) "rickshaw specific: line || area || bar",
   *   showYAxis:       (optional) true|false whether the y Axis should be shown.
   *   showHoverDetail: (optional) true|false whether hover details should be shown.
   *   showLegend:      (optional) true|false whether a legend shoudl be shown.
   * }
   */
  function Visualizer(options) {
    var self = this;
    self.rendered = false;
    self.options = options;
    self.$container = $(options.container);
  }

  Visualizer.prototype.createGraph = function(args) {
    return new Rickshaw.Graph(args);
  };

  Visualizer.prototype.createAxisX = function() {
    var self = this;
    // Show X-Y axis.
    return new AxisTime({
      graph: self.graph
    } );
  };

  Visualizer.prototype.createAxisY = function(units) {
    var self = this;
    var $chart = self.$container.find(".chart");
    var height = parseInt($chart.css("height"), 10) || self.options.height;
    return new AxisY({
      orientation: 'left',
      tickFormat: FormatUtils.getYAxisTickFormatFunction(units),
      pixelsPerTick: 30,
      graph: self.graph,
      element: self.$container.find(".yAxis")[0],
      width: self.options.yAxisWidth,
      height: height
    });
  };

  /**
   * Marks whether this chart is rendered or not.
   */
  Visualizer.prototype.setRendered = function(flag) {
    this.rendered = flag;
  };

  /**
   * Returns true if the chart is rendered.
   */
  Visualizer.prototype.isRendered = function() {
    return this.rendered;
  };

  /**
   * The chart is not rendered. Instead a placeholder
   * is rendered.
   * Note: Today, the placeholder is empty for a very
   * peculiar reason. As soon as we try to render
   * something in $chart, even though it has a fixed
   * width/height, it somehow triggers a page layout
   * calculation and makes things extremely slow again.
   */
  Visualizer.prototype.renderPlaceholder = function() {
    var self = this;
    self.$container.find(".yAxis").empty();
    self.setRendered(false);
    var $chart = self.$container.find(".chart");
    $chart.empty();
  };

  /**
   * Renders a single chart with 1 or more time series.
   */
  Visualizer.prototype.render = function(groupTs, monitor) {
    var self = this;
    // If it is already rendered, don't do anything.
    if (self.isRendered()) {
      return;
    }
    var logMonitor = false;
    if (arguments.length === 1) {
      monitor = new Monitor("Visualizer.render");
      logMonitor = true;
    }
    monitor.open("preparing args");
    var $chart = self.$container.find(".chart");
    var width = parseInt($chart.css("width"), 10) || self.options.width;
    var height = parseInt($chart.css("height"), 10) || self.options.height;
    var series = self.computeSeries(groupTs);
    var args = {
      element: $chart[0],
      series: series,
      width: width,
      height: height,
      renderer: self.options.renderer || "line",
      offset: self.options.offset || "value",
      interpolation: self.options.interpolation || "linear",
      min: self.options.min,
      max: self.options.max,
      ymin: self.options.ymin,
      ymax: self.options.ymax
    };
    // store the # of series for later.
    self.seriesCount = series.length;
    self.yRangeOverride = self.getYRangeOverride(args.series);
    self.updateYRange(args, self.yRangeOverride);

    monitor.close("preparing args");
    self.graph = self.createGraph(args);
    // Show time series details on hover.
    if (self.options.showHoverDetail) {
      monitor.open("show hover detail");
      self.hoverDetail = new HoverDetail({
        graph: self.graph
      });
      monitor.close("show hover detail");
    }

    // Show a legend.
    if (self.options.showLegend) {
      self.legend = new Rickshaw.Graph.Legend({
        graph: self.graph,
        element: self.$container.find(".legend")[0]
      });
      self.legendToggle = new Rickshaw.Graph.Behavior.Series.Toggle({
        graph: self.graph,
        legend: self.legend
      });
      self.legendHighlight = new Rickshaw.Graph.Behavior.Series.Highlight({
        graph: self.graph,
        legend: self.legend
      });
      // This is hacky, but necessary. We do not want individual entries
      // in the legend to be sortable. We *should* get what we want
      // by not adding the Rickshaw.Graph.Behavior.Series.Order object above,
      // except that doesn't work. The Toggle object re-enables jQuery UI
      // sortable whether you want it or not, so we have to reach into the
      // legend and turn if off explicitly here.
      self.$container.find('.legend ul').sortable('disable');
    }

    var units = FormatUtils.getDistinctUnitsList(groupTs)[0];

    monitor.open("Creating x axis");
    self.xAxis = self.createAxisX();
    monitor.close("Creating x axis");

    monitor.open("Creating y axis");
    if (self.options.showYAxis) {
      self.yAxis = self.createAxisY(units);
      if (units) {
        self.yAxis.setUnits(units);
      }
    }
    monitor.close("Creating y axis");

    monitor.open("rendering chart");
    // Render the charts.
    self.graph.render();
    monitor.close("rendering chart");
    monitor.open("rending axises");
    if (self.options.showYAxis) {
      self.yAxis.render();
    }
    self.xAxis.render();
    monitor.close("rending axises");
    if (logMonitor) {
      monitor.log();
    }
    self.setRendered(true);
  };

  /**
   * @return true if the chart is a stacked area chart.
   */
  Visualizer.prototype.isStacked = function() {
    return this.options.offset === "zero" &&
      this.options.renderer === "area";
  };

  /**
   * @return true if the chart is a bar chart.
   */
  Visualizer.prototype.isBar = function() {
    return this.options.offset === "zero" &&
      this.options.renderer === "bar";
  };

  /**
   * Converts data into series for rendering.
   */
  Visualizer.prototype.computeSeries = function(groupTs) {
    var palette = new Rickshaw.Color.Palette({
      scheme: Util.getChartColors()
    });

    var data = $.map(groupTs, function(ts) {
      var color;
      if (_.isArray(ts.data) && ts.emptySeries) {
        color = "#ccc";
      } else {
        color = palette.color();
      }
      return {
        data: ts.data,
        name: ts.metadata.label,
        color: color,
        units: ts.metadata.units
      };
    });
    return data;
  };

  Visualizer.prototype.getYValueIfAllYValuesAreSame = function(data) {
    var i, value, allSame = true;
    for (i = 0; i < data.length; ++i) {
      var j, series = data[i];
      for (j = 0; j < series.data.length; ++j) {
        var point = series.data[j];
        if (value === undefined) {
          value = point.y;
        } else if (value !== point.y) {
          allSame = false;
          break;
        }
      }
      if (!allSame) {
        break;
      }
    }
    if (!allSame) {
      value = undefined;
    }
    return value;
  };

  /**
   * Override the Y Range here means when all the values are identical,
   * we deduce a Y range: [min(0, yValue), max(1, yValue)),
   * otherwise, we leave them as undefined.
   *
   * There are two cases where we may need to manually override the Y Range.
   * 1) The dynamic range is collapsed (min === max)
   * 2) The dynamic range is not calculated.
   *
   * Real Examples:
   * Say I am plotting a set of charts and they have these Y ranges.
   * [10, 100],   [10, 20],  [0, 0],  [10, 50], [20, 20] ....
   * The global dynamic range would be [0, 100], which would be passed in
   * via options.min/max. I want all the charts to use this,
   * so this function should return {min: undefined, max: undefined}.
   *
   * However, say all the charts have zero values:
   * [0, 0], [0, 0],  [0, 0],  [0, 0], [0, 0] ....
   * The global dynamic range would be [0, 0],
   * then I want the yRangeOverride to override this range and return
   * {min: Math.min(0, 0), max; Math.max(1, 0)}
   */
  Visualizer.prototype.getYRangeOverride = function(data) {
    var self = this;
    var min, max;
    var dynamicRangeCalculated = this.options.min !== undefined &&
      this.options.max !== undefined;

    if (dynamicRangeCalculated && !this.isStacked()) {
      // Case 1:
      // the dynamic range is calculated,
      // but we could still end up with a collapsed range
      // that we need to fix.
      // Note: dynamic range should not be applied to
      // stacked area charts.
      if (this.options.min === this.options.max) {
        min = Math.min(0, this.options.min);
        max = Math.max(0, this.options.max);
      }
    } else {
      // Case 2.
      // the dynamic range is not calculated,
      // check if all the values are identical.
      var yValue = self.getYValueIfAllYValuesAreSame(data);
      if (_.isNumber(yValue)) {
        min = Math.min(0, yValue);
        max = Math.max(1, yValue);
      }
    }
    return {
      min: min,
      max: max
    };
  };

  /**
   * Updates the attributes of the graph without destroying it.
   */
  Visualizer.prototype.update = function(config) {
    var self = this;
    if (self.graph && self.isRendered()) {
      self.updateYRange(config, self.yRangeOverride || {});
      self.graph.configure(config);
      self.graph.render();
      if (self.options.showYAxis) {
        self.yAxis.render();
      }
      self.xAxis.render();
    }
  };

  /**
   * Calculates the Y range in the config property.
   *
   * @param config the config property to update.
   * @param yRangeOverride the {min, max} range in case all the data points
   * are identical, otherwise this would be {min: undefined, max: undefined}.
   */
  Visualizer.prototype.updateYRange = function(config, yRangeOverride) {

    if (config.ymin !== undefined) {
      // this means the ymin is explicit set.
      config.min = config.ymin;
    } else if (this.isStacked()) {
      // for stackarea charts, the default should be zero.
      config.min = 0;
    } else if (this.isBar()) {
      // for bar charts, the default should be zero.
      config.min = 0;
    } else if (yRangeOverride.min !== undefined) {
      // this means all y values are identical, use the override.
      config.min = yRangeOverride.min;
    } else if (this.options.min !== undefined) {
      // this means we should use the dynamic range.
      config.min = this.options.min;
    }

    if (config.ymax !== undefined) {
      // this means the ymax is explicit set.
      config.max = config.ymax;
    } else if (this.isStacked()) {
      // we know that the minimum is 0.
      // the maximum cannot be greater than # of series x the maximum value.
      if (yRangeOverride.max !== undefined) {
        // All values are the same across all the time series.
        // This is is a really rare in real life except when all the Y points
        // are 0, in which case the yRangeOverride is [0, 1].
        config.max = yRangeOverride.max * this.seriesCount;
      } else {
        // for stackarea charts, the default should not be set.
        config.max = undefined;
      }
    } else if (yRangeOverride.max !== undefined) {
      // this means all y values are identical, use the override.
      config.max = yRangeOverride.max;
    } else if (this.options.max !== undefined) {
      // this means we should use the dynamic range.
      config.max = this.options.max;
    }
  };

  return Visualizer;
});
