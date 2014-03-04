// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "knockout",
  "komapping",
  "cloudera/Util"
], function (_, ko, komapping, Util)  {
  var defaultPlotOptions;
  /**
   * The base class for a client side Plot object.
   */
  var Plot = Class.extend({
    init: function(args) {
      args = $.extend({}, defaultPlotOptions, args);
      komapping.fromJS(args, {}, this);
    },
    getPlot : function() {
      var result = {
        tsquery: this.tsquery(),
        chartType: this.chartType(),
        facetting: this.facetting(),
        title: this.title()
      };
      return result;
    }
  });

  Plot.ChartType = {
    LINE: "line",
    STACKAREA: "stackarea",
    BAR: "bar",
    SCATTER: "scatter"
  };
  Plot.FACETTING_NONE = "__no_facetting__";
  Plot.FACETTING_SINGLE_PLOT = "__single_plot__";

  defaultPlotOptions = {
    // a Plot object on the server side must have a non-null tsquery string.
    tsquery: "",
    title: null,
    titleResourceId: null,
    chartType: Plot.ChartType.LINE,
    facetting: Plot.FACETTING_NONE,
    hideIfNoSeries: false
  };

  return Plot;
});
