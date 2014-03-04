// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/jtha/DisableJTHAWizard'
], function(DisableJTHAWizard) {

  describe("DisableJTHAWizard", function() {
    var $container, viewModel, options;
    options = {
      container: "disableJTHATestContainer",
      commandUrl: "/foo/command",
      progressUrl: "/bar/progress",
      retryUrl: "/foo/retry",
      exitUrl: "/bar/exit"
    };

    beforeEach(function() {
      $container = $("<div>")
        .attr("id", options.container)
        .appendTo($("body"));
      viewModel = new DisableJTHAWizard(options);
    });

    afterEach(function() {
      $container.remove();
      viewModel.unsubscribe();
      viewModel = null;
    });

    it ("should have the correct steps", function() {
      expect(viewModel.wizard.steps.length).toEqual(2);
      expect(viewModel.wizard.steps[0].id).toEqual("removeStep");
      expect(viewModel.wizard.steps[1].id).toEqual("commandStep");
    });
  });
});
