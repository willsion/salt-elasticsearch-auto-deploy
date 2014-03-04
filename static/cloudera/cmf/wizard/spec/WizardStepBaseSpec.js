// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'cloudera/cmf/wizard/WizardStepBase',
  'cloudera/common/UrlParams'
], function(Util, WizardStepBase, UrlParams) {
  describe("WizardStepBase Tests", function() {
    var wizard, oldHash, ui = '<div id="step1"></div>', step;

    beforeEach(function() {
      UrlParams.params = {};
      oldHash = window.location.hash;
      $(ui).appendTo(document.body);
    });

    afterEach(function() {
      Util.unsubscribe(wizard);
      $("#step1").remove();
      window.location.hash = oldHash;
    });

    it("should select this step", function() {
      step = new WizardStepBase({
        id : "step1"
      });

      var callback = function() {};

      spyOn(step, "beforeEnter").andCallThrough();
      step.onEnter(callback, true);

      // The step is selected, so beforeEnter should be called.
      expect(step.beforeEnter).wasCalled();
      expect(step.isStepSelected()).toBeTruthy();
    });

    it("should unselect this step", function() {
      step = new WizardStepBase({
        id : "step1"
      });

      var callback = function() {};
      spyOn(step, "beforeLeave").andCallThrough();

      step.onEnter(callback);
      step.onLeave(callback, true);

      // The step is selected, so beforeEnter should be called.
      expect(step.beforeLeave).wasCalled();
      expect(step.isStepSelected()).toBeFalsy();
    });

    it("should check confirmation, and once confirmed, it should go to another page", function() {
      step = new WizardStepBase({
        id : "step1"
      });

      step.getConfirmOnLeaveMessage = function() {
        return "Some Message";
      };

      step.confirmOnLeave = function() {
        return true;
      };
      spyOn(step, "confirm").andReturn(true);
      spyOn(step, "confirmOnLeaveHook").andCallThrough();

      var showAnotherPage = false;
      var callback = function() {
        showAnotherPage = true;
      };
      step.isStepSelected(true);
      // Try leaving the page.
      step.onLeave(callback, false);
      // The Hook must be called.
      expect(step.confirmOnLeaveHook).wasCalled();
      // We are no longer the selected step.
      expect(step.isStepSelected()).toBeFalsy();
      // The final callback must be called.
      expect(showAnotherPage).toBeTruthy();
    });

    it("should check confirmation and stay on the page", function() {
      step = new WizardStepBase({
        id : "step1"
      });

      step.getConfirmOnLeaveMessage = function() {
        return "Some Message";
      };

      step.confirmOnLeave = function() {
        return true;
      };
      spyOn(step, "confirm").andReturn(false);
      spyOn(step, "confirmOnLeaveHook").andCallThrough();

      var showAnotherPage = false;
      var callback = function() {
        showAnotherPage = true;
      };

      step.isStepSelected(true);
      // Try leaving the page.
      step.onLeave(callback, true);
      // The hook must be called.
      expect(step.confirmOnLeaveHook).wasNotCalled();
      // We are still at the selected step.
      expect(step.isStepSelected()).toBeTruthy();
      // THe final callback was not called.
      expect(showAnotherPage).toBeFalsy();
    });
  });
});
