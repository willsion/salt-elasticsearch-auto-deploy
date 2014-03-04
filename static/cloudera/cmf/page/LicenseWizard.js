// Copyright (c) 2013 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/Analytics",
  "knockout",
  "underscore"
], function(Util, analytics, ko, _) {
  /**
   * options = {
   *   container: "DOM selector of the container element",
   *   trialExpiredRequireRestart: true|false,
   *   trialHasTried: true|false,
   *   nextUrlForStandard: "string",
   *   nextUrlForTrial: "string",
   *   nextUrlForEnterprise: "string",
   *   fileUploaded: true|false
   * }
   */
  return function(options) {
    var self = this;

    self.analytics = analytics;

    // valid options for self.licenseType.
    self.STANDARD_LICENSE = "useStandard";
    self.ENTERPRISE_LICENSE = "useEnterprise";
    self.TRIAL_LICENSE = "useTrial";

    self.licenseType = ko.observable();
    self.trialExpiredRequireRestart = ko.observable(options.trialExpiredRequireRestart);
    self.trialHasTried = ko.observable(options.trialHasTried);
    self.fileUploaded = ko.observable(options.fileUploaded);

    self.usingStandard = ko.computed(function() {
      return self.licenseType() === self.STANDARD_LICENSE;
    });

    self.usingTrial = ko.computed(function() {
      return self.licenseType() === self.TRIAL_LICENSE;
    });

    self.usingEnterprise = ko.computed(function() {
      return self.licenseType() === self.ENTERPRISE_LICENSE;
    });

    self.useStandard = function() {
      self.licenseType(self.STANDARD_LICENSE);
      $(".license-standard").addClass("active");
      $(".license-trial").removeClass("active");
      $(".license-enterprise").removeClass("active");
    };

    self.useTrial = function() {
      if (!self.trialHasTried()) {
        self.licenseType(self.TRIAL_LICENSE);
        $(".license-standard").removeClass("active");
        $(".license-trial").addClass("active");
        $(".license-enterprise").removeClass("active");
      } else {
        self.licenseType(self.ENTERPRISE_LICENSE);
        $(".license-standard").removeClass("active");
        $(".license-trial").removeClass("active");
        $(".license-enterprise").addClass("active");
      }
    };

    self.useEnterprise = function() {
      self.licenseType(self.ENTERPRISE_LICENSE);
      $(".license-standard").removeClass("active");
      $(".license-trial").removeClass("active");
      $(".license-enterprise").addClass("active");
      return false;
    };

    self.highlightStandard = function() {
      $(".license-standard").addClass("hover");
    };

    self.unhighlightStandard = function() {
      $(".license-standard").removeClass("hover");
    };

    self.highlightTrial = function() {
      $(".license-trial").addClass("hover");
    };

    self.unhighlightTrial = function() {
      $(".license-trial").removeClass("hover");
    };

    self.highlightEnterprise = function() {
      $(".license-enterprise").addClass("hover");
    };

    self.unhighlightEnterprise = function() {
      $(".license-enterprise").removeClass("hover");
    };

    self.licenseFormShown = ko.observable(false);

    self.showLicenseForm = function() {
      // trigger the file selection automatically.
      $(".upload-form").find("input[type=file]").trigger("click");
      // show the license form, and hide the original button.
      self.useEnterprise();
      self.licenseFormShown(true);
    };

    // default to trial, and if that is not available
    // marke Enterprise as selected..
    self.useTrial();

    /**
     * Determines if the Continue button should be enabled.
     */
    self.enableContinue = ko.computed(function() {
      if (self.licenseType() === self.ENTERPRISE_LICENSE) {
        return self.fileUploaded();
      } else if (self.licenseType() === self.TRIAL_LICENSE) {
        return true;
      } else if (self.licenseType() === self.STANDARD_LICENSE) {
        return true;
      }
    });

    /**
     * Determines what the Continue button's URL should be.
     */
    self.continueUrl = ko.computed(function() {
      if (self.licenseType() === self.ENTERPRISE_LICENSE) {
        return options.nextUrlForEnterprise;
      } else if (self.licenseType() === self.TRIAL_LICENSE) {
        return options.nextUrlForTrial;
      } else {
        return options.nextUrlForStandard;
      }
    });

    self.onContinueClick = function(ctx, evt) {
      var $target = $(evt.target);
      if (!$target.hasClass("disabled")) {
        self.analytics.trackEvent("trialEvent", self.licenseType());
        return true;
      }
    };

    var handle1 = $.subscribe("fileUploaded", function(value) {
      self.fileUploaded(value);
      if (value) {
        Util.setWindowLocation(options.nextUrlForEnterprise);
      }
    });

    self.subscriptionHandles = [handle1];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    self.applyBindings = function() {
      ko.applyBindings(self, $(options.container)[0]);
    };

    $(".showTooltip").tooltip();
  };
});
