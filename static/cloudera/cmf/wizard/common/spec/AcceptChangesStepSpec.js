// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/common/AcceptChangesStep'
], function(AcceptChangesStep) {

  describe("AcceptChangesStep Tests", function() {
    var $container, viewModel, options;
    options = {
      id: "acceptChangesStep",
      configsUrl: "/foo/configs",
      commandUrl: "/bar/command",
      chosenSBJT: function() {
        return "foo1.bar.com";
      },
      chosenZK: function() {
        return 100;
      }
    };


    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $container = $("<div>")
        .attr("id", "reviewChanges")
        .appendTo($("body"));
      viewModel = new AcceptChangesStep(options);
    });

    afterEach(function() {
      $container.remove();
      viewModel = null;
    });

    it("should get content", function() {
      var callback = jasmine.createSpy();
      viewModel.beforeEnter(callback);
      var request = mostRecentAjaxRequest();

      request.response({
        status: 200,
        contentType: "text/html",
        responseText: "fuzzy kittens"
      });

      expect(callback).toHaveBeenCalled();
      expect($container.html()).toContain("fuzzy kittens");
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
  });
});
