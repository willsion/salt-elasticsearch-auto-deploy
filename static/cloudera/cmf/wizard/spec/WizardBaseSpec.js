// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'cloudera/common/UrlParams',
  'cloudera/cmf/wizard/WizardBase',
  'cloudera/cmf/wizard/WizardStepBase'
], function(Util, UrlParams, WizardBase, WizardStepBase) {
  describe("WizardBase Tests", function() {
    var wizard, id="wizardContainer", oldHash,
      ui = '<div id="step1"></div><div id="step2"></div><div id="#bottomButtons"></div>',
      stepList1 = [ new WizardStepBase({
          id: "step1"
        }), new WizardStepBase({
          id: "step2"
        }) ];

    beforeEach(function() {
      UrlParams.params = {};
      oldHash = window.location.hash;
      $("<div>").attr("id", id).html(ui).appendTo(document.body);
    });

    afterEach(function() {
      wizard.unsubscribe();
      $("#" + id).remove();
      window.location.hash = oldHash;
    });

    it("should initialize and go to step 0.", function() {
      wizard = new WizardBase({
        steps : stepList1
      });
      expect(wizard.chosenStep()).toEqual(0);
      expect(wizard.steps[0].isStepSelected()).toBeTruthy();
    });

    it("should initialize and go to step 1 via next.", function() {
      wizard = new WizardBase({
        steps: stepList1
      });

      spyOn(UrlParams, 'set');

      spyOn(wizard.steps[0], "beforeLeave").andCallThrough();
      spyOn(wizard.steps[1], "beforeEnter").andCallThrough();

      wizard.next();
      expect(UrlParams.set).wasCalledWith("step", "step2");
      wizard.chosenStep(1);

      waitsFor(function() {
        return wizard.steps[1].isStepSelected();
      }, "The step[1] should be selected eventually", 500);

      runs(function() {
        expect(wizard.steps[0].isStepSelected()).toBeFalsy();
        expect(wizard.steps[1].isStepSelected()).toBeTruthy();
        expect(wizard.steps[0].beforeLeave).wasCalled();
        expect(wizard.steps[1].beforeEnter).wasCalled();
        expect(wizard.chosenStep()).toEqual(1);
      });
    });

    it("should initialize and go to step 1 then back to step 0.", function() {
      wizard = new WizardBase({
        steps: stepList1
      });

      spyOn(UrlParams, 'set');
      spyOn(wizard.steps[0], "beforeEnter").andCallThrough();
      spyOn(wizard.steps[1], "beforeLeave").andCallThrough();

      wizard.next();

      expect(UrlParams.set).wasCalledWith("step", "step2");
      // UrlParams.set is mocked out,
      // so we have to manually call chosenStep.
      wizard.chosenStep(1);

      // We cannot call history.back directly,
      // so we call chosenStep instead.
      wizard.chosenStep(0);

      waitsFor(function() {
        return wizard.steps[0].isStepSelected();
      }, "The step[0] should be selected eventually", 500);

      runs(function() {
        expect(wizard.steps[0].isStepSelected()).toBeTruthy();
        expect(wizard.steps[1].isStepSelected()).toBeFalsy();
        // Going from step 1 to step 0 should not call
        // beforeLeave or beforeEnter.
        expect(wizard.steps[1].beforeLeave).wasNotCalled();
        expect(wizard.steps[0].beforeEnter).wasNotCalled();
        expect(wizard.chosenStep()).toEqual(0);
      });
    });

    it("should call next", function() {
      wizard = new WizardBase({
        steps: stepList1
      });

      spyOn(wizard, "next");
      $.publish("nextWizardStep");
      expect(wizard.next).wasCalled();
    });

    it("should call back", function() {
      wizard = new WizardBase({
        steps: stepList1
      });

      spyOn(wizard, "back");
      $.publish("previousWizardStep");
      expect(wizard.back).wasCalled();
    });

    it("should call leave", function() {
      wizard = new WizardBase({
        exitUrl: "someExitUrl",
        steps: stepList1
      });

      spyOn(Util, "setWindowLocation");
      wizard.leave();
      expect(Util.setWindowLocation).wasCalledWith("someExitUrl");
    });

    it("should call onEnterStep", function() {
      wizard = new WizardBase({
        steps: stepList1
      });

      spyOn(wizard, "onEnterStep");
      wizard.chosenStep(1);
      expect(wizard.onEnterStep).wasCalled();
    });
  });
});
