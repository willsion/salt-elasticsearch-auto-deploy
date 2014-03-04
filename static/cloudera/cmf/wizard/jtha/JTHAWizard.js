// Copyright (c) 2013 Cloudera, Inc.  All rights reserved.
define([
  "knockout",
  "underscore",
  "cloudera/Util",
  "cloudera/cmf/wizard/WizardBase",
  "cloudera/cmf/wizard/common/RoleAssignmentStep",
  "cloudera/cmf/wizard/common/AcceptChangesStep",
  "cloudera/cmf/wizard/common/CommandStep"
], function(ko, _, Util, WizardBase, RoleAssignmentStep, AcceptChangesStep, CommandStep) {
  "use strict";

  /**
   * options = {
   *  container:         (required) "parameter required for WizardBase"
   *  listAssignmentsUrl (required) "url for getting the assignment table"
   *  configsUrl         (required) "url for getting the config view"
   *  exitUrl:           (required) "parameter required for WizardBase"
   *  zkServices:        (required) a list of zookeeper services in the cluster: [ {
   *    id: serviceId,
   *    displayName: "ZOOKEEPER-1"
   *  }, {
   *    id: serviceId,
   *    displayName: "ZOOKEEPER-2"
   *  }],
   *  zkForAutoFailover: (optional) the dependent zookeeper service: serviceId
   * }
   */
  function JTHAWizard(options) {
    var self = this, steps = [];

    var roleAssignmentStep = new RoleAssignmentStep({
      id: "roleAssignmentStep",
      listAssignmentsUrl : options.listAssignmentsUrl,
      zkServices: options.zkServices,
      zkForAutoFailover: options.zkForAutoFailover
    });
    steps.push(roleAssignmentStep);

    var acceptChangesStep = new AcceptChangesStep({
      id: "acceptChangesStep",
      configsUrl : options.configsUrl,
      commandUrl : options.commandUrl,
      chosenSBJT : roleAssignmentStep.chosenSBJT,
      chosenZK: roleAssignmentStep.chosenZK
    });
    steps.push(acceptChangesStep);

    var commandStep = new CommandStep({
      id: "commandStep",
      progressUrl : options.progressUrl,
      retryUrl : options.retryUrl,
      commandId : acceptChangesStep.commandId
    });
    steps.push(commandStep);

    self.wizard = new WizardBase({
      container: options.container,
      exitUrl: options.exitUrl,
      steps: steps
    });

    var handle1 = $.subscribe("showJTHAWizardSpinner", function() {
      $("#enableJTHAWizardSpinner").removeClass("hidden");
    });

    var handle2 = $.subscribe("hideJTHAWizardSpinner", function() {
      $("#enableJTHAWizardSpinner").addClass("hidden");
    });

    self.subscriptionHandles = [handle1, handle2];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

  }

  return JTHAWizard;
});
