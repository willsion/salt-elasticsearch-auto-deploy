// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/form/InputWithUnit"
], function(InputWithUnit) {

  describe("InputWithUnit Tests", function() {
    it("should test the basics", function() {
      var options = {
        scaleOptions: [{
          label: 'B',
          scale: 1
        }, {
          label: 'KiB',
          scale: 1024
        }, {
          label: 'MiB',
          scale: 1024 * 1024
        }]
      };

      options.value = 101;
      var module = new InputWithUnit(options);

      expect(module.humanizedValue()).toEqual("101 B");
      expect(module.isHumanizedValueVisible()).toEqual(false);

      options.value = 1025;
      module = new InputWithUnit(options);

      // Use indexOf because the approximation character (a Unicode Character)
      // does not work with JSCoverage.
      expect(module.humanizedValue().indexOf("1.00 KiB")).toBeGreaterThan(0);
      expect(module.isHumanizedValueVisible()).toEqual(true);

      module.numValue(0.5);
      module.scale(1024);
      expect(module.humanizedValue()).toEqual("512 B");
      expect(module.isHumanizedValueVisible()).toEqual(true);

      options.value = "";
      module = new InputWithUnit(options);

      expect(module.humanizedValue()).toEqual("");
      expect(module.isHumanizedValueVisible()).toEqual(false);

      options.value = "0";
      module = new InputWithUnit(options);

      expect(module.humanizedValue()).toEqual("0 B");
      expect(module.isHumanizedValueVisible()).toEqual(false);
    });
  });
});
