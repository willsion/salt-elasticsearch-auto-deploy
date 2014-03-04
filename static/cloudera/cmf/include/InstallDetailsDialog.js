// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/I18n",
  "cloudera/common/AutoUpdatedContent"
], function (Util, I18n, AutoUpdatedContent) {

  /**
   * Encapsulates the install details dialog.
   * options = {
   *    detailsDialogSelector: "#someId"
   * };
   */
  return function(options) {
    var self = this, $dialog = $(options.detailsDialogSelector),
      $modalBody = $dialog.find(".modal-body"),
      $modalHeader = $dialog.find(".modal-header"),
      $modalFooter = $dialog.find(".modal-footer");

    var ignoreAnchorEvent = function(evt) {
      if (evt) {
        evt.preventDefault();
      }
    };

    // Handles the clicking event on the current state/failed state.
    var highlight = function($elem) {
      $elem.effect("highlight", {}, 2000);
    };

    var scrollTo = function($elem) {
      if ($elem && $elem.length > 0) {
        $modalBody.scrollTop(0);
        $modalBody.scrollTop($elem.offset().top - $modalBody.offset().top);
        highlight($elem.next("div"));
      }
    };

    var onCurrentStateClicked = function(evt) {
      ignoreAnchorEvent(evt);
      scrollTo($modalBody.find("h3:last"));
    };

    var onFailedStateClicked = function(evt) {
      ignoreAnchorEvent(evt);
      var $lastSectionWithError = null, $lastSection = null;

      // Determine the last section before rollback.
      $modalBody.find("h3").each(function(i, elem) {
        var $elem = $(elem);
        if ($elem.is(".node-progress-ROLLBACK")) {
          $lastSectionWithError = $lastSection;
        } else if ($elem.is(".node-progress-WAITING_FOR_ROLLBACK")) {
          $lastSectionWithError = $lastSection;
        }
        $lastSection = $elem;
      });
      $lastSection = null;

      // Scroll to the last section with an error.
      scrollTo($lastSectionWithError);
    };

    $modalHeader.find(".currentState").click(onCurrentStateClicked);
    $modalHeader.find(".failedState").click(onFailedStateClicked);

    // Auto refreshes the dialog content.
    var detailsContentSelector = options.detailsDialogSelector + " .detailsContent";
    var firstUpdateOnShow = true;
    var autoUpdaterOptions = {
      url: "",
      urlParams: {},
      updateIntervalInMS: 5000,
      checkVisibilityIntervalInMS: 500,
      containerSelector: detailsContentSelector,
      afterUpdate: function() {
        var $lastSectionWithError, $lastSection;
        // Mark all the sections starting from the rollback section,
        // plus the one just before the the rollback section as errors.
        $modalBody.find("h3").each(function(i, elem) {
          var $elem = $(elem);
          if ($elem.is(".node-progress-ROLLBACK") ||
              $elem.is(".node-progress-WAITING_FOR_ROLLBACK")) {
            $lastSectionWithError = $lastSection;
            if ($lastSectionWithError) {
              $lastSectionWithError.addClass("error");
            }
          }
          $lastSection = $elem;
        });

        // Move important attributes from the dialog body to the dialog header.
        // The content of the dialog header is always visible.
        $modalHeader.find(".currentState").html($modalBody.find(".currentState").html());
        $modalHeader.find(".failedState").html($modalBody.find(".failedState").html());

        // Remove these attributes from the dialog body.
        $modalBody.find(".currentState").remove();
        $modalBody.find(".failedState").remove();

        $lastSectionWithError = null;
        $lastSection = null;

        if (firstUpdateOnShow) {
          if ($modalHeader.find(".failedState span").length > 0) {
            $modalHeader.find(".failedState").trigger("click");
          } else if ($modalHeader.find(".currentState span").length > 0) {
            $modalHeader.find(".currentState").trigger("click");
          }
          firstUpdateOnShow = false;
        }
      }
    };
    self.detailsAutoUpdater = new AutoUpdatedContent(autoUpdaterOptions);

    // Clear the active class for the pause/play button.
    var clearActiveState = function() {
      $modalFooter.find('.pauseUpdateDetails,.playUpdateDetails').removeClass("active");
    };

    // Turn off auto refresh.
    var onPauseUpdateDetailsClicked = function(evt) {
      ignoreAnchorEvent(evt);
      var $target = $(evt.currentTarget);

      clearActiveState();
      $target.addClass("active");
      self.detailsAutoUpdater.stop();
      $modalFooter.find(".pauseUpdateDetailsReason").removeClass("hidden");
    };

    // Turn on auto refresh.
    var onPlayUpdateDetailsClicked = function(evt) {
      ignoreAnchorEvent(evt);
      var $target = $(evt.currentTarget);

      clearActiveState();
      $target.addClass("active");
      self.detailsAutoUpdater.start();
      $modalFooter.find(".pauseUpdateDetailsReason").addClass("hidden");
    };

    $modalFooter.find('.pauseUpdateDetails').click(onPauseUpdateDetailsClicked);
    $modalFooter.find('.playUpdateDetails').click(onPlayUpdateDetailsClicked);


    // Clicking on a Details link requires updating the URL
    // and invoke content update immediately.
    var show = function(url) {
      // restore the Install Details dialog "Loading..." placeholder text
      $(detailsContentSelector).html(I18n.t("ui.loading"));

      // Restore the header text to the initial state.
      $modalHeader.find(".failedState").html("");
      $modalHeader.find(".currentState").html("");

      firstUpdateOnShow = true;

      self.detailsAutoUpdater.url = url;
      // This triggers auto update.
      $modalFooter.find('.playUpdateDetails').trigger("click");
      $dialog.modal('show');
    };

    var handle1 = $.subscribe("showInstallDetails", function(url) {
      show(url);
    });

    this.subscriptionHandles = [handle1];

    this.unsubscribe = function() {
      Util.unsubscribe(this);
    };
  };
});
