// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/layout/AjaxLink",
  "cloudera/common/TimeUtil"
], function(Util, AjaxLink, TimeUtil) {
  /**
   * Launches a Heatmap popup via an AjaxLink.
   */
  var HeatmapPopupLauncher = function(element) {
    var $element = $(element);

    var timestampAttr = $element.attr("data-timestamp");
    var currentModeAttr = $element.attr("data-current-mode");
    var ajaxUrlAttr = $element.attr("data-ajax-url");
    var keyAttr = $element.attr("data-key");

    var oldCurrentMode = currentModeAttr === "true" ? true : false;
    var oldMarkerDate = new Date(Number(timestampAttr));
    var oldTestName;

    var prepareUrl = function (markerDate, testName) {
      var url, urlParams = {};
      if (Util.isNumber(markerDate.getTime())) {
        urlParams.timestamp = markerDate.getTime();
      } else {
        urlParams.timestamp = TimeUtil.getServerNow().getTime();
      }
      urlParams.currentMode = oldCurrentMode;
      urlParams.testName = oldTestName;
      if (keyAttr) {
        urlParams.key = keyAttr;
      }

      url = ajaxUrlAttr + "?" + $.param(urlParams);
      $element.attr("href", url);
      $element.AjaxLink('click');
    };

    var onHeatmapSelectionChanged = function(testName) {
      oldTestName = testName;
      prepareUrl(oldMarkerDate, oldTestName);
    };

    var onMarkerDateChanged = function (markerDate, currentMode) {
      oldMarkerDate = markerDate;
      oldCurrentMode = currentMode;
      // When marker date changes, we don't want heatmaps to show up automatically,
      // So no need to do anything because the popup itself
      // will update the content.
    };

    jQuery.subscribe("heatmapSelectionChanged", onHeatmapSelectionChanged);
    jQuery.subscribe("markerDateChanged", onMarkerDateChanged);
  };

  $.fn.HeatmapPopupLauncher = function (option) {
    return this.each(function () {
      var $this = $(this), data = $this.data("HeatmapPopupLauncher");
      if (!data) {
        $this.data("HeatmapPopupLauncher", (data = new HeatmapPopupLauncher(this)));
      }
    });
  };

  return $.fn.HeatmapPopupLauncher;
});
