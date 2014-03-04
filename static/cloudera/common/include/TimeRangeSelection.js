// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util"
], function(Util) {
  /**
   * @param {Object} options = {
   *   container: "the DOM selector of the containing element"
   * }
   */
  return function TimeRangeSelection(options) {
    var $container = $(options.container);
    $container.find("a").click(function(evt) {
      var minutes = $(evt.target).attr("data-minutes");
      $.publish("setTimeRangeSelection", [minutes * 60 * 1000]);
      return false;
    });

    this.subscriptionHandles = [];

    this.subscriptionHandles.push($.subscribe("timeSelectionChanged", function(timeRange) {
      var duration = timeRange.duration();
      var durationInMinutes = duration / 60000;
      // Reset everything.
      $container.find("a").removeClass("bold").removeClass("nodecoration");
      // Make the one that match bold.
      $container.find("[data-minutes='" + durationInMinutes + "']").addClass("bold").addClass("nodecoration");
    }));

    this.unsubscribe = function() {
      Util.unsubscribe(this);
    };
  };
});
