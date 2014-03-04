// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/ScrollBarStablizer'
], function(ScrollBarStablizer) {
  describe("ScrollBarStablizer Tests", function() {

    function getStablizerElement() {
      return $("#" + ScrollBarStablizer.id);
    }

    function ensureStablizerElementIsPresent() {
      expect(getStablizerElement().length).toEqual(1);
    }

    function ensureStablizerElementIsNotPresent() {
      expect(getStablizerElement().length).toEqual(0);
    }

    it("should create/destroy the stablizer object", function() {
      ScrollBarStablizer.addRef();
      ensureStablizerElementIsPresent();

      ScrollBarStablizer.addRef();
      ScrollBarStablizer.addRef();
      ensureStablizerElementIsPresent();

      ScrollBarStablizer.release();
      ensureStablizerElementIsPresent();
      ScrollBarStablizer.release();
      ensureStablizerElementIsPresent();
      ScrollBarStablizer.release();
      ensureStablizerElementIsNotPresent();
    });

    it("should create the stablizer object and ensure it is invisible", function() {
      ScrollBarStablizer.addRef();
      expect(getStablizerElement().css("z-index")).toEqual("-1000");
      expect(getStablizerElement().css("position")).toEqual("absolute");
      expect(getStablizerElement().css("visibility")).toEqual("hidden");
      ScrollBarStablizer.release();
    });
  });
});
