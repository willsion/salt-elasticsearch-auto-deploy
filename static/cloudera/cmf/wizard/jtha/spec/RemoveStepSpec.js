// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/jtha/RemoveStep'
], function(RemoveStep) {

  describe("RemoveStep Tests", function() {
    var $container, viewModel, options;
    options = {
      id: "removeStep",
      commandUrl: "/foo/command"
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $container = $("<div>")
        .attr("id", "removeStep")
        .appendTo($("body"));
      viewModel = new RemoveStep(options);
    });

    afterEach(function() {
      $container.remove();
      viewModel = null;
    });

    it("should start command", function() {
      var callback = jasmine.createSpy();
      viewModel.beforeLeave(callback);
      var request = mostRecentAjaxRequest();
      var response = {
        message: "OK",
        data: 12
      };

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      expect(callback).toHaveBeenCalled();
      expect(viewModel.commandId()).toEqual(12);
    });

    it("should not start command and show errors", function() {
      spyOn($, "publish");
      var callback = jasmine.createSpy();
      viewModel.beforeLeave(callback);
      var request = mostRecentAjaxRequest();
      var response = {
        message: "something terrible has happened"
      };

      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      expect(callback).not.toHaveBeenCalled();

      var isShowErrorPublished = false;
      $.each($.publish.argsForCall, function(i, args) {
        if (args[0] === "showError") {
          isShowErrorPublished = true;
        }
      });
      expect(isShowErrorPublished).toBeTruthy();

    });

    it("should not enable continue", function() {
      viewModel.chosenAJTRole("");
      expect(viewModel.enableContinue()).toBeFalsy();
    });

    it("should enable continue", function() {
      viewModel.chosenAJTRole("12");
      expect(viewModel.enableContinue()).toBeTruthy();
    });
  });
});
