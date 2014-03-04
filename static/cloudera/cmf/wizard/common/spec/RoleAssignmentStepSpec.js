// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/common/RoleAssignmentStep'
], function(RoleAssignmentStep) {

  describe("RoleAssignmentStep Tests", function() {
    var $container, viewModel, options;
    options = {
      id: "roleAssignmentStep",
      listAssignmentsUrl: "/foo/listAssignments",
      zkServices: []
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $container = $("<div>")
        .attr("id", "hostRoleAssignments")
        .appendTo($("body"));
      viewModel = new RoleAssignmentStep(options);
    });

    afterEach(function() {
      $container.remove();
      viewModel.unsubscribe();
      viewModel = null;
    });

    it("should get content", function() {
      var callback = jasmine.createSpy();
      viewModel.beforeEnter(callback);
      var request = mostRecentAjaxRequest();

      request.response({
        status: 200,
        contentType: "text/html",
        responseText: "large rhinoceros"
      });

      expect(callback).toHaveBeenCalled();
      expect($container.html()).toContain("large rhinoceros");
    });

    it("should set chosenSBJT", function() {
      $.publish("selectHostAssignment", ["hostIdForSBJT", "foo1.bar.com", true]);
      expect(viewModel.chosenSBJT()).toEqual("foo1.bar.com");
    });

    it("should not set chosenSBJT", function() {
      viewModel.chosenSBJT("kittens");
      $.publish("selectHostAssignment", ["not hostIdForSBJT", "rhinoceros", true]);
      expect(viewModel.chosenSBJT()).toEqual("kittens");
    });

    it("should enable continue", function() {
      viewModel.chosenSBJT("foo1.bar.com");
      expect(viewModel.enableContinue()).toBeTruthy();
    });

    it("should disable continue", function() {
      viewModel.chosenSBJT("");
      expect(viewModel.enableContinue()).toBeFalsy();
    });
  });
});
