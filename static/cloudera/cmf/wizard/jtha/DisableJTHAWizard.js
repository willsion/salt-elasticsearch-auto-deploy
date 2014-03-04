// Copyright (c) 2013 Cloudera, Inc.  All rights reserved.
define([
  "knockout",
  "cloudera/Util",
  "cloudera/cmf/wizard/WizardBase",
  "cloudera/cmf/wizard/jtha/RemoveStep",
  "cloudera/cmf/wizard/common/CommandStep"
], function(ko, Util, WizardBase, RemoveStep, CommandStep) {
  "use strict";

  /**
   * options = {
   *  container:        (required) parameter required for WizardBase
   *  commandUrl        (required) url for starting the disable command
   *  progressUrl       (required) url for getting the command progress
   *  retryUrl          (required) url for retrying the command
   *  exitUrl:          (required) parameter required for WizardBase
   * }
   */
  function DisableJTHAWizard(options) {
    var self = this, steps = [];

    var removeStep = new RemoveStep({
      id : "removeStep",
      commandUrl : options.commandUrl
    });
    steps.push(removeStep);

    var commandStep = new CommandStep({
      id : "commandStep",
      progressUrl : options.progressUrl,
      retryUrl : options.retryUrl,
      commandId : removeStep.commandId
    });
    steps.push(commandStep);

    self.wizard = new WizardBase({
      container : options.container,
      exitUrl: options.exitUrl,
      steps: steps
    });

    var handle1 = $.subscribe("showJTHAWizardSpinner", function() {
      $("#disableJTHAWizardSpinner").removeClass("hidden");
    });

    var handle2 = $.subscribe("hideJTHAWizardSpinner", function() {
      $("#disableJTHAWizardSpinner").addClass("hidden");
    });

    self.subscriptionHandles = [handle1, handle2];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

  }

  return DisableJTHAWizard;
});
