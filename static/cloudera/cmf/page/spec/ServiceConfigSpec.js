// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/ServiceConfig',
  'cloudera/cmf/page/ConfigThreshold',
  'cloudera/cmf/page/ConfigInputList',
  'cloudera/cmf/page/ConfigInputWithUnit',
  'cloudera/Util'
], function(ServiceConfig, ConfigThreshold, ConfigInputList,
      ConfigInputWithUnit, Util) {
  var $testContainer, typesPrepared, serviceConfig;

  beforeEach(function() {
    serviceConfig = new ServiceConfig({
      serviceConfigTip : "halp!?1",
      passwordMask : "*****",
      isAdmin : true
    });

    typesPrepared = 0;
    $testContainer = $('<form>')
      .addClass('cmfConfig')
      .append(
        $('<div>').addClass("overrideGroup")
          .append($('<div>').addClass('dualThreshold'))
          .append($('<div>').addClass('hiddenInputList'))
          .append($('<div>').addClass('inputWithUnit'))
      )
      .append(
        $('<input>')
          .attr('type', 'password')
          .val("*****")
      )
      .appendTo('body');

  });

  afterEach(function() {
    $testContainer.remove();
    typesPrepared = 0;
    Util.unsubscribe(serviceConfig);
  });

  var incrementTypesPrepared = function() {
    typesPrepared++;
  };

  describe("ServiceConfig Tests", function() {
    it("should prepare inputs for submit", function() {
      spyOn(ConfigThreshold, 'onThresholdBeforeSubmit')
        .andCallFake(incrementTypesPrepared);
      spyOn(ConfigInputList, 'onInputListBeforeSubmit')
        .andCallFake(incrementTypesPrepared);
      spyOn(ConfigInputWithUnit, 'onInputWithUnitBeforeSubmit')
        .andCallFake(incrementTypesPrepared);

      $.publish("prepareInputsForSubmit");

      expect(typesPrepared).toBe(3);
      var isPasswordDisabled = $testContainer
        .find("input[type=password]").is(":disabled");
      expect(isPasswordDisabled).toBe(true);
    });
  });
});
