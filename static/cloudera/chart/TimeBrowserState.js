// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/TimeUtil",
  "cloudera/common/DateUtil",
  "cloudera/chart/TimeRange",
  "cloudera/chart/TimeBrowserServerState",
  "cloudera/chart/TimeBrowserSessionStorage",
  "underscore"
], function(Util, TimeUtil, DateUtil, TimeRange, TimeBrowserServerState, TimeBrowserSessionStorage, _) {

  // These two methods, setTimeSelectionValues and getTimeSelectionValues, were
  // added as a fix for OPSAPS-10329. Weirdly, the event and audit search pages
  // are the only pages that seem to have the problem of missing the initial
  // timeSelectionChanged event. Why is that?
  // Tracked in https://jira.cloudera.com/browse/OPSAPS-11604.
  var setTimeSelectionValues = function(timeRange, isCurrentMode, isAutoUpdate) {
    window._currentTimeSelection = {
      timeRange: timeRange,
      isCurrentMode: isCurrentMode,
      isAutoUpdate: isAutoUpdate
    };
  };

  var getTimeSelectionValues = function() {
    return window._currentTimeSelection;
  };

  // Represents the time browser's state.
  var TimeBrowserState = Class.extend({

    init : function(options) {
      this.firstDate = options.firstDate;
      this.lastDate = options.lastDate;
      this.mode = options.mode;

      this.firstVisibleDate = options.firstVisibleDate;
      this.lastVisibleDate = options.lastVisibleDate;

      this.markerDate = options.markerDate;

      this.setCurrentMode(options.isCurrentMode);

      this.$markerContainer = $(options.markerContainer);
      this.markerRightWidth = 9;

      this.totalTimeRangeChanged = true;
      this.timeSelectionChanged = true;
      this.markerDateChanged = true;
      this.currentModeChanged = true;
      this.sessionStorage = new TimeBrowserSessionStorage();

      if (!this.hasTimeControlParameters() && !Util.getTestMode()) {
        // Retrieves the current state from sessionStorage API.
        // This data is saved on a per-tab basis.
        var serverState = this.sessionStorage.getServerState();
        if (serverState) {
          this.setFromServerState(serverState);
        }
      }
      this.publishAllChanges();
    },

    /**
     * @return true if some fields in TimeControlParameters.java are set.
     */
    hasTimeControlParameters: function() {
      var params = Util.unparam(this.getURLParams());
      var hasStartAndEndTime = params.startTime !== undefined &&
        params.endTime !== undefined;
      var hasMarkerTime = params.markerTime !== undefined;
      return hasMarkerTime || hasStartAndEndTime;
    },

    /**
     * @return the query string if exists.
     */
    getURLParams: function() {
      if (window.location.search.length > 0) {
        return window.location.search.substring(1);
      }
      return "";
    },

    // Invariant:
    // * firstDate <= firstVisibleDate
    // * firstVisibleDate <= markerDate <= lastVisibleDate
    // * firstVisibleDate < lastVisibleDate
    // * lastVisibleDate <= lastDate
    //
    // In current mode, these conditions are true:
    // * markerDate == lastVisibleDate
    // * markerDate == lastDate
    isValid: function() {
      var valid = true;
      if (this.isCurrentMode) {
        valid = this.firstDate <= this.firstVisibleDate &&
          this.firstVisibleDate <= this.markerDate &&
          this.markerDate.getTime() === this.lastVisibleDate.getTime() &&
          this.markerDate.getTime() === this.lastDate.getTime();
      } else {
        valid = this.firstDate <= this.firstVisibleDate &&
          this.firstVisibleDate <= this.markerDate &&
          this.markerDate <= this.lastVisibleDate &&
          this.lastVisibleDate <= this.lastDate;
      }
      return valid;
    },

    // Ensures the object is in a valid state.
    ensureValid: function() {
      if (!this.isValid()) {
        if (this.isCurrentMode) {
          // in the current mode, just make everything right aligned.
          var visibleDuration = this.getVisibleDuration();
          var totalDuration = this.getTotalDuration();
          if (visibleDuration > totalDuration) {
            totalDuration = visibleDuration * 3;
          }
          this.markerDate = this.lastDate;
          this.lastVisibleDate = this.lastDate;
          this.firstVisibleDate = DateUtil.subtract(this.lastVisibleDate, visibleDuration);
          this.firstDate = DateUtil.subtract(this.lastDate, totalDuration);
        } else {
          // in the non-current mode, just make sure
          // everything surrounds the marker.
          this.moveSelectedRangeToIncludeMarker();
          this.moveTotalRangeToIncludeSelected();
        }
      }
    },

    // Expands the total range by a factor of 2.
    zoomOut : function() {
      var timeRange = new TimeRange(this.firstDate, this.lastDate);
      timeRange.expand();
      this.setTotalRange(timeRange);
    },

    // Shrinks the total range by a factor of 2.
    zoomIn : function() {
      var totalDuration = this.getTotalDuration();
      var visibleDuration = this.getVisibleDuration();
      var midPointOfTotal = DateUtil.avg(this.lastDate, this.firstDate);
      var midPointOfVisible = DateUtil.avg(this.lastVisibleDate, this.firstVisibleDate);
      var midPointOfFirstHalf = DateUtil.subtract(midPointOfTotal, totalDuration / 4);
      var midPointOfSecondHalf = DateUtil.add(midPointOfTotal, totalDuration / 4);
      var newRange;

      if (midPointOfFirstHalf <= this.firstVisibleDate && midPointOfSecondHalf >= this.lastVisibleDate) {
        // The visible range is in the middle half.
        newRange = this.getRangeCenteredAt(midPointOfTotal, totalDuration / 2);
      } else if (midPointOfTotal > this.firstVisibleDate && midPointOfTotal > this.lastVisibleDate) {
        // The visible range is in the first half.
        newRange = new TimeRange(this.firstDate, midPointOfTotal);
      } else if (midPointOfTotal < this.firstVisibleDate && midPointOfTotal < this.lastVisibleDate) {
        // The visible range is in the second half.
        newRange = new TimeRange(midPointOfTotal, this.lastDate);
      } else {
        // The length is too long, zoom in to the entire range.
        newRange = new TimeRange(this.firstVisibleDate, this.lastVisibleDate);
      }

      this.setTotalRange(newRange);
    },

    /**
     * Selects the range just before and same size as the currently selected range.
     */
    selectPreviousRange: function() {
      var visibleDuration = this.getVisibleDuration();
      var timeRange = new TimeRange(DateUtil.subtract(this.firstVisibleDate, visibleDuration),
                                    this.firstVisibleDate);
      this.selectRange(timeRange);
    },

    /**
     * Selects the range just after and same size as the currently selected range.
     */
    selectNextRange: function() {
      var visibleDuration = this.getVisibleDuration();
      var timeRange = new TimeRange(this.lastVisibleDate,
                                    DateUtil.add(this.lastVisibleDate, visibleDuration));
      this.selectRange(timeRange);
    },

    selectRange: function(timeRange) {
      this.setSelectedRange(timeRange);
      var isCurrentMode = this.isDateCurrent(timeRange.endDate);
      this.setCurrentMode(isCurrentMode);
      this.moveMarkerIntoSelectedRange();
      if (isCurrentMode) {
        this.setMarkerDate(timeRange.endDate);
      }
    },

    // Expands the selected range by a factor of 2.
    expandRange : function() {
      var timeRange = new TimeRange(this.firstVisibleDate, this.lastVisibleDate);
      timeRange.expand();
      this.setSelectedRange(timeRange);
    },

    getRangeCenteredAt: function(midPoint, duration) {
      var evenDuration = (duration % 2 === 1) ? duration - 1 : duration;
      var startDate = DateUtil.subtract(midPoint, evenDuration / 2);
      var endDate = DateUtil.add(startDate, duration);
      return new TimeRange(startDate, endDate);
    },

    // Moves the selected range so it includes the marker.
    // This should be called by the client after moving the marker.
    moveSelectedRangeToIncludeMarker : function() {
      var newVisibleRange, visibleDuration = this.getVisibleDuration(),
      firstVisibleDate, lastVisibleDate;

      if (this.markerDate.getTime() < this.firstVisibleDate.getTime()) {
        newVisibleRange = this.getRangeCenteredAt(this.markerDate, visibleDuration);
        this.setSelectedRange(newVisibleRange);
      } else if (this.markerDate.getTime() > this.lastVisibleDate.getTime()) {
        newVisibleRange = this.getRangeCenteredAt(this.markerDate, visibleDuration);
        this.setSelectedRange(newVisibleRange);
      }
    },

    // Moves the marker so it is within the selected range.
    // This should be called by the client after moving the selected range.
    moveMarkerIntoSelectedRange : function() {
      if (this.markerDate.getTime() < this.firstVisibleDate.getTime() ||
          this.markerDate.getTime() > this.lastVisibleDate.getTime()) {
        // make the marker to be the mid point of the selected time range.
        if (!this.getCurrentMode()) {
          var markerDate = DateUtil.avg(this.firstVisibleDate, this.lastVisibleDate);
          this.setCurrentMode(false);
          this.setMarkerDate(markerDate);
        }
      }
    },

    // Moves the total range so it includes the selected range.
    // This is automatically called by this object to ensure the selected range
    // is always visible.
    moveTotalRangeToIncludeSelected: function() {
      var firstDate = this.firstDate;
      var lastDate = this.lastDate;

      if (firstDate > this.firstVisibleDate) {
        // moving back
        firstDate = this.firstVisibleDate;
        lastDate = DateUtil.add(firstDate, this.getTotalDuration());
      } else if (lastDate < this.lastVisibleDate) {
        // moving forward
        lastDate = this.lastVisibleDate;
        firstDate = DateUtil.subtract(lastDate, this.getTotalDuration());
      }

      this.setTotalRange(new TimeRange(firstDate, lastDate));

      while (this.getTotalDuration() < this.getVisibleDuration() * 2) {
        var timeRange = new TimeRange(this.firstDate, this.lastDate);
        timeRange.expand();
        this.setTotalRange(timeRange);
      }
    },

    // @return the container's width.
    getContainerWidth: function() {
      return this.$markerContainer.innerWidth();
    },

    // @return the maximum position the marker can be.
    getMaximumOffset : function() {
      var result = this.getContainerWidth() - this.markerRightWidth;
      if (result < 0) {
        result = 0;
      }
      return result;
    },

    // Converts a screen position to a date.
    //
    // @return the date that corresponds to a specific
    // offset from the left edge of the time browser.
    getDateFromOffset: function(offset) {
      var maximumOffset = this.getMaximumOffset();

      if (offset < 0) {
        offset = 0;
      } else if (offset > maximumOffset) {
        offset = maximumOffset;
      }
      // use the downward pointer location to calculate
      // the date value.
      var totalDuration = this.getTotalDuration();
      var duration = offset * totalDuration / maximumOffset;
      return DateUtil.min(DateUtil.add(this.firstDate, duration), this.lastDate);
    },

    // Converts a date to a screen position.
    //
    // @return the screen position that corresponds to a
    // date.
    getOffsetFromDate: function(date) {
      var time = +date;
      var maximumOffset = this.getMaximumOffset();

      if (time < this.firstDate.getTime()) {
        return 0;
      } else if (time > this.lastDate.getTime()) {
        return maximumOffset;
      } else {
        var totalDuration = this.getTotalDuration();
        if (totalDuration > 0) {
          return (time - this.firstDate.getTime()) * maximumOffset / totalDuration;
        } else {
          return 0;
        }
      }
    },

    // @return true if the date is considered to be close
    // enough to the current date.
    isDateCurrent: function(date) {
      // If the date is very close to the right hand edge,
      // then we consider the date to be current.
      var pixelThreshold = 10;

      var totalDuration = this.getTotalDuration();
      var duration = DateUtil.delta(date, this.lastDate);
      var maximumOffset = this.getMaximumOffset();
      var MS_IN_ONE_MINUTE = 60 * 1000;

      var now = TimeUtil.getServerNow();

      if (this.lastDate.getTime() >= now.getTime()) {
        return true;
      } else if (totalDuration > 0) {
        var offsetInPixels = duration * maximumOffset / totalDuration;
        if (offsetInPixels < pixelThreshold) {
          // OK, we are within 10 pixels, but
          // this doesn't mean the lastDate is current.
          // We also need to check if our lastDate is out of date.
          //
          // TODO: This threshold may need to change,
          // because this needs to consider the auto update interval.
          if (DateUtil.delta(this.lastDate, now) < MS_IN_ONE_MINUTE) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    },

    getVisibleDuration : function() {
      return DateUtil.delta(this.firstVisibleDate, this.lastVisibleDate);
    },

    getTotalDuration : function() {
      return DateUtil.delta(this.firstDate, this.lastDate);
    },

    getCurrentMode : function() {
      return this.isCurrentMode;
    },

    moveToNow : function(newDuration, isAutoUpdate) {
      var visibleDuration = newDuration || this.getVisibleDuration();
      var totalDuration = this.getTotalDuration();
      var endDate = TimeUtil.getServerNow();
      var lastDate = endDate;
      var startDate = DateUtil.subtract(endDate, visibleDuration);
      var firstDate = DateUtil.subtract(lastDate, totalDuration);

      this.setSelectedRange(new TimeRange(startDate, endDate), isAutoUpdate);
      this.setTotalRange(new TimeRange(firstDate, lastDate));
      this.setMarkerDate(endDate);
      this.setCurrentMode(true);
    },

    setCurrentMode : function(value) {
      if (this.isCurrentMode !== value) {
        this.isCurrentMode = value;
        this.currentModeChanged = true;
        this.publishCurrentModeChanged();
      }
    },

    setSelectedRange : function(timeRange, isAutoUpdate) {
      timeRange.ensureNotFuture();

      if (!DateUtil.same(timeRange.startDate, this.firstVisibleDate)) {
        this.firstVisibleDate = timeRange.startDate;
        this.timeSelectionChanged = true;
      }

      if (!DateUtil.same(timeRange.endDate, this.lastVisibleDate)) {
        this.lastVisibleDate = timeRange.endDate;
        this.timeSelectionChanged = true;
      }

      if (this.timeSelectionChanged) {
        this.publishTimeSelectionChanged(isAutoUpdate);
      }
    },

    setTotalRange : function(timeRange) {
      timeRange.ensureNotFuture();

      if (!DateUtil.same(timeRange.startDate, this.firstDate)) {
        this.firstDate = timeRange.startDate;
        this.totalTimeRangeChanged = true;
      }

      if (!DateUtil.same(timeRange.endDate, this.lastDate)) {
        this.lastDate = timeRange.endDate;
        this.totalTimeRangeChanged = true;
      }

      if (this.totalTimeRangeChanged) {
        this.publishTotalTimeRangeChanged();
      }
    },

    setMarkerDate : function(markerDate) {
      if (!DateUtil.same(markerDate, this.markerDate)) {
        this.markerDate = markerDate;
        this.markerDateChanged = true;
      }

      if (this.markerDateChanged) {
        this.publishMarkerDateChanged();
      }
    },

    setFromServerState : function(serverState) {
      if (this.mode !== "TIMEONLY") {
        if (serverState.currentMode) {
          // serverState says we should render
          // in the current mode.
          if (!this.getCurrentMode()) {
            // The page says otherwise.
            // In this case, the serverState wins.
            this.setMarkerDate(TimeUtil.getServerNow());
            this.setCurrentMode(true);
          }
          // Otherwise both the page and the serverState
          // says we are in the current mode, we have to honor
          // the marker date set by the page and do nothing.
        } else {
          // In this case, the page is in the current mode,
          // We have to honor the marker date set by the
          // serverState and ignore the page.
          this.setMarkerDate(new Date(serverState.markerTime));
          this.setCurrentMode(false);
        }
      }
      // Otherwise in the TIMEONLY mode, the server picks
      // the time, so we have to honor the marker date set by the page.

      if (this.getCurrentMode()) {
        // Need to preserve the duration.
        var totalDuration = serverState.lastTime - serverState.firstTime;
        var visibleDuration = serverState.endTime - serverState.startTime;
        this.setSelectedRange(new TimeRange(DateUtil.subtract(this.markerDate, visibleDuration), this.markerDate));
        this.setTotalRange(new TimeRange(DateUtil.subtract(this.markerDate, totalDuration), this.markerDate));
      } else {
        this.setSelectedRange(new TimeRange(new Date(serverState.startTime), new Date(serverState.endTime)));
        this.setTotalRange(new TimeRange(new Date(serverState.firstTime), new Date(serverState.lastTime)));
        this.setMarkerDate(new Date(serverState.markerTime));
      }
    },

    // Publish all change events using defer.
    // This ensures the current function thread completes
    // before the state is validated and events are published.
    //
    // The caller to this library may temporarily put
    // the object in an invalid state, e.g. moving
    // the marker. However, it is also the caller's
    // responsibility to try put the object back to a
    // valid state.
    //
    // Therefore we won't call ensureValid too early.
    // This is really important because we won't
    // call ensureValid prematurely.
    publishTotalTimeRangeChanged : function() {
      var self = this;
      _.defer(function(){
        if (self.totalTimeRangeChanged) {
          self.ensureValid();
          jQuery.publish("totalTimeRangeChanged", [new TimeRange(self.firstDate, self.lastDate), self.isCurrentMode]);
          self.totalTimeRangeChanged = false;
          self.publishStateChanged();
        }
      });
    },
    
    publishTimeSelectionChanged : function(isAutoUpdate) {
      var self = this;
      _.defer(function() {
        if (self.timeSelectionChanged) {
          // Publish the timeSelectionChanged event.
          self.ensureValid();
          var timeRange = new TimeRange(self.firstVisibleDate, self.lastVisibleDate);
          jQuery.publish("timeSelectionChanged", [timeRange, self.isCurrentMode, isAutoUpdate]);
          self.timeSelectionChanged = false;
          self.publishStateChanged();
          // Cache the results somewhere.
          setTimeSelectionValues(timeRange, self.isCurrentMode, isAutoUpdate);
        }
      });
    },

    publishMarkerDateChanged : function() {
      var self = this;
      _.defer(function(){
        if (self.markerDateChanged) {
          self.ensureValid();
          jQuery.publish("markerDateChanged", [self.markerDate, self.isCurrentMode]);
          self.markerDateChanged = false;
          self.publishStateChanged();
        }
      });
    },

    publishCurrentModeChanged : function() {
      var self = this;
      _.defer(function(){
        if (self.currentModeChanged) {
          self.ensureValid();
          if (self.isCurrentMode) {
            jQuery("body")
            .removeClass("historicalMode")
            .addClass("currentMode");
          } else {
            jQuery("body")
            .addClass("historicalMode")
            .removeClass("currentMode");
          }
          jQuery.publish("currentModeChanged");
          self.currentModeChanged = false;
          self.publishStateChanged();
        }
      });
    },

    publishStateChanged : function() {
      var self = this;
      _.defer(function(){
        jQuery.publish("timeBrowserStateChanged");
        // Write it on the browser using the sessionStorage API.
        var serverState = new TimeBrowserServerState(self);
        self.sessionStorage.setServerState(serverState);
      });
    },

    publishAllChanges : function() {
      this.publishCurrentModeChanged();
      this.publishTimeSelectionChanged();
      this.publishTotalTimeRangeChanged();
      this.publishMarkerDateChanged();
    }
  });

  TimeBrowserState.getTimeSelectionValues = getTimeSelectionValues;

  return TimeBrowserState;
});
