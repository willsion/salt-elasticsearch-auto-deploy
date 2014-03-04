// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'cloudera/cmf/wizard/hosts/InstallStep'
], function(Util, InstallStep) {
  describe("InstallStep Tests", function() {
    var id = "installStep", module, options = {
      id: id
    }, beforeEnterCalled = false, enterCallback = function() { beforeEnterCalled = true; };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();

      beforeEnterCalled = false;
      $("<div>").attr("id", id).appendTo(document.body);
      $("#" + id).append('<div class="content">');
    });

    afterEach(function() {
      module.unsubscribe();
      $("#" + id).remove();
    });

    it("should initialize an InstallStep", function() {
      module = new InstallStep(options);
      spyOn(module, "unloadIFrameFromHistory");

      expect(module.loaded()).toBeFalsy();
    });

    it("should call beforeEnter and see an error message", function() {
      module = new InstallStep(options);
      spyOn(module, "unloadIFrameFromHistory");
      spyOn(module, "loaded");

      var $content = $("<div><input name='url' value='SomeUrl'/><input name='message' value='SomeMessage'/></div>");
      spyOn(module, "getIFrameContent").andReturn($content);
      module.beforeEnter(enterCallback);
      expect(beforeEnterCalled).toBeTruthy();
      expect(module.unloadIFrameFromHistory).wasCalled();
      expect(module.loaded).wasCalled();
      expect($("#" + id).find(".content").html()).toEqual("SomeMessage");
    });

    it("should call beforeEnter and see a URL to load some data", function() {
      module = new InstallStep(options);
      spyOn(module, "unloadIFrameFromHistory");
      spyOn(module, "loaded");

      var $content = $("<div><input name='url' value='SomeUrl'/></div>");
      spyOn(module, "getIFrameContent").andReturn($content);
      module.beforeEnter(enterCallback);
      expect(beforeEnterCalled).toBeTruthy();

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "text/html",
        responseText: "Some HTML"
      });

      expect(module.unloadIFrameFromHistory).wasCalled();
      expect(module.loaded).wasCalled();
      expect($("#" + id).find(".content").html()).toEqual("Some HTML");
    });

    it("shoule call beforeLeave", function() {
      module = new InstallStep(options);
      spyOn(module, "unloadIFrameFromHistory");

      var called = false;
      var leaveCallback = function() {
        called = true;
      };
      module.successCount = 0;
      module.beforeLeave(leaveCallback);
      expect(called).toBeFalsy();

      module.successCount = 1;
      module.beforeLeave(leaveCallback);
      expect(called).toBeTruthy();
    });

    it("should confirm and go back", function() {
      module = new InstallStep(options);
      spyOn(module, "unloadIFrameFromHistory");

      var isAnotherStepSelected = false;
      var leaveCallback = function() {
        isAnotherStepSelected = true;
      };
      module.isStepSelected(true);
      spyOn(module, "confirm").andReturn(true);

      // This step is in the middle of something.
      module.enableContinue(false);
      module.onLeave(leaveCallback, false);

      // This page is still selected while aborting.
      expect(module.isStepSelected()).toBeTruthy();
      expect(isAnotherStepSelected).toBeFalsy();

      // Abort Installation status returned.
      $.publish("hostInstallCompleted", [1, 0, 0]);

      // We should not be on this step.
      expect(module.isStepSelected()).toBeFalsy();
      expect(isAnotherStepSelected).toBeTruthy();
    });

    it("should confirm when going back if there are failedWaitingCount", function() {
      module = new InstallStep(options);
      spyOn(module, "unloadIFrameFromHistory");

      var isAnotherStepSelected = false;
      var leaveCallback = function() {
        isAnotherStepSelected = true;
      };
      module.isStepSelected(true);
      spyOn(module, "confirm").andReturn(true);

      // Abort Installation status returned.
      $.publish("hostInstallCompleted", [1, 0, 1]);

      // This step is in the middle of something.
      module.onLeave(leaveCallback, false);

      // We should continue be on this step.
      expect(module.isStepSelected()).toBeTruthy();
      expect(isAnotherStepSelected).toBeFalsy();
    });

    it("should confirm when going forward if there are failedWaitingCount", function() {
      module = new InstallStep(options);
      spyOn(module, "unloadIFrameFromHistory");

      var isAnotherStepSelected = false;
      var leaveCallback = function() {
        isAnotherStepSelected = true;
      };
      module.isStepSelected(true);
      spyOn(module, "confirm").andReturn(true);

      $.publish("hostInstallCompleted", [1, 0, 1]);

      // This step is done
      module.onLeave(leaveCallback, true);

      // We should continue be on this step.
      expect(module.isStepSelected()).toBeTruthy();
      expect(isAnotherStepSelected).toBeFalsy();
    });

    it("should not confirm when going forward if there are 0 failureCount, 1 successCount, 0 failedWaitingCount", function() {
      module = new InstallStep(options);
      spyOn(module, "unloadIFrameFromHistory");

      var isAnotherStepSelected = false;
      var leaveCallback = function() {
        isAnotherStepSelected = true;
      };
      module.isStepSelected(true);
      spyOn(module, "confirm").andReturn(true);

      // This should not trigger the leaveCallback
      $.publish("hostInstallCompleted", [0, 1, 1]);

      module.onLeave(leaveCallback, true);

      // This should trigger the leaveCallback
      $.publish("hostInstallCompleted", [0, 1, 0]);

      // We should continue be on this step.
      expect(module.isStepSelected()).toBeFalsy();
      expect(isAnotherStepSelected).toBeTruthy();
    });

    it("should show a confirmation", function() {
      module = new InstallStep(options);
      spyOn(module, "unloadIFrameFromHistory");

      var isAnotherStepSelected = false;
      var leaveCallback = function() {
        isAnotherStepSelected = true;
      };
      module.isStepSelected(true);
      spyOn(module, "confirm").andReturn(false);

      // This step is in the middle of something
      module.enableContinue(false);
      module.onLeave(leaveCallback, false);

      // We should remain on this step.
      expect(module.isStepSelected()).toBeTruthy();
      expect(isAnotherStepSelected).toBeFalsy();
    });

    it("should publish a hostInstallUrlChanged event", function() {
      module = new InstallStep(options);
      spyOn(module, "unloadIFrameFromHistory");

      spyOn($, "publish");
      var $content = $("<div><input name='url' value='SomeUrl'/></div>");
      spyOn(module, "getIFrameContent").andReturn($content);

      module.checkPostOutput();
      expect($.publish).wasCalledWith("hostInstallUrlChanged", ["SomeUrl"]);
    });

    it("should check resumeInstall is called", function() {
      module = new InstallStep($.extend({}, options, {
        hostInstallUrl: "someInstallUrl"
      }));
      spyOn(module, "unloadIFrameFromHistory");
      spyOn(module, "loaded");

      module.beforeEnter(enterCallback);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "text/html",
        responseText: "Some HTML"
      });

      expect(module.unloadIFrameFromHistory).wasNotCalled();
      expect($("#" + id).find(".content").html()).toEqual("Some HTML");
      expect(module.loaded).wasCalled();
    });
  });
});
