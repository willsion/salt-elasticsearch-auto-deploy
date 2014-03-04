// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/TimeUtil"
], function(Util, TimeUtil) {

/**
 * This JavaScript allows a HTML element to be reloaded
 * via AJAX every time the selection time range changes.
 *
 * The new HTML content is loaded into the first element
 * matching options.containerSelector.
 *
 * The bootstrap-tooltip plugin is applied to all descendants of
 * options.containerSelector with the "showTooltip" class and a
 * truthy "title" attribute.
 *
 * There are two cases:
 * 1. We need to show data for a specific time range.
 *    In this case, urlParams should contain { startTime: ..., endTime: ... }
 * 2. We need to show data for a specific time stamp.
 *    In this case, urlParams should contain { timestamp: ..., currentMode: ..., }
 *
 * options = {
 *  urlParams: { ... },
 *  updateOnPageLoad: true | false (optional),
 *  isCurrentMode: true | false
 *  url: ""
 *  containerSelector: "#containerId",
 *  beforeFetch:    (optional) function()
 *  beforeUpdate:   (optional) function()
 *  afterUpdate:    (optional) function(response)
 *  tooltipOptions: (optional) { (see http://twitter.github.com/bootstrap/javascript.html#tooltips) }
 * }
 */
return function(options) {

  var oldRange;
  var oldMarkerDate;

  var activeTooltipIndex = null;

  var tooltipOptions = $.extend({}, options.tooltipOptions, {
    trigger: "manual",
    placement: "bottom",
    delay: {
      show: 1000,
      hide: 100
    }
  });

  var cleanupTooltips = function() {
    $(options.containerSelector).find(".showTooltip").each(function(index, item){
      var $item = $(item);
      // If the tooltip plugin was applied, the <tr> will now have a
      // data-original-title attribute.
      if ($item.attr("data-original-title")) {
        $item.tooltip("hide");
        $item.off("mouseenter");
        $item.off("mouseleave");
      }
    });
  };

  var setupTooltips = function() {
    $(options.containerSelector).find(".showTooltip").each(function(index, item){
      var $item = $(item);
      if ($item.attr("title")) {
        $item.tooltip(tooltipOptions);
        $item.mouseenter(function(event){
          $item.tooltip("show");
          activeTooltipIndex = index;
        });
        $item.mouseleave(function(event){
          $item.tooltip("hide");
          activeTooltipIndex = null;
        });
        if (index === activeTooltipIndex) {
          $item.tooltip("show");
        }
      }
    });
  };

  var partialUpdate = function(url) {
    if (options.beforeFetch && $.isFunction(options.beforeFetch)) {
      options.beforeFetch();
    }
    $.post(url, function(response) {
      try {
        cleanupTooltips();
        var filteredResponse = Util.filterError(response);
        var $filteredResponse = $(filteredResponse);
        if (options.beforeUpdate && $.isFunction(options.beforeUpdate)) {
          $filteredResponse = options.beforeUpdate($filteredResponse);
        }
        $(options.containerSelector).html($filteredResponse);
        setupTooltips();
        if (options.afterUpdate && $.isFunction(options.afterUpdate)) {
          options.afterUpdate($filteredResponse);
        }
      } catch (ex) {
        console.log(ex);
      }
    });
  };

  var isDifferent = function(date1, date2) {
    if (date1 && !date2) {
      return true;
    } else if (!date1 && date2) {
      return true;
    } else {
      return date1.getTime() !== date2.getTime();
    }
  };

  var isRangeDifferent = function(range1, range2) {
    if (range1 && !range2) {
      return true;
    } else if (!range1 && range2) {
      return true;
    } else {
      return isDifferent(range1.startDate, range2.startDate) ||
        isDifferent(range1.endDate, range2.endDate);
    }
  };

  var _handleTimeChange = function(range, currentMode){
    if (options.urlParams.hasOwnProperty("startTime") &&
        options.urlParams.hasOwnProperty("endTime")) {
      if (isRangeDifferent(oldRange, range)) {
        oldRange = range;
        var urlParams = $.extend({}, options.urlParams);
        urlParams.startTime = range.startDate.getTime();
        urlParams.endTime = range.endDate.getTime();

        var url = options.url + "?" + $.param(urlParams);
        partialUpdate(url);
      }
    }
  };

  var _handleMarkerDateChange = function(markerDate, currentMode) {
    if (options.urlParams.hasOwnProperty("timestamp")) {
      if (isDifferent(oldMarkerDate, markerDate)) {
        oldMarkerDate = markerDate;
        var urlParams = $.extend({}, options.urlParams);
        if (Util.isNumber(markerDate.getTime())) {
            urlParams.timestamp = markerDate.getTime();
            urlParams.currentMode = currentMode;
        } else {
            urlParams.timestamp = TimeUtil.getServerNow().getTime();
            urlParams.currentMode = true;
        }
        var url = options.url + "?" + $.param(urlParams);
        partialUpdate(url);
      }
    }
  };

  // Initially, the start/end values should come from the options parameter.
  // Subsequently, they should come from a callback function.
  // The $("#cmsTimeControl").length === 0 check is a fix for OPSAPS-4787.
  // In Safari, the on document load functions execute in a different order
  // than in Chrome and Firefox, which causes a race condition between
  // the updateOnPageLoad's handleTimeChange and the time control's
  // initialization.
  // We also need to check the flash version.
  var timeControlActive = $("#cmsTimeControl").length !== 0;
  if (options.updateOnPageLoad && !timeControlActive) {
    if (options.urlParams.hasOwnProperty("startTime") &&
        options.urlParams.hasOwnProperty("endTime")) {
      var initialRange = {
        startDate: new Date(options.urlParams.startTime),
        endDate: new Date(options.urlParams.endTime)
      };
      // Update the initial value on ready.
      _handleTimeChange(initialRange, options.isCurrentMode);
    } else if (options.urlParams.hasOwnProperty("timestamp")) {
      var markerDate = new Date(options.urlParams.timestamp);
      _handleMarkerDateChange(markerDate, options.isCurrentMode);
    }
  }

  var handle1 = jQuery.subscribe("timeSelectionChanged", _handleTimeChange);
  var handle2 = jQuery.subscribe("markerDateChanged", _handleMarkerDateChange);
  this.subscriptionHandles = [handle1, handle2];
  this.unsubscribe = function() {
    Util.unsubscribe();
  };
};

});
