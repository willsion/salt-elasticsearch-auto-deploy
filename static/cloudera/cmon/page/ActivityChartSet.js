// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "knockout",
  "underscore",
  "cloudera/Util",
  "cloudera/cmf/charts/Plot",
  "cloudera/cmf/charts/TimeSeriesVisualizer"
], function(ko, _, Util, Plot, TimeSeriesVisualizer) {
  /**
   * Manages the charts on the Activities page.
   * options = {
   *   container:     (required) "the DOM or the selector of the parent element",
   *   parentId:      (required) "the ID of the parent activity or null",
   *   serviceId:     (required) "the id of the MapReduce service",
   *   serviceName:   (required) "the name of the MapReduce service",
   *   viewContainer: (required) the ViewContainer object for the charts. This ViewContainer
   *   for now should only contain one Plot. This is because we are constructing the query
   *   manually using a special JSON format. It is much easier for now this way.
   * };
   */
  function ActivityChartSet(options) {
    var self = this, $container = $(options.container);

    /**
     * Represents a selected Activity.
     */
    function ActivityContext(context) {
      var c = this;
      this.href = "/cmf/services/" + options.serviceId + "/activities/" + context.id + "/";
      this.id = context.id;
      this.name = context.name;
      this.activityType = context.activityType;
      this.remove = function() {
        self.activityContexts.remove(c);
        self.refreshCharts();
      };
    }

    self.initialize = function() {
      self.chartId2Descriptors = {};
      // The $container contains the toolbar
      // which has the parent selection (a checkbox)
      // and the activity context selection (a list).
      ko.applyBindings(self, $container[0]);
      $container.show();
    };

    /**
     * Binds to an array of activities selected on this page.
     */
    self.activityContexts = ko.observableArray();

    /**
     * Binds to the parent checkbox.
     */
    self._parentSelected = ko.observable(true);
    self.parentSelected = ko.computed({
      read: function() {
        return self._parentSelected();
      },
      write: function(value) {
        self._parentSelected(value);
        self.refreshCharts();
      }
    });

    /**
     * Refresh each chart by updating its query.
     */
    self.refreshCharts = function() {
      _.each(options.viewContainer.plotContainers, function(plotContainer) {
        var chartId = plotContainer.chartId;
        var jsonQuery = JSON.stringify(self.getJsonQuery(chartId));
        plotContainer.setTsquery(jsonQuery);
      });
      options.viewContainer.render();
    };

    self.getJsonQuery = function(chartId) {
      var descriptors = self.chartId2Descriptors[chartId] || [];
      var jsonQuery = {
        activityIds: _.pluck(self.activityContexts(), "id"),
        activityMetricIds : _.chain(descriptors)
          .pluck("metric")
          .filter(function(metric) {
            return metric.context === "ACTIVITY";
          })
          .pluck("id").value()
      };

      if (self.parentSelected()) {
        if (_.isEmpty(options.parentId)) {
          jsonQuery.serviceName = options.serviceName;
          jsonQuery.clusterMetricIds = _.chain(descriptors)
            .pluck("metric")
            .filter(function(metric) {
              return metric.context === "CLUSTER";
            })
            .pluck("id").value();
        } else {
          jsonQuery.activityIds.push(options.parentId);
        }
      }
      return jsonQuery;
    };

    /**
     * Reconstruct the entire view.
     */
    self.reconstructView = function() {
      var viewContainer = options.viewContainer;
      // Remove all existing plots.
      while(viewContainer.plotContainers.length > 0) {
        viewContainer.removePlot(0);
      }
      // Reconstruct the entire view.
      _.each(self.chartId2Descriptors, function(descriptors, chartId) {
        var plot = {
          title: _.chain(descriptors).pluck("chart").pluck("title").first().value(),
          facetting: Plot.FACETTING_SINGLE_PLOT,
          tsquery: JSON.stringify(self.getJsonQuery(chartId))
        };
        viewContainer.appendPlot(plot);
        // Add a chartId attribute so we can identify which plotContainer is which.
        viewContainer.plotContainers[viewContainer.plotContainers.length - 1].chartId = chartId;
      });
      // Manually force a resize event to ensure the charts
      // are shown with the right size on start up.
      $.publish("layoutResized", ["east", $container.closest(".pane")]);
      options.viewContainer.render();
    };

    /**
     * Handles when the OK button is pressed in the Customize dialog.
     */
    var handle1 = jQuery.subscribe("setChartDescriptors", function(chartDescriptors) {
      self.chartId2Descriptors = _.groupBy(chartDescriptors, function(d) {
        return d.chart.id;
      });
      self.reconstructView();
    });

    /**
     * Handles when an activity is added.
     */
    var handle2 = jQuery.subscribe("addContext", function(context) {
      if (_.find(self.activityContexts(), function(c) { return context.id === c.id; }) === undefined) {
        self.activityContexts.push(new ActivityContext(context));
        self.refreshCharts();
      }
    });

    /**
     * Handles when user resizes the layout.
     */
    var handle3 = jQuery.subscribe("layoutResized", function(name, element) {
      var $element = $(element);
      var $chartContainer = $element.find(".chart-container");
      // We need 20 pixels buffer to account for the scroll bar.
      var totalPadding = TimeSeriesVisualizer.Y_AXIS_WIDTH + 20
        + $chartContainer.outerWidth() - $chartContainer.width();
      var width = $(element).width() - totalPadding;
      var height = 120;
      options.viewContainer.setDimension(width, height);
    });

    self.subscriptionHandles = [handle1, handle2, handle3];

    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    self.initialize();
  }

  return ActivityChartSet;
});
