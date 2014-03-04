// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/charts/ChartRangeSelector'
], function(ChartRangeSelector) {
  describe("ChartRangeSelector Tests", function() {

    var module, id = "chartRangeSelector";

    beforeEach(function(){
      $('<div id="' + id + '"></div>').appendTo(document.body);
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should create a ChartRangeSelector", function() {
      var options = {
        container: "#" + id,
        min: 100,
        max: 200
      };

      module = new ChartRangeSelector(options);
      expect(module.min()).toEqual(100);
      expect(module.max()).toEqual(200);
    });

    it("should publish a chartRangeChanged event", function() {
      var options = {
        container: "#" + id,
        min: 100,
        max: 200
      };

      spyOn($, "publish");
      module = new ChartRangeSelector(options);
      module.min(200);
      module.max(300);
      module.apply();
      expect($.publish).wasCalledWith("chartRangeChanged", [200, 300]);
    });

    it("should still publish a chartRangeChanged event when only one value is filled in", function() {
      var options = {
        container: "#" + id
      };

      spyOn($, "publish");
      module = new ChartRangeSelector(options);
      module.min("");
      module.max(300);
      module.apply();
      expect($.publish).wasCalledWith("chartRangeChanged", [undefined, 300]);
    });


    it("should NOT publish a chartRangeChanged event when the input is invalid", function() {
      var options = {
        container: "#" + id,
        min: 100,
        max: 200
      };

      spyOn($, "publish");
      module = new ChartRangeSelector(options);
      module.min("FOO");
      module.apply();
      expect($.publish).wasNotCalled();
    });
  });
});
