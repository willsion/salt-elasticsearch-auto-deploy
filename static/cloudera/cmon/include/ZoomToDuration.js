// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "knockout",
  "underscore",
  "cloudera/common/DateUtil",
  "cloudera/common/Humanize",
  "cloudera/common/I18n",
  "cloudera/common/TimeUtil",
  "cloudera/chart/TimeRange"
], function(ko, _, DateUtil, Humanize, I18n, TimeUtil, TimeRange) {

  // How much extra time we should allocate.
  var THRESHOLD_IN_MS = 60 * 1000;

  /**
   * options = {
   *   container: the DOM element that we should listen to.
   *
   *   startDate: (optional) the start date of the selected activity.
   *   If it is undefined, then it means the activity has not started yet.
   *
   *   endDate: (optional) the end date of the selected activity.
   *   If it is null, then it means the activity has not finished yet.
   * }
   */

  function ZoomToDuration(options) {
    this.options = options;
    $(options.container).tooltip();
    ko.applyBindings(this, $(options.container)[0]);
  }

  ZoomToDuration.prototype.isDisabled = function() {
    return _.isUndefined(this.options.startDate);
  };

  ZoomToDuration.prototype.onclick = function() {
    // otherwise this job has not started yet.
    if (!_.isUndefined(this.options.startDate)) {
      var timeRange = new TimeRange(this.getStartDate(), this.getEndDate());
      $.publish("changeTimeSelection", [timeRange]);
    }
  };

  ZoomToDuration.prototype.getTitle = function() {
    var startDate = this.getStartDate();
    var endDate = this.getEndDate();
    var result = "";

    if (_.isUndefined(startDate)) {
      result = I18n.t("ui.notStarted");
    } else {
      var startTimeStr = Humanize.humanizeDateTimeMedium(startDate);
      var endTimeStr = Humanize.humanizeDateTimeMedium(endDate);
      result = I18n.t("ui.zoomToDurationTip", startTimeStr, endTimeStr);
    }

    return result;
  };

  ZoomToDuration.prototype.getStartDate = function() {
    if (_.isUndefined(this.options.startDate)) {
      return undefined;
    } else {
      return DateUtil.subtract(this.options.startDate, THRESHOLD_IN_MS);
    }
  };

  ZoomToDuration.prototype.getEndDate = function() {
    var now = TimeUtil.getServerNow(), endDate;

    if (_.isUndefined(this.options.endDate)) {
      endDate = now;
    } else {
      endDate = DateUtil.add(this.options.endDate, THRESHOLD_IN_MS);
      if (+endDate > +now) {
        endDate = now;
      }
    }
    return endDate;
  };

  return ZoomToDuration;
});
