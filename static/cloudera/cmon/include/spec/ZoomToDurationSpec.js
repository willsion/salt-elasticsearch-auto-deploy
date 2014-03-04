// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmon/include/ZoomToDuration",
  "cloudera/common/I18n",
  "cloudera/common/TimeUtil"
], function(ZoomToDuration, I18n, TimeUtil) {
  describe("ZoomToDuration tests", function() {
    var id = "zoomToDuration", options = {
      container: "#" + id
    }, optionsWithRange = {
      startDate: new Date(100000),
      endDate: new Date(200000)
    }, optionsWithoutStart = {
      endDate: new Date(200000)
    }, optionsWithoutEnd = {
      startDate: new Date(100000)
    };

    beforeEach(function() {
      $("<button>").attr("id", id).appendTo(document.body);
      spyOn(TimeUtil, "getServerNow").andReturn(new Date(300000));
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should test isDisabled return true if startDate is undefined", function() {
      var module = new ZoomToDuration(options);
      expect(module.isDisabled()).toBeTruthy();
    });

    it("should test onclick and trigger changeTimeSelection", function() {
      var module = new ZoomToDuration(optionsWithRange);
      spyOn($, "publish");

      module.onclick();
      expect($.publish).wasCalled();
    });

    it("should test onclick and not trigger changeTimeSelection", function() {
      var module = new ZoomToDuration(optionsWithoutStart);
      spyOn($, "publish");

      module.onclick();
      expect($.publish).wasNotCalled();
    });

    it("should test getTitle and return a title tooltip", function() {
      var module = new ZoomToDuration(optionsWithRange);
      expect(module.getTitle()).toEqual(I18n.t("ui.zoomToDurationTip"));
    });

    it("should test getTitle and return a not started title tooltip", function() {
      var module = new ZoomToDuration(optionsWithoutStart);
      expect(module.getTitle()).toEqual(I18n.t("ui.notStarted"));
    });

    it("should test getStartDate", function() {
      var module = new ZoomToDuration(optionsWithRange);
      expect(module.getStartDate().getTime()).toEqual(100000 - 60000);
    });

    it("should test getStartDate and return undefined", function() {
      var module = new ZoomToDuration(optionsWithoutStart);
      expect(module.getStartDate()).toBeUndefined();
    });

    it("should test getEndDate", function() {
      var module = new ZoomToDuration(optionsWithRange);
      expect(module.getEndDate().getTime()).toEqual(200000 + 60000);
    });

    it("should test getEndDate and set it to now", function() {
      var now = TimeUtil.getServerNow();
      var module = new ZoomToDuration(optionsWithoutEnd);
      expect(module.getEndDate().getTime()).toEqual(now.getTime());
    });
  });
});
