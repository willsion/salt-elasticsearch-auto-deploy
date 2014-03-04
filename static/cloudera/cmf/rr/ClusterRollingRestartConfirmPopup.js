// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "komapping",
  "knockout"
], function(komapping, ko) {
  /**
   * options = {
   *   jsonArgs: "the structure of the arguments"
   *   container: "The DOM selector"
   * }
   */
  return function ClusterRollingRestartConfirmPopup(options) {
    var self = this;
    self.data = komapping.fromJS(options.jsonArgs);
    self.services = ko.observableArray([]);
    self.$form = $(options.containerId);

    self.isSlaveBatchSizeValid = ko.computed(function() {
      var slaveBatchSize = self.data.clusterRRArgs.slaveBatchSize();
      return $.isNumeric(slaveBatchSize) && slaveBatchSize >= 1;
    });

    self.isSlaveFailCountThresholdValid = ko.computed(function() {
      var slaveFailCountThreshold = self.data.clusterRRArgs.slaveFailCountThreshold();
      return $.isNumeric(slaveFailCountThreshold) && slaveFailCountThreshold >= 0;
    });

    self.isSleepSecondsValid = ko.computed(function() {
      var sleepSeconds = self.data.clusterRRArgs.sleepSeconds();
      return $.isNumeric(sleepSeconds) && sleepSeconds >= 0;
    });

    self.isFormValid = ko.computed(function() {
      // We can't simply return this conjuction, as
      // doing so breaks the chaining of observables
      // in knockout.
      var isValid = 
        self.services().length > 0 &&
        self.isSlaveBatchSizeValid() &&
        self.isSlaveFailCountThresholdValid() &&
        self.isSleepSecondsValid();
      return isValid;
    });

    $(".restart-confirm-button").click(function(evt) {
      var dataString = ko.toJSON(komapping.toJS(self.data));
      self.$form.find("input[name=jsonArgs]").val(dataString);
    });

    ko.applyBindings(self, self.$form[0]);
  };
});
