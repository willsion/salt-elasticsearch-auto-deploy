// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/Util",
   "cloudera/common/DateUtil",
   "cloudera/common/Humanize",
   "cloudera/common/I18n",
   "cloudera/common/TimeUtil",
   "underscore"
], function(Util, DateUtil, Humanize, I18n, TimeUtil, _) {

  // Responsibilities:
  // * Listens to time range selection/marker changes,
  // * Updates all time range /marker labels.
  return function() {
    var MS_IN_ONE_HOUR = 60 * 60 * 1000;

    // @return the time string formatted.
    var getTimeString = function(time) {
      return Humanize.humanizeTimeMedium(time);
    };

    // @return the timezone string.
    var getTimezoneString = function() {
      return TimeUtil.getTimezoneDisplayName();
    };

    // Highlights and sets the content inside the specified selector.
    // @param selector - the specified selector.
    // @param content - the new content.
    // @param isCurrentMode - current mode or not.
    var highlightUpdate = function(selector, content, isCurrentMode, highlight) {
      if (isCurrentMode || !highlight) {
        $(selector).html(content);
      } else {
        var callback = function() {
          setTimeout(function() {
            $(selector).removeAttr( "style" ).fadeIn();
          }, 1000 );
        };
        $(selector).html(content).effect("highlight", {}, 1000, callback);
      }
    };

    // Updates all occurrences of <? class="selectedTimeRangeLabel"></?>
    // with the current selected range.
    var updateTimeRangeLabel = function(range, isCurrentMode) {
      // convert the range to the number of hours.
      var numHours = DateUtil.delta(range.startDate, range.endDate) / MS_IN_ONE_HOUR,
      formattedStartDate = Humanize.humanizeDateLong(range.startDate),
      formattedEndDate = Humanize.humanizeDateLong(range.endDate),
      rangeLabel;

      if (formattedStartDate === formattedEndDate) {
        // (Jul 8, 2011, 8:00 PM to 9:00 PM)
        rangeLabel = [
          formattedStartDate, ", ", getTimeString(range.startDate),
          " - ", getTimeString(range.endDate), " ", getTimezoneString()
          ].join("");
      } else {
        // (Jul 8, 2011, 8:00 PM to Jul 9, 2011, 9:00 PM)
        rangeLabel = [
          formattedStartDate, ", ", getTimeString(range.startDate),
          " - ", formattedEndDate, ", ", getTimeString(range.endDate), " ", getTimezoneString()
          ].join("");
      }
      highlightUpdate(".selectedTimeRangeLabel", rangeLabel, isCurrentMode, false);
    };

    // Updates all occurrences of <? class="selectedEndTimeLabel"></?>
    // with the current selected range's end time.
    var updateMarkerTimeLabel = function(markerDate, isCurrentMode) {
      var formattedEndDate = Humanize.humanizeDateLong(markerDate),
      timeLabel = [
          formattedEndDate, ", ", getTimeString(markerDate), " ", getTimezoneString()].join("");

      highlightUpdate(".selectedTimeEndTimeLabel", timeLabel, isCurrentMode, true);
    };

    var handle1 = $.subscribe("timeSelectionChanged", updateTimeRangeLabel);
    var handle2 = $.subscribe("markerDateChanged", updateMarkerTimeLabel);

    this.subscriptionHandles = [handle1, handle2];

    this.unsubscribe = function() {
      Util.unsubscribe(this);
    };
  };
});
