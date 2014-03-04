// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/I18n",
  "cloudera/cmf/include/InstallDetailsDialog",
  "cloudera/cmf/wizard/WizardStepBase",
  "knockout",
  "underscore"
], function (Util, I18n, InstallDetailsDialog, WizardStepBase, ko, _) {
  "use strict";

  return WizardStepBase.extend({
    /**
     * options: {
     *   id:                     (required) "the id of the step",
     *   hostInstallUrl:         (optional) "the URL to get the host installation progress"
     * }
     */
    init: function(options) {
      var self = this;
      self.failedCount = 0;
      self.successCount = 0;
      self.failedWaitingCount = 0;
      self.enableContinue = ko.observable(false);
      self.options = options;
      self.loaded = ko.observable(false);

      var handle1 = $.subscribe("hostInstallRunning", function() {
        self.enableContinue(false);
      });
      /**
       * This event is fired whenever failedCount + successCount + failedWaitingCount == totalCount
       */
      var handle2 = $.subscribe("hostInstallCompleted", function(failedCount, successCount, failedWaitingCount) {
        self.failedCount = failedCount;
        self.successCount = successCount;
        self.failedWaitingCount = failedWaitingCount;
        self.enableContinue(true);

        if (failedWaitingCount === 0) {
          // Nothing is running, so execute the self._onLeaveHook() method.
          if (self._onLeaveHook) {
            self._onLeaveHook();
            self._onLeaveHook = undefined;
          }
        }
      });
      self.subscriptionHandles = [handle1, handle2];
      self.$container = $("#" + options.id);

      if (!Util.getTestMode()) {
        self.addUnloadHook();
      }
      self._super.apply(self, arguments);
    },

    getHostInstallUrl: function() {
      return this.getHostInstallUrlFromIFrame() || this.options.hostInstallUrl;
    },

    getHostInstallUrlFromIFrame: function() {
      var $iframeContents = this.getIFrameContent();
      var $url = $iframeContents.find('input[name=url]');
      if ($url.length > 0) {
        return $url.val();
      } else {
        return undefined;
      }
    },

    /**
     * unsubscribe from all events.
     */
    unsubscribe : function() {
      Util.unsubscribe(this);
    },

    /**
     * Expects a hidden iframe on the page.
     */
    beforeEnter: function(callback) {
      var self = this;
      self.loaded(false);
      callback();
      self.enableContinue(false);

      $.publish("unsubscribeAddHostsWizardInstall");
      // options.hostInstallUrl represents the URL from the resumed state.
      // Since I want to check the resume case explicitly, I don't need to
      // check the content of the IFrame, because it won't be there.
      var url = self.options.hostInstallUrl;
      if (url) {
        self.resumeInstall(url);
      } else {
        self.checkPostOutput();
      }
    },

    /**
     * Called when we are leaving this page and going forward.
     */
    beforeLeave: function(callback) {
      var self = this;
      if (self.successCount === 0) {
        // Do not allow user to proceed.
        $("#installIncompleteDialog").modal("show");
      } else {
        callback();
      }
    },

    /**
     * @return true if we should ask for confirmation.
     * @param isForward
     *
     * when isForward is true, we are clicking Continue in the wizard,
     * so if failedWaitingCount > 0, then we should trigger roll back.
     *
     * when isForward is false, we are clicking Back in the wizard,
     * if the Continue button is not enabled, then we should trigger abort.
     * else if failedWaitingCount > 0 then we should trigger rollback.
     */
    confirmOnLeave: function(isForward) {
      var self = this;
      if (isForward) {
        // enableContinue() should be true here.
        return self.failedWaitingCount > 0;
      } else {
        return self.failedWaitingCount > 0 || !self.enableContinue();
      }
    },

    /**
     * @return the confirmation message.
     */
    getConfirmOnLeaveMessage: function(isForward) {
      var self = this;
      if (isForward) {
        return I18n.t("ui.installRollBackConfirmation");
      } else {
        if (!self.enableContinue()) {
          return I18n.t("ui.installAbortConfirmation");
        } else {
          return I18n.t("ui.installRollBackConfirmation");
        }
      }
    },

    getConfirmUnloadMessage: function() {
      return I18n.t("ui.installUnloadConfirmation");
    },

    /**
     * When user confirms to leave,
     * we need to initiate the abort progress.
     * Note: this button is referenced in AddHostsWizardInstall.js
     */
    confirmOnLeaveHook: function(callback, isForward) {
      var self = this;
      if (isForward) {
        // Going forward
        self.tryRollback(callback);
      } else {
        // Going back
        self.tryAbortOrRollback(callback);
      }
    },

    tryRollback: function(callback) {
      var self = this;
      if (self.failedWaitingCount > 0) {
        // Store a reference to this callback.
        self._onLeaveHook = callback;
        $("#rollbackAllButton").trigger("click");
      } else {
        callback();
      }
    },

    tryAbortOrRollback: function(callback) {
      var self = this;
      if (!self.enableContinue()) {
        // Store a reference to this callback.
        self._onLeaveHook = callback;
        $('#abortButton').trigger("click");
      } else {
        self.tryRollback(callback);
      }
    },

    /**
     * Add a second confirmation when user tries to leave the page.
     */
    addUnloadHook: function() {
      var self = this;
      $(window).bind('beforeunload', function(){
        if (self.isStepSelected()) {
          // Warn user about this but still letting them
          // choose if they want to leave.
          // Note: we shouldn't trigger the abort or the rollback operation.
          return self.getConfirmUnloadMessage();
        }
      });
    },

    unloadIFrameFromHistory: function() {
      history.go(-1);
    },

    getIFrameContent: function() {
      var $iframeContents = $("#hiddenIframe").contents();
      return $iframeContents;
    },

    checkPostOutput: function() {
      var self = this;
      var $iframeContents = self.getIFrameContent();
      var $url = $iframeContents.find('input[name=url]');
      var $message = $iframeContents.find('input[name=message]');
      Util.html(self.$container.find(".content"), "");

      if ($message.length > 0 && $message.val()) {
        Util.html(self.$container.find(".content"), $message.val());
        self.unloadIFrameFromHistory();
        self.loaded(true);
      } else if ($url.length > 0) {
        var url = $url.val();
        $.publish("hostInstallUrlChanged", [url]);
        $.get(url, function(response) {
          Util.html(self.$container.find(".content"), response);
          self.unloadIFrameFromHistory();
          self.loaded(true);
        });
      } else if (!Util.getTestMode()) {
        _.delay(_.bind(self.checkPostOutput, self), 500);
      }
    },

    resumeInstall: function(url) {
      var self = this;
      $.get(url, function(response) {
        Util.html(self.$container.find(".content"), response);
        self.loaded(true);
      });
    }
  });
});
