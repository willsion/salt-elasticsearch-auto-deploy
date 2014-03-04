// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/chart/TimeRange",
  "cloudera/common/DateUtil",
  "cloudera/Util",
  "underscore"
], function(TimeRange, DateUtil, Util, _) {

  /**
   * options = {
   *   id: the id prefix of various elements used by this control.
   *   mode: INTERACTIVE | READONLY
   *   showRange: true | false
   * }
   */
  return function TimeBrowserRangeMarker(options, state) {
    var self = this, id = options.id, $container = $("#" + id);

    self.state = state;
    self.$leftMask = $container.find(".left");
    self.$rightMask = $container.find(".right");
    self.$totalMask = $container.find(".mask");

    self.isRangeInteractive = function() {
      return (options.mode === "INTERACTIVE" && options.showRange);
    };

    self.isMarkerInteractive = function() {
      return (options.mode === "INTERACTIVE" && options.showMarker);
    };

    self.initialize = function() {
      if (options.showRange) {
        if (self.isRangeInteractive()) {
          self._registerResizables();
        }
        // Whether we are in INTERACTIVE mode or not,
        // we should show these elements.
        self.$leftMask.show();
        self.$rightMask.show();
        self.refresh();
        self.subscribe();
      } else {
        self.$totalMask.width($container.width());
        self.$totalMask.height($container.height());
        self.$totalMask.show();
      }
    };

    self._registerResizables = function() {
      self.$leftMask.resizable({
        handles: "e",
        containment: $container,
        minWidth: 1
      }).bind("resizestop", function(event, ui) {
        self.onLeftResizeStop(event, ui);
      });

      self.$rightMask.resizable({
        handles: "w",
        containment: $container,
        minWidth: self.state.markerRightWidth
      }).bind("resizestop", function(event, ui) {
        self.onRightResizeStop(event, ui);
      });
    };

    /**
     * Refreshes the masks based on the latest state.
     */
    self.refresh = function() {
      self.$leftMask.css({
        width: self.state.getOffsetFromDate(self.state.firstVisibleDate)
      });
      var left = self.state.getOffsetFromDate(self.state.lastVisibleDate);
      var width = $container.width() - left;
      self.$rightMask.css({
        left: left,
        width: width
      });
      self.$totalMask.css({
        width: $container.width(),
        height: $container.height()
      });
    };

    /**
     * Handles the window resize event.
     */
    self.onWindowResized = function() {
      self.refresh();
    };

    /**
     * Updates the selected time range.
     */
    self.setSelectedRange = function(startDate, endDate) {
      if (self.state.isDateCurrent(endDate)) {
        if (!self.isMarkerInteractive()) {
          self.state.setCurrentMode(true);
        }
      } else {
        self.state.setCurrentMode(false);
      }
      self.state.setSelectedRange(new TimeRange(startDate, endDate));
      self.state.moveMarkerIntoSelectedRange();
    };

    /**
     * Resize stop handler for the left mask box.
     */
    self.onLeftResizeStop = function(event, ui) {
      var offset = self.$leftMask.width();
      var newDate = self.state.getDateFromOffset(offset);
      self.setSelectedRange(newDate, self.state.lastVisibleDate);
      self.refresh();
    };

    /**
     * Resize stop handler for the right mask box.
     */
    self.onRightResizeStop = function(event, ui) {
      var position = self.$rightMask.position();
      var newDate = self.state.getDateFromOffset(position.left);
      self.setSelectedRange(self.state.firstVisibleDate, newDate);
      self.refresh();
    };

    self.subscriptionHandles = [];

    self.subscribe = function() {
      var handle1 = $.subscribe("timeSelectionChanged", self.refresh);
      var handle2 = $.subscribe("totalTimeRangeChanged", self.refresh);
      self.subscriptionHandles.push(handle1);
      self.subscriptionHandles.push(handle2);
    };

    /**
     * unsubscribe from all events.
     */
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    self.initialize();
  };
});
