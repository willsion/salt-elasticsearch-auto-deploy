// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/hosts/UpgradeHostsWizard',
  'underscore'
], function(UpgradeHostsWizard, _) {
  describe("UpgradeHostsWizard Tests", function() {
    var id = "addHostsWizard", module;

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      var stepIds = [
        'repositorySelectionStep',
        'hostCredentialsStep',
        'installStep',
        'hostInspectorStep'
      ];
      _.each(stepIds, function(stepId) {
        $("<div>").attr("id", stepId).appendTo($("#" + id));
      });
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    afterEach(function() {
      module.wizard.unsubscribe();
      $("#" + id).remove();
    });

    it("should initialize an UpgradeHostsWizard", function() {
      var options = {
        container: "dontcare",
        exitUrl: "dontcare",
        hostInspectorJsonUrl: "dontcare"
      };
      module = new UpgradeHostsWizard(options);
      expect(module.wizard.steps.length).toEqual(4);
    });
  });
});
