// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/jtha/JTHAWizard'
], function(JTHAWizard) {

  describe("JTHAWizard Tests", function() {
    var $container, viewModel, options;
    options = {
      container: "jthaTestContainer",
      listAssignmentsUrl: "/foo/listAssignments",
      configsUrl: "/bar/configs",
      exitUrl: "/baz/exit",
      zkServices: [],
      zkForAutoFailover: undefined
    };

    beforeEach(function() {
      $container = $("<div>")
        .attr("id", options.container)
        .appendTo($("body"));
      viewModel = new JTHAWizard(options);
    });

    afterEach(function() {
      $container.remove();
      viewModel.unsubscribe();
      viewModel = null;
    });

    it("should have the correct steps", function() {
      expect(viewModel.wizard.steps.length).toEqual(3);
      expect(viewModel.wizard.steps[0].id).toEqual("roleAssignmentStep");
      expect(viewModel.wizard.steps[1].id).toEqual("acceptChangesStep");
      expect(viewModel.wizard.steps[2].id).toEqual("commandStep");
    });
  });
});
