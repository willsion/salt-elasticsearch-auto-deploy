// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/include/HealthCheckDetailsPopup',
  "cloudera/common/I18n"
], function(HealthCheckDetailsPopup, I18n) {
  describe("HealthCheckDetailsPopup tests", function() {
    var viewModel, $container;

    var options = {
      container: "#healthCheckDetailsContainer"
    };

    beforeEach(function() {
      $container = $('<div>')
        .attr('id', 'healthCheckDetailsContainer')
        .appendTo('body');
      viewModel = new HealthCheckDetailsPopup(options);
    });

    afterEach(function() {
      $container.remove();
      viewModel.unsubscribe();
      viewModel = null;
    });

    it("should popuplate values and show modal", function() {
      spyOn(jQuery.fn, "modal");

      var checkRow = {
        // In real life this would be populated.
        entities: [],
        health: "RED",
        name: "my awesome check",
        number: 3
      };

      $.publish("showCheckDetailsPopup", [checkRow]);

      expect(viewModel.entities().length).toBe(0);
      expect(viewModel.health()).toEqual(checkRow.health);
      expect(viewModel.humanizedHealth()).toEqual(I18n.t("ui.health.bad"));
      expect(viewModel.name()).toEqual(checkRow.name);
      expect(viewModel.number()).toEqual(checkRow.number);

      expect(jQuery.fn.modal).toHaveBeenCalled();
    });
  });
});
