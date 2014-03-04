// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/LicenseWizard',
  'cloudera/Util'
], function(LicenseWizard, Util) {
  describe("LicenseWizard Tests", function() {

    var module, dom = '<div class="LicenseWizard"><button></button></div>';
    var id = "licenseWizard";
    var options = {
      trialExpiredRequireRestart: false,
      nextUrlForStandard: "standardUrl",
      nextUrlForTrial: "trialUrl",
      nextUrlForEnterprise: "enterpriseUrl",
      fileUploaded: false
    };

    beforeEach(function() {
      $(dom).attr("id", id).appendTo(document.body);
    });

    afterEach(function() {
      $("#" + id).remove();
      module.unsubscribe();
    });

    it("should check what happens when Standard is selected", function() {
      module = new LicenseWizard(options);
      module.licenseType(module.STANDARD_LICENSE);
      expect(module.enableContinue()).toBeTruthy();
      expect(module.continueUrl()).toEqual(options.nextUrlForStandard);
    });

    it("should check what happens when trial is selected", function() {
      module = new LicenseWizard(options);
      module.licenseType(module.TRIAL_LICENSE);

      expect(module.enableContinue()).toBeTruthy();
      expect(module.continueUrl()).toEqual(options.nextUrlForTrial);
    });

    it("should check what happens when Enterprise is selected", function() {
      module = new LicenseWizard(options);
      module.licenseType(module.ENTERPRISE_LICENSE);

      expect(module.enableContinue()).toBeFalsy();
      expect(module.continueUrl()).toEqual(options.nextUrlForEnterprise);
      spyOn(Util, "setWindowLocation");
      $.publish("fileUploaded", [true]);
      expect(module.enableContinue()).toBeTruthy();
    });

    it("should automatically proceed to restart page when a license file is selected", function() {
      module = new LicenseWizard(options);
      module.licenseType(module.STANDARD_LICENSE);
      spyOn(Util, "setWindowLocation");
      expect(module.fileUploaded()).toBeFalsy();

      $.publish("fileUploaded", [true]);
      expect(module.fileUploaded()).toBeTruthy();
      expect(Util.setWindowLocation).toHaveBeenCalledWith("enterpriseUrl");
    });
    
    it("should not proceed to restart page when a bad license file is selected", function() {
      module = new LicenseWizard(options);
      module.licenseType(module.STANDARD_LICENSE);
      expect(module.fileUploaded()).toBeFalsy();
      spyOn(Util, "setWindowLocation");

      module.licenseType(module.ENTERPRISE_LICENSE);
      $.publish("fileUploaded", [false]);
      expect(module.fileUploaded()).toBeFalsy();
      expect(module.enableContinue()).toBeFalsy();
      expect(Util.setWindowLocation).not.toHaveBeenCalled();
    });

    it("should ensure that we don't let user set trial license again when the trial license has expired", function() {
      var newOptions = $.extend({}, options, {
        trialHasTried: true
      });
      module = new LicenseWizard(newOptions);
      module.useTrial();

      expect(module.licenseType()).toEqual(module.ENTERPRISE_LICENSE);

      expect(module.enableContinue()).toBeFalsy();
      expect(module.continueUrl()).toEqual(options.nextUrlForEnterprise);
      spyOn(Util, "setWindowLocation");

      $.publish("fileUploaded", [true]);
      expect(module.enableContinue()).toBeTruthy();
    });

    function testLicense(module, license) {
      var evt = {
        target: $("#" + id).find("button")
      };
      module.onContinueClick(module, evt);
      expect(module.analytics.trackEvent).wasCalledWith("trialEvent", license);
    }

    it("should call trackEvent and since trial has expired, force trial not to be selected", function() {
      var newOptions = $.extend({}, options, {
        trialHasTried: true
      });
      module = new LicenseWizard(newOptions);

      spyOn(module.analytics, "trackEvent");
      module.useTrial();
      testLicense(module, module.ENTERPRISE_LICENSE);

      module.useEnterprise();
      testLicense(module, module.ENTERPRISE_LICENSE);

      module.useStandard();
      testLicense(module, module.STANDARD_LICENSE);
    });

    it("should call trackEvent", function() {
      var newOptions = $.extend({}, options, {
        trialHasTried: false
      });
      module = new LicenseWizard(newOptions);

      spyOn(module.analytics, "trackEvent");
      module.useTrial();
      testLicense(module, module.TRIAL_LICENSE);

      module.useEnterprise();
      testLicense(module, module.ENTERPRISE_LICENSE);

      module.useStandard();
      testLicense(module, module.STANDARD_LICENSE);
    });

    it("should not call trackEvent when the button is disabled", function() {
      var newOptions = $.extend({}, options, {
        trialHasTried: false
      });
      module = new LicenseWizard(newOptions);
      spyOn(module.analytics, "trackEvent");

      $("#" + id).find("button").addClass("disabled");
      module.useEnterprise();
      var evt = {
        target: $("#" + id).find("button")
      };
      module.onContinueClick(module, evt);
      expect(module.analytics.trackEvent).wasNotCalled();
    });

    it("should test showLicenseForm", function() {
      module = new LicenseWizard(options);
      module.showLicenseForm();

      expect(module.licenseType()).toEqual(module.ENTERPRISE_LICENSE);
      expect(module.licenseFormShown()).toBeTruthy();
    });
  });
});
