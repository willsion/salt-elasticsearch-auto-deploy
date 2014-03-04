// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/DateUtil"
], function(DateUtil) {
  describe("DateUtil Tests", function() {
    var d1, d2, d3;

    beforeEach(function() {
      d1 = new Date(2);
      d2 = new Date(10);
      d3 = new Date(10);
    });

    it("should find the minimum of two dates", function(){
      expect(DateUtil.min(d1, d2)).toEqual(d1);
    });

    it("should find the maximum of two dates", function(){
      expect(DateUtil.max(d1, d2)).toEqual(d2);
    });

    it("should find the average of two dates", function(){
      expect(DateUtil.avg(d1, d2).getTime()).toEqual(new Date(6).getTime());
    });

    it("should find the delta of two dates", function(){
      expect(DateUtil.delta(d1, d2)).toEqual(8);
    });

    it("should find the two different dates different", function() {
      expect(DateUtil.same(d1, d2)).toEqual(false);
    });

    it("should find the two same dates same", function() {
      expect(DateUtil.same(d2, d3)).toEqual(true);
    });

    it("should find the one date and one null different", function() {
      expect(DateUtil.same(d1, null)).toEqual(false);
      expect(DateUtil.same(null, d2)).toEqual(false);
    });

    it("should find the a new date greater by 10ms", function() {
      expect(DateUtil.same(DateUtil.add(d1, 8), d2)).toEqual(true);
      expect(DateUtil.same(DateUtil.subtract(d2, 8), d1)).toEqual(true);
    });
  });
});
