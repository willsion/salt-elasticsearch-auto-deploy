// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/rr/ClusterRollingRestartConfirmPopup'
], function(ClusterRollingRestartConfirmPopup) {

  describe("ClusterRollingRestartConfirmPopup Tests", function() {
    var options, $testContainer, viewModel;

    // The real jsonArgs object passed into the view
    // model is much bigger than this.  This contains
    // only the parts we care about for testing.
    options = {
      jsonArgs : {
        clusterRRArgs : {
          slaveBatchSize : 1,
          slaveFailCountThreshold : 0,
          sleepSeconds : 0
        }
      },
      containerId : "rrTestContainer"
    };

    beforeEach(function() {
      $testContainer = $('<form>').attr('id', options.containerId).appendTo($('body'));
      viewModel = new ClusterRollingRestartConfirmPopup(options);
    });

    afterEach(function() {
      $testContainer.remove();
      viewModel = null;
    });

    it ("should have a valid slave batch size", function() {
      expect(viewModel.isSlaveBatchSizeValid()).toBeTruthy();
    });

    it ("should find non-numeric slave batch size invalid", function() {
      viewModel.data.clusterRRArgs.slaveBatchSize("kittens");
      expect(viewModel.isSlaveBatchSizeValid()).toBeFalsy();
    });

    it("should find slave batch size less than 1 invald", function() {
      viewModel.data.clusterRRArgs.slaveBatchSize(0);
      expect(viewModel.isSlaveBatchSizeValid()).toBeFalsy();
    });

    it("should have a valid slave fail count threshold", function() {
      expect(viewModel.isSlaveFailCountThresholdValid()).toBeTruthy();
    });

    it("should find non-numeric slave fail count threshold invalid", function() {
      viewModel.data.clusterRRArgs.slaveFailCountThreshold("more kittens!");
      expect(viewModel.isSlaveFailCountThresholdValid()).toBeFalsy();
    });

    it("should find negative slave fail count threshold invalid", function() {
      viewModel.data.clusterRRArgs.slaveFailCountThreshold(-1);
      expect(viewModel.isSlaveFailCountThresholdValid()).toBeFalsy();
    });

    it("should have a valid sleep seconds value", function() {
      expect(viewModel.isSleepSecondsValid()).toBeTruthy();
    });

    it("should find non-numeric sleep seconds value invald", function() {
      viewModel.data.clusterRRArgs.sleepSeconds("bushels of kittens!");
      expect(viewModel.isSleepSecondsValid()).toBeFalsy();
    });

    it("should find negative sleep seconds value invald", function() {
      viewModel.data.clusterRRArgs.sleepSeconds(-1);
      expect(viewModel.isSleepSecondsValid()).toBeFalsy();
    });

    it("should find form valid", function() {
      // Input is valid and a service is selected.
      viewModel.services(["1"]);
      expect(viewModel.isFormValid()).toBeTruthy();
    });

    it("should find form invalid 1", function() {
      // Input is valid, but not services selected.
      expect(viewModel.isFormValid()).toBeFalsy();
    });

    it("should find form invalid 2", function() {
      // Services selected, but slave batch size is invalid.
      viewModel.services(["1"]);
      viewModel.data.clusterRRArgs.slaveBatchSize("rhinoceros");
      expect(viewModel.isFormValid()).toBeFalsy();
    });

    it("should find form invalid 2", function() {
      // Services selected, but slave fail count threshold is invalid.
      viewModel.services(["1"]);
      viewModel.data.clusterRRArgs.slaveFailCountThreshold("big rhinoceros");
      expect(viewModel.isFormValid()).toBeFalsy();
    });

    it("should find form invalid 2", function() {
      // Services selected, but slave batch size is invalid.
      viewModel.services(["1"]);
      viewModel.data.clusterRRArgs.sleepSeconds("angry rhinoceros");
      expect(viewModel.isFormValid()).toBeFalsy();
    });

  });
});
