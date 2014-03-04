// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'underscore',
  'cloudera/cmf/wizard/hosts/AddHostsWizard'
], function(_, AddHostsWizard) {
  describe("AddHostsWizard Tests", function() {
    var id = "addHostsWizard", module;

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      var stepIds = ['repositorySelectionStep', 'hostCredentialsStep', 'installStep', 'hostInspectorStep', 'joinClusterStep', 'parcelInstallStep'];
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

    it("should initialize an AddHostsWizard with all the steps", function() {
      var options = {
        container: "dontcare",
        exitUrl: "dontcare",
        hostInspectorJsonUrl: "dontcare",
        newHosts: [ "dontcare" ]
      };
      module = new AddHostsWizard(options);
      expect(module.wizard.steps.length).toEqual(8);
    });

    it("should initialize an AddHostsWizard with some of the steps", function() {
      var options = {
        container: "dontcare",
        exitUrl: "dontcare",
        hostInspectorJsonUrl: "dontcare"
      };
      module = new AddHostsWizard(options);
      expect(module.wizard.steps.length).toEqual(5);
    });
  });
});
