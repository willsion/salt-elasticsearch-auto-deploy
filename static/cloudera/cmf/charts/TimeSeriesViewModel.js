// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "knockout",
  "komapping",
  "cloudera/Util",
  "cloudera/cmf/charts/Plot"
], function(_, ko, komapping, Util, Plot) {

  var defaultPlotOptions = {
    showYAxis: true,
    showHoverDetail: true,
    showLegend: false,
    width: 200,
    height: 100
  };

  /**
   * Represents the view model of a TimeSeries plot.
   */
  return Plot.extend({
    init: function(args) {
      /**
       * The state is derived from a JavaScript object:
       * args = {
       *   chartType: Plot.ChartType.*
       *   facetting: "...",
       * };
       */

       if (args && args.chartType && !this.isChartTypeSupported(args.chartType)) {
          args.chartType = null;
       }

      _.each(args, function(v, k) {
        if (v === null) {
          delete args[k];
        }
      });
      args = $.extend({}, defaultPlotOptions, args);
      this._super.call(this, args);

      var self = this;

      if (!self.ymin) {
        self.ymin = ko.observable();
      }

      if (!self.ymax) {
        self.ymax = ko.observable();
      }

      self.chartType2Renderer = {};
      self.chartType2Renderer[Plot.ChartType.STACKAREA] = "area";
      self.chartType2Renderer[Plot.ChartType.BAR] = "bar";
      self.chartType2Renderer[Plot.ChartType.LINE] = "line";
      self.chartType2Renderer[Plot.ChartType.SCATTER] = "scatterplot";

      /**
       * rickshaw specific attribute, which determines
       * how the charts are rendered.
       * We are using inline constants here so that
       * they are decoupled from the values in Plot.ChartType.
       * @see http://code.shutterstock.com/rickshaw/examples/extensions.html
       */
      self.renderer = ko.computed(function() {
        return self.chartType2Renderer[self.chartType()];
      });

      /**
       * rickshaw specific attribute, which determines
       * whether things should be stacked together or not
       * @see http://code.shutterstock.com/rickshaw/examples/extensions.html
       */
      self.offset = ko.computed(function() {
        var chartType = self.chartType();
        if (chartType === Plot.ChartType.LINE || chartType === Plot.ChartType.SCATTER) {
          return "value";
        } else {
          return "zero";
        }
      });

      /**
       * rickshaw specific attribute, which determines
       * whether to smooth the points (create curves),
       * simply join the points (linear)
       * or manhattan style (discrete levels).
       * @see http://code.shutterstock.com/rickshaw/examples/extensions.html
       */
      self.interpolation = ko.computed(function() {
        return "linear";
      });
    },

    getPlot : function() {
      var result = {
        tsquery: this.tsquery(),
        chartType: this.chartType(),
        facetting: this.facetting(),
        title: this.title(),
        titleResourceId: this.titleResourceId(),
        width: this.width() !== defaultPlotOptions.width ? this.width() : null,
        height: this.height() !== defaultPlotOptions.height ? this.height() : null,
        ymin: this.ymin(),
        ymax: this.ymax(),
        hideIfNoSeries: this.hideIfNoSeries()
      };
      return result;
    },

    getBoundTsquery: function() {
      return Util.bindContext(this.tsquery(), this.context);
    },

    /**
     * TimeSeriesVisualizer needs this.
     * @param viz a TimeSeriesVisualizer.
     */
    setVisualizer: function(viz) {
      this.viz = viz;
    },

    setContext: function(context) {
      this.context = context;
    },

    /**
     * Sets the chart type only if we support it.
     * @return true if this supports it, false otherwise.
     */
    setChartType: function(v) {
      if (this.isChartTypeSupported(v)) {
        this.chartType(v);
        this.updateConfig();
        return true;
      } else {
        return false;
      }
    },

    /**
     * @return true if we support the chartType.
     */
    isChartTypeSupported: function(chartType) {
      return  chartType === Plot.ChartType.LINE || 
              chartType === Plot.ChartType.STACKAREA || 
              chartType === Plot.ChartType.BAR || 
              chartType === Plot.ChartType.SCATTER;
    },

    /**
     * Sets the dimension of each chart.
     */
    setDimension: function(width, height) {
      this.width(width);
      this.height(height);
      this.updateConfig();
      this.viz.setDimension(width, height);
    },

    /**
     * Sets whether to show a legend for the chart.
     */
    setShowLegend: function(showLegend) {
      this.showLegend(showLegend);
      this.updateConfig();
    },

    /**
     * Sets the Y Range (ymin/ymax) of each chart.
     * @param ymin a number or undefined
     * @param ymax a number or undefined
     */
    setYRange: function(ymin, ymax) {
      if (this.isNumberOrUndefined(ymin) && this.isNumberOrUndefined(ymax)) {
        this.ymin(ymin);
        this.ymax(ymax);
        this.updateConfig();
      }
    },

    /**
     * @return true if the input is a number or it is undefined.
     */
    isNumberOrUndefined: function(value) {
      return _.isNumber(value) || _.isUndefined(value);
    },

    updateConfig: function() {
      var config = {
        interpolation: this.interpolation(),
        renderer: this.renderer(),
        offset: this.offset(),
        width: this.width(),
        height: this.height(),
        ymin: this.ymin(),
        ymax: this.ymax()
      };
      this.viz.update(config);
    }
  });
});
