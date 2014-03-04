// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/common/CommandStep'
], function(CommandStep) {
  describe("CommandStep Tests", function() {
    var $container, viewModel, options;
    options = {
      id: "commandStep",
      progressUrl: "/foo/{commandId}/progress",
      returnUrl: "/foo/return",
      commandId: function() {
        return 12;
      }
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $container = $("<div>")
        .attr("id", "progressDetails")
        .appendTo($("body"));
      viewModel = new CommandStep(options);
    });

    afterEach(function() {
      $container.remove();
      viewModel = null;
    });

    it("should get content from correct url", function() {
      var callback = jasmine.createSpy();
      viewModel.beforeEnter(callback);
      var request = mostRecentAjaxRequest();

      request.response({
        status: 200,
        contentType: "text/html",
        // These divs (unfortunatly) are how we determine command
        // progress.
        responseText: 'kittens on tiny boats <div class="commandCompleted"></div><div class="commandProgress"><div class="isSuccess"></div></div>'
      });

      expect(request.url).toEqual("/foo/12/progress");
      expect(callback).toHaveBeenCalled();
      expect($container.html()).toContain("kittens on tiny boats");
    });

    it("should indicate command success", function() {
      viewModel.beforeEnter(function() { /* do nothing */ });
      var request = mostRecentAjaxRequest();

      request.response({
        status: 200,
        contentType: "text/html",
        responseText: '<div class="commandCompleted"></div><div class="commandProgress"><div class="isSuccess"></div></div>'
      });

      expect(viewModel.isCommandSuccess).toBeTruthy();
      expect(viewModel.showRetry()).toBeFalsy();
    });

    it("should indicate command failure", function() {
      viewModel.beforeEnter(function() { /* do nothing */ });
      var request = mostRecentAjaxRequest();

      request.response({
        status: 200,
        contentType: "text/html",
        responseText: '<div class="commandCompleted"></div><div class="commandProgress"></div>'
      });

      expect(viewModel.isCommandSuccess).toBeFalsy();
      expect(viewModel.showRetry()).toBeTruthy();
    });

    it("should enable continue", function() {
      viewModel.isCommandSuccess = true;
      expect(viewModel.enableContinue()).toBeTruthy();
    });

    it("should disable continue", function() {
      viewModel.isCommandSuccess = false;
      expect(viewModel.enableContinue()).toBeFalsy();
    });

    it("should retry failed command", function() {
      spyOn(viewModel, "_updateProgress");
      viewModel.retry();
      var request = mostRecentAjaxRequest();
      var response = {
        message: "OK",
        data: 13
      };
      
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      expect(viewModel.commandId).toEqual(13);
      expect(viewModel.actualProgressUrl).toEqual("/foo/13/progress");
      expect(viewModel._updateProgress).toHaveBeenCalled();
    });

    it("should not retry failed command and show errors", function() {
      spyOn(viewModel, "_updateProgress");
      spyOn($, "publish");
      viewModel.retry();
      var request = mostRecentAjaxRequest();
      var response = {
        message: "something bad"
      };
      
      request.response({
        status: 200,
        responseText: JSON.stringify(response)
      });

      expect(viewModel._updateProgress).not.toHaveBeenCalled();

      var isShowErrorPublished = false;
      $.each($.publish.argsForCall, function(i, args) {
        if (args[0] === "showError") {
          isShowErrorPublished = true;
        }
      });
      expect(isShowErrorPublished).toBeTruthy();
    });
  });
});
