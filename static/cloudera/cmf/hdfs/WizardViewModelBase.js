// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout:false, location: false, console: false, define: false, $: false */
define([
  "cloudera/Util",
  "cloudera/cmf/include/ProgressBar",
  "knockout"
], function (Util, ProgressBar, ko) {
  "use strict";

  /**
   * The base class for SCM workflow wizards.
   *
   * TODO: This is not the true base class for all wizards,
   * Just those that have a review page
   * and a final execute/install page. The final install/execute page
   * is always associated with a commandId.
   */
  return Class.extend({
    /**
     * options = {
     *   returnUrl: "...",
     *   executeUrl: "...",
     *   progressUrl: "..."
     * }
     */
    init: function (options) {
      var self = this;

      self.chosenStep = ko.observable(-1);
      self.fetchingData = ko.observable(false);
      self.errorMessage = ko.observable("");
      self.enableFinish = ko.observable(false);
      self.showRetry = ko.observable(false);
      self.allowRetry = ko.observable(false);

      self.leave = function () {
        location.href = options.returnUrl;
      };

      self.goToStart = function () {
        location.hash = "";
      };

      self.goToInstall = function () {
        location.hash = "install/" + self.commandId;
      };

      self.goToReview = function () {
        location.hash = "review";
      };

      self.retry = function () {
        // needs to be overwritten.
      };

      self.onAjaxResponse = function (response, containerSelector, callback) {
          self.fetchingData(false);

          var filteredResponse = Util.filterError(response);
          if (filteredResponse.indexOf("alertDialog") === -1) {
            $(containerSelector).html(filteredResponse);
            if ($.isFunction(callback)) {
              callback();
            }
          } else {
            $("body").append($(filteredResponse));
          }
      };

      self.processReviewParams = function (urlParams) {
        return urlParams;
      };

      self.scheduleNextInstallUpdate = function () {
        setTimeout(self.fetchNextInstallUpdate, 2000);
      };

      self.onProgressResponse = function (response) {
        var $commandDetailsContainer = $("#progressDetails");
        Util.html($commandDetailsContainer, response);

        var $commandCompleted =  $commandDetailsContainer.find(".commandCompleted");
        if ($commandCompleted.length === 0) {
          self.scheduleNextInstallUpdate();
        } else {
          self.fetchingData(false);
          var $success = $commandDetailsContainer.find(".commandProgress .isSuccess");
          if ($success.length === 0 && self.allowRetry()) {
            self.showRetry(true);
          } else {
            self.enableFinish(true);
          }
        }
      };

      self.fetchNextInstallUpdate = function () {
        if (location.hash.indexOf("#install") === 0) {
          self.fetchingData(true);
          var progressUrl = options.progressUrl.replace("{commandId}", self.commandId);
          $.post(progressUrl, self.onProgressResponse);
        }
      };

      /**
       * Handles a JSON response from the postExecute action.
       */
      self.onExecuteResponse = function (response) {
        self.fetchingData(false);

        var filteredJsonResponse = Util.filterJsonResponseError(response);
        if (filteredJsonResponse.message === "OK" && filteredJsonResponse.data) {
          self.commandId = filteredJsonResponse.data;
          self.goToInstall();
          self.fetchNextInstallUpdate();
        } else if (filteredJsonResponse.message) {
          $.publish("showError", [filteredJsonResponse.message]);
        }
      };

      /**
       * Post on the review page to execute.
       */
      self.postExecute = function () {
        $.publish("prepareInputsForSubmit");
        var urlParams = $("#reviewChanges").closest("form").serializeArray();
        urlParams = self.processReviewParams(urlParams);
        self.fetchingData(true);
        $.post(options.executeUrl, urlParams, self.onExecuteResponse);
      };
    }
  });
});
