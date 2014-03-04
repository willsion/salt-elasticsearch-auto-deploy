// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/Util",
  "cloudera/cmf/charts/PlotContainer",
  "cloudera/cmf/charts/Plot"
], function (_, Util, PlotContainer, Plot)  {

  /**
   * Renders a large unresizable plot in a dialog.
   * options {
   *   container: (required) "selector or element of the container dialog"
   * }
   */
  return function LargePlotDialog(options) {
    var self = this, $container = $(options.container);

    var plotOptions = {
      plot: {},
      container: $container.find(".large-plot-container"),
      enableFacets: false,
      enableEnlarging: false,
      enableEditing: false,
      enableRemoving: false
    };

    self.plotContainer = new PlotContainer(plotOptions);
    self.setTitle = function(title) {
      if (_.isEmpty(title)) {
        title = "&nbsp;";
      }
      $container.find(".modal-header h3").html(title);
    };

    var handle1 = jQuery.subscribe("showPlotDetails", function(plot, timeSeries, subtitle) {

      var width = $("body").width() * 0.8;
      var height = 400;
      self.plotContainer.getViewModel().setDimension(width, height);
      self.plotContainer.getViewModel().setShowLegend(true);
      self.plotContainer.getViewModel().facetting(plot.facetting);
      self.plotContainer.setChartType(plot.chartType);
      self.plotContainer.setYRange(plot.ymin, plot.ymax);
      self.plotContainer.setTsquery(plot.tsquery);
      self.plotContainer.render({
        tsquery: plot.tsquery,
        timeSeries: timeSeries
      });
      // We need this check here because for a All Combined chart,
      // the title is not rendered.
      if (plot.facetting === Plot.FACETTING_SINGLE_PLOT) {
        self.setTitle(subtitle);
      } else {
        self.setTitle(plot.title);
      }
      $container.modal("show");
    });

    self.subscriptionHandles = [handle1];

    self.unsubscribe = function() {
      Util.unsubscribe(self);
      self.plotContainer.unsubscribe();
    };
  };
});
