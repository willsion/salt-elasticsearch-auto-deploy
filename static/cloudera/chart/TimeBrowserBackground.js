// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/cmf/view/ViewContainer",
  "underscore"
], function (Util, ViewContainer, _) {

  return function TimeBrowserBackground(options, state) {
    var self = this,
      $container = $(options.container);

    var viewContainerOptions = _.defaults(_.clone(options), {
      enableFeedback: false,
      enableLoadAll: true
    });

    self.viewContainer = new ViewContainer(viewContainerOptions);

    // The time control background should not be affected by search.
    _.each(self.viewContainer.plotContainers, function(plotContainer, i) {
      plotContainer.setFilter = function() {};
    });

    /**
     * Typically, a view responds to timeSelectionChanged event
     * and asks for more data. In the case of
     * the TimeSeriesBackground, it only needs to update
     * on the totalRangeChanged event.
     */
    self.viewContainer.onTimeSelectionChanged = function(range) {
      // explicitly override to do nothing.
    };

    /**
     * Updates the background.
     */
    self.viewContainer.onTotalRangeChanged = function(range) {
      if (!range.equals(self.viewContainer.timeRange)) {
        self.viewContainer.updateTimeRange(range);
      }
    };

    /**
     * Must override this method because the time control
     * should not interact with other spinner icons.
     */
    self.viewContainer.getSpinnerElement = function() {
      return $container.find(".charts-result-spinner");
    };


    self.viewContainer.preRenderHook = function() {

      var newDuration = self.viewContainer.timeRange.duration();
      var oldDuration = self.duration;

      // We added a pre hook optimization that whenever the range changes,
      // we reset the value to (start, 0), (end, 0) immediately. This is
      // necessary so that zoom in/out works responsively.
      //
      // However, this has a side effect that it flickers during auto refresh.
      // So I added a check to disable this (basically whenever the range
      // is not modified, then the optimization is not applied.
      if (newDuration !== oldDuration) {
        var startTime = +(self.viewContainer.timeRange.startDate);
        var endTime = +(self.viewContainer.timeRange.endDate);

        _.each(self.viewContainer.plotContainers, function(plotContainer) {
          var timeSeriesResponse = {
            tsquery: plotContainer.getTsquery(),
            timeSeries: [ {
              data: [ {
                x: startTime,
                y: 0
              }, {
                x: endTime,
                y: 0
              } ],
              metadata: {
                label: ""
              }
            } ]
          };
          plotContainer.render(timeSeriesResponse);
        });
      }
      // update the duration.
      self.duration = newDuration;
    };

    /**
     * Resize the background area.
     */
    self.onWindowResized = function() {
      var width = $container.width() - state.markerRightWidth;
      var height = $container.height();
      self.viewContainer.setDimension(width, height);
    };

    self.unsubscribe = function() {
      self.viewContainer.unsubscribe();
    };
  };
});
