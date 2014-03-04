// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/Util",
   "cloudera/common/DateUtil",
   "cloudera/chart/TimeRange",
   "knockout",
   "underscore"
], function(Util, DateUtil, TimeRange, ko, _) {
  /**
   * options = {
   *   container:           (required) DOM element of the parent element.
   *   breadcrumbContainer: (required) DOM element of the breadcrumb.
   *   showRange:           (required) true to show the range label, false to show the time label.
   *   state:               (required) a shared TimeBrowserState object. It should be
   *                        the same object used in TimeControl2.
   * }
   */
  return function(options) {
    var $container = $(options.container);
    var $breadcrumbContainer = $(options.breadcrumbContainer);
    var showRange = options.showRange;

    var self = this;
    self.state = options.state;
    self.STATE_EXPANDED = "expanded";
    self.STATE_COLLAPSED = "collapsed";
    self.EVENT_TOGGLE_TIME_CONTROL = "toggleTimeControl";
    self.EVENT_SHOW_DATE_TIME_SELECTOR = "showDateTimeSelector";
    self.EVENT_SWITCH_TO_CURRENT = "switchToCurrent";
    self.EVENT_SET_TIME_RANGE_SELECTION = "setTimeRangeSelection";

    self.toggleState = ko.observable(self.STATE_EXPANDED);

    /**
     * Toggles the actual time control's visibility.
     */
    self.toggle = function() {
      if (self.toggleState() === self.STATE_EXPANDED) {
        self.toggleState(self.STATE_COLLAPSED);
      } else {
        self.toggleState(self.STATE_EXPANDED);
      }
      $.publish(self.EVENT_TOGGLE_TIME_CONTROL);
    };

    /**
     * Whether the Now button should be visible or not.
     */
    self.nowVisible = ko.observable(false);
    self.showNow = function() {
      self.nowVisible(true);
    };

    self.hideNow = function() {
      self.nowVisible(false);
    };

    /**
     * Triggers the date time selector.
     */
    self.showDateTimeSelector = function() {
      $.publish(self.EVENT_SHOW_DATE_TIME_SELECTOR);
    };

    self.now = function() {
      $.publish(self.EVENT_SWITCH_TO_CURRENT);
    };

    /**
     * Changes the duration of the selected time range by
     * changing the starting time only.
     *
     * @param duration - duration in milliseconds.
     */
    self.setTimeRangeDuration = function (duration) {
      var timeRange = new TimeRange(DateUtil.subtract(self.state.lastVisibleDate, duration),
                                    self.state.lastVisibleDate);
      self.state.setSelectedRange(timeRange);
      self.state.moveMarkerIntoSelectedRange();
    };

    self.timeOffsetLeft = ko.observable(0);
    self.timePosition = ko.observable("static");

    /**
     * We need to check how many breadcrumbs there are and
     * make sure our time label doesn't overlap it.
     */
    self.getLeftMargin = function() {
      var $lastLi = $breadcrumbContainer.find("li").last();
      var leftOffset = 0;
      if ($lastLi.length > 0) {
        leftOffset = $lastLi.offset().left + $lastLi.width();
      }
      return leftOffset;
    };

    /**
     * We need to leave enough room for the toggle icon.
     */
    self.getRightMargin = function() {
      var $toggleIcon = $container.find(".toggle-icon");
      var PADDING_BEFORE_ICON = 60;
      return PADDING_BEFORE_ICON + $toggleIcon.width();
    };

    /**
     * Calculates the offset position to place the time label.
     * This code uses the selected time range or the marker date
     * as a hint to position the time label. It is either centered on
     * top of the selected range or the marker date.
     *
     * If it is too far to the left or right, it is capped accordingly.
     */
    self.getTimeLabelOffsetLeft = function() {
      var $label = $container.find(".time-label");
      var $switchToCurrentBtn = $container.find(".switchToCurrent");
      var labelWidth = $label.width();

      // Center the label to the range or to the marker date.
      var date = self.state.markerDate;
      if (options.showRange) {
        date = DateUtil.add(self.state.firstVisibleDate, self.state.getVisibleDuration() / 2);
      }
      var dateFromOffset = self.state.getOffsetFromDate(date) - labelWidth / 2;

      // Minimum offset to set.
      var minLeftOffset = self.getLeftMargin();

      // Maximum offset to set.
      var maxRightOffset = $(window).width() - self.getRightMargin() - $label.width();

      dateFromOffset = Math.max(minLeftOffset, dateFromOffset);
      dateFromOffset = Math.min(maxRightOffset, dateFromOffset);
      return dateFromOffset;
    };

    /**
     * Refreshes the time label's absolute position.
     */
    self.onRefresh = function() {
      var labelWidth = $container.find(".time-label").width();
      if (labelWidth !== 0) {
        var timeLabelOffsetLeft = self.getTimeLabelOffsetLeft();
        self.setTimeLabelOffsetAndPosition(timeLabelOffsetLeft, "absolute");
      }
    };

    self.setTimeLabelOffsetAndPosition = function(timeOffsetLeft, timePosition) {
      self.timeOffsetLeft(timeOffsetLeft);
      self.timePosition(timePosition);
    };

    // Handles the window resize event.
    $(window).resize(_.debounce(self.onRefresh, 100));

    var handle1 = $.subscribe("markerDateChanged", _.bind(self.onRefresh, self));
    var handle2 = $.subscribe("timeSelectionChanged", _.bind(self.onRefresh, self));
    var handle3 = $.subscribe("totalTimeRangeChanged", _.bind(self.onRefresh, self));
    var handle4 = $.subscribe(self.EVENT_SET_TIME_RANGE_SELECTION, _.bind(self.setTimeRangeDuration, self));

    self.subscriptionHandles = [handle1, handle2, handle3, handle4];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    ko.applyBindings(self, $container[0]);
  };
});
