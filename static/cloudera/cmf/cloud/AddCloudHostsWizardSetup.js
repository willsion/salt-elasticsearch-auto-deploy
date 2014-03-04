// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/common/I18n",
  "cloudera/cmf/include/ProgressBar",
  "cloudera/Util",
  "knockout"
], function(I18n, ProgressBar, Util, ko) {
  
  return function(options) {
    var UPDATE_INTERVAL_MS = 500;
    
    var self = this;

    /**
     * Initialize the knockout state.
     */
    self.setupSuccessful = ko.observable(false);
    self.setupDone = ko.observable(false);
    self.showKey = ko.observable(false);
    self.progressText = ko.observable($("#progressText").text() || "");
    self.privateKey = ko.observable("");
    self.setupError = ko.observable(false);
    self.instancesExist = ko.observable(false);
    self.errorCauseText = ko.observable("");
    
    var callback;
    var progressBarEl = $('#progressBar').parent();
    
    function ajaxError(response) {
      $.publish("showError", (response.errorMessage || I18n.t("ui.sorryAnError"))
          + " " + options.terminateAjaxErrorMsg);
      return false;
    }

    function getProgress() {

      $.ajax({
        type: 'POST',
        url: options.cloudSetupProgressUrl,
        data: {
          configId: options.configId
        },
        success: callback,
        error: ajaxError,
        dataType: 'json'
      });
    }

    callback = function(response) {
      
      self.instancesExist(response.configurator.instancesExist);
      if (self.instancesExist()) {
          $("#quitButton").html(options.quitTerminate);
          $("#backButton").html(options.backTerminate);
        }
      
      self.setupSuccessful(response.configurator.completed && 
        !response.configurator.error);
      self.setupError(response.configurator.error);
      self.setupDone(response.configurator.completed);
      self.privateKey(response.configurator.privateKey);
      self.showKey(self.setupSuccessful() && response.configurator.privateKey !== null);
      
      progressBarEl.ProgressBar({'percent': response.configurator.progressPercent});        
      self.progressText(response.configurator.progress);

      if (self.setupError()) {
        $("#status").attr('class', 'IconError16x16');
        progressBarEl.ProgressBar('fail');
        self.errorCauseText(response.configurator.errorText);
      } else if (self.setupSuccessful()) {
        $("#status").attr('class', 'IconCheckmark16x16');
        progressBarEl.ProgressBar('success');
      }
      
      if (!self.setupDone()) {
        setTimeout(getProgress, UPDATE_INTERVAL_MS);
      }
    };
    
    getProgress();

    function cloudTerminate(terminateInfo) {
      $.ajax({
        type: 'GET',
        url: options.cloudTerminateUrl,
        data: terminateInfo,
        error: ajaxError,
        dataType: 'html',
        success: function(response) {
          var filteredResponse = Util.filterError(response);
          $("body").append(filteredResponse);
        },
        cache: false
      });
    }

    function quit() {
      window.location.href = options.exitUrl;
    }

    self.quitClick = function(event) {
      if (self.instancesExist()) {
        // Load the termination progress page (terminate all started 
        // instances); after termination, navigate to exit URL.
        cloudTerminate({cloudConfigId: options.configId, postTerminate: 
          'url', postUrl: options.exitUrl});
      } else {
        quit();
      }
    };

    function back() {
      history.go(-1);
    }

    self.backClick = function(event) {
      if (self.instancesExist()) {
        // Load the termination progress page (terminate all started 
        // instances); after termination, go back one page from this 
        // point (from cloud-setup).
        cloudTerminate({cloudConfigId: options.configId, postTerminate: 
          'back', stepsBack: 4});
      } else {
        back();
      }
    };

    self.applyBindings = function() {
      ko.applyBindings(self, $(options.container)[0]);
    };
  };
});
