// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/common/I18n",
  "knockout"
], function(I18n, ko) {
  
  return function(options) {
    var UPDATE_INTERVAL_MS = 500;
    
    var self = this;

    /**
     * Initialize the knockout state.
     */
    self.terminateFailed = ko.observable(false);
    self.progressText = ko.observable($("#progressText").text() || "");

    var callback;

    function ajaxError(response) {
      $.publish("showError", (response.errorMessage || I18n.t("ui.sorryAnError"))
          + " " + options.ajaxErrorMsg);
      return false;
    }

    function getProgress() {

      $.ajax({
        type: 'POST',
        url: options.progressUrl,
        data: {
          terminatorId: options.terminatorId
        },
        success: callback,
        error: ajaxError,
        dataType: 'json'
      });
    }

    callback = function(response) {
      if (response.terminator.error) {
        $("#status").attr('class', 'IconError16x16');
      } else if (response.terminator.completed) {
        $("#status").attr('class', 'IconCheckmark16x16');
      }
      
      self.progressText(response.terminator.progress);
      if (response.terminator.error) {
        self.progressText(self.progressText().replace("+", 
            response.terminator.errorText));
      }
      
      self.terminateFailed(response.terminator.error);
      
      if (response.terminator.completed && !response.terminator.error) {
        self.postTerminate();
      } else if (!response.terminator.completed) {
        setTimeout(getProgress, UPDATE_INTERVAL_MS);
      }
    };

    getProgress();

    self.postTerminate = function() {
      switch (options.postTerminate) {
      // We want to go back options.stepsBack + 1 steps here because 
      // options.stepsBack is relative to the PREVIOUS page we were on.
      case "back" : 
        history.go(-(options.stepsBack + 1)); 
        break; 
      case "url": 
        window.location.href = options.postUrl; 
        break; 
      }
    };

    self.applyBindings = function() {
      ko.applyBindings(self, $(options.container)[0]);
    };
  };
});
