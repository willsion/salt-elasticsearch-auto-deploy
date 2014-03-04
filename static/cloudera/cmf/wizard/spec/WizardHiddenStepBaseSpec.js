// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/WizardHiddenStepBase'
], function(WizardHiddenStepBase) {
  describe("WizardHiddenStepBase Tests", function() {
    var id = "step1", step;

    beforeEach(function() {
      step = new WizardHiddenStepBase({
        id: id
      });
      $("<div>").attr("id", id).appendTo(document.body);
    });

    afterEach(function() {
      $("#step1").remove();
    });

    it("should skip this hidden step when going forward", function() {
      var called = false;
      var callback = function() {
        called = true;
      };

      spyOn(step, "execute").andCallThrough();
      spyOn(step, "next");

      step.onEnter(callback, true);

      expect(step.execute).wasCalled();
      expect(step.next).wasCalled();
      expect(called).toBeTruthy();
    });

    it("should skip this hidden step when going back", function() {
      var called = false;
      var callback = function() {
        called = true;
      };

      spyOn(step, "execute").andCallThrough();
      spyOn(step, "previous");

      step.onEnter(callback, false);

      expect(step.execute).wasCalled();
      expect(step.previous).wasCalled();
      expect(called).toBeTruthy();
    });
  });
});
