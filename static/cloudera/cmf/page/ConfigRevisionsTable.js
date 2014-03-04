// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util"
], function(Util) {

return function(options) {

  var showSelectedTimeRange = false;
  var currentRange;

  var _handleTimeChange = function(range){

    var url, timeRange, urlParams;

    // Every time this method is called,
    // store the currentRange
    if (range) {
      currentRange = range;
    }

    if (showSelectedTimeRange) {
      if (range) {
        options.urlParams.startTime = range.startDate.getTime();
        options.urlParams.endTime = range.endDate.getTime();
      }

      url = options.url + "?" + $.param(options.urlParams);

    } else {

      timeRange = {
        startTime: -1,
        endTime: -1
      };
      urlParams = $.extend({}, options, timeRange);
      url = options.url + "?" + $.param(urlParams);
    }

    $.get(url, function(response) {
      try {
        $(options.containerSelector).html(Util.filterError(response));
      } catch (ex) {
        console.log(ex);
      }
    });
  };

  // Initially, the start/end values from options,
  // subsequently, they come from a callback function,
  // which provides a range parameter.
  var initialRange = {
    startDate: new Date(options.urlParams.startTime),
    endDate: new Date(options.urlParams.endTime)
  };

  // Update the initial value on ready.
  _handleTimeChange(initialRange);
  jQuery.subscribe("timeSelectionChanged", _handleTimeChange);

  // This page should never auto refresh.
  jQuery.publish("pauseAutoRefresh");

  var toggleShowSelectedTimeRange = function(evt, newShowSelectedTimeRange, range) {
    evt.preventDefault();

    if (showSelectedTimeRange !== newShowSelectedTimeRange) {
      showSelectedTimeRange = newShowSelectedTimeRange;
      // passing undefined is OK because it is not used.
      _handleTimeChange(range);
      if (showSelectedTimeRange) {
        // Find the showAll button, and toggle the selected state.
        // notSelected is required because otherwise
        // the CSS is not applied correctly.
        $(options.outerContainerSelector).find(".showAll")
          .addClass("notSelected").removeClass("selected")
        .end().find(".showSelectedTimeRange")
          .addClass("selected").removeClass("notSelected");
      } else {
        $(options.outerContainerSelector).find(".showSelectedTimeRange")
          .addClass("notSelected").removeClass("selected")
        .end().find(".showAll").addClass("selected").removeClass("notSelected");
      }
    } else {
      return false;
    }
  };

  var onShowAll = function(evt) {
    return toggleShowSelectedTimeRange(evt, false, undefined);
  };

  var onShowSelectedTimeRange = function(evt) {
    return toggleShowSelectedTimeRange(evt, true, currentRange);
  };

  var $outerContainerSelector = $(options.outerContainerSelector);

  $outerContainerSelector.find(".showAll a")
    .click(onShowAll)
  .end().find(".showSelectedTimeRange a")
    .click(onShowSelectedTimeRange);

  // otherwise this DOM variable would
  // be visible in all the private functions of this closure,
  // may leak memory.
  $outerContainerSelector = null;
};

});
