// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
/*global define: false, $: false */

define([
  "cloudera/Util",
  "cloudera/cmf/include/ProgressBar",
  "cloudera/common/TimeUtil",
  "underscore"
], function(Util, ProgressBar, TimeUtil, _) {
  "use strict";

/**
 * options = {
 *   containerSelector: "DOM element",
 *   fetchUrl: "fetch URL"
 * }
 */
return function(options) {
  /**
   * Need to figure out when to update the status bar of the command details page.
   *
   * If we need to schedule the update at least twice, then we are looking at a
   * command details of a command that has not finished yet. Set a flag to
   * needToUpdateStatusBar true.
   *
   * Once the command is complete, switch to the current mode. This should
   * refresh the status bar. In the Express mode, this should still take effect
   * because this effectively simulates the presence of a time control.
   */
  var self = this;
  var needToUpdateStatusBar = false;
  var $commandDetailsContainer = $(options.containerSelector);
  var isRunning = true;

  self.scheduleNextUpdate = function() {
    if (!Util.getTestMode()) {
      setTimeout(self.fetchData, 1000);
    }
  };

  $commandDetailsContainer.on("click", "input[type=radio]", function(evt) {
    if (!isRunning) {
      _.debounce(self.fetchData, 1000, true)();
    }
  });

  function getParams() {
    var filters = $commandDetailsContainer.find("input[name=showFilter]");
    return {
      // $(filters[0] is All.
      "showFailedOnly": $(filters[1]).is(":checked"),
      "showActiveOnly": $(filters[2]).is(":checked")
    };
  }

  // Expose it for testing purposes.
  self.fetchData = function() {
    $.post(
      options.fetchUrl,
      getParams(),
      function(response) {
        Util.html($commandDetailsContainer, response);
        var $overallProgress = $commandDetailsContainer.find(".overallProgress");
        var $commandCompleted =  $commandDetailsContainer.find(".commandCompleted");
        if ($commandCompleted.length === 0) {
          if ($(options.containerSelector).is(":visible")) {
            self.scheduleNextUpdate();
            // the command is not yet complete.
            needToUpdateStatusBar = true;
          }
        } else {
          isRunning = false;
          $overallProgress.parent().ProgressBar('success');
          if (needToUpdateStatusBar) {
            // This switches to the current mode.
            jQuery.publish("markerDateChanged", [TimeUtil.getServerNow(), true]);
          }
        }
      }
    );
  };

  self.scheduleNextUpdate();
};

});
