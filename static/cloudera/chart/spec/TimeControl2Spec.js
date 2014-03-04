// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/Util",
   "cloudera/common/Humanize",
   "cloudera/common/TimeUtil",
   "cloudera/chart/TimeRange",
   "cloudera/chart/TimeControl2"
], function(Util, Humanize, TimeUtil, TimeRange, TimeControl2) {
  var zoomInBtnSuffix = "_zoomIn";
  var zoomOutBtnSuffix = "_zoomOut";
  var nowSuffix = "_now";
  var dateSelectorBtnSuffix = "_dateSelector";
  var customDateDialogSuffix = "_customDateDialog";
  var startDateInputSuffix = "_customDateDialog_startDate";
  var endDateInputSuffix = "_customDateDialog_endDate";
  var applyBtnSuffix = "_customDateDialog_apply";
  var errorSuffix = "_customDateDialog_error";
  var baseOptions = {
    mode: "INTERACTIVE",
    showRange: true,
    showMarker: true,
    firstDate: new Date(1),
    lastDate: new Date(10),
    firstVisibleDate: new Date(5),
    lastVisibleDate: new Date(10),
    markerDate: new Date(7),
    isCurrentMode: false
  };
  var id = "tc";
  var tc;

  var buildTimeControl = function(id) {
    var $container = $("<div>").attr("id", id);

    var $zoomOutBtn = $("<a>")
    .attr("href", "#")
    .attr("id", id + zoomOutBtnSuffix)
    .text("Zoom Out");

    var $zoomInBtn = $("<a>")
    .attr("href", "#")
    .attr("id", id + zoomInBtnSuffix)
    .text("Zoom In");

    var $nowBtn = $("<a>")
    .attr("href", "#")
    .attr("id", id + nowSuffix)
    .text("Now");

    var $customBtn = $("<a>")
    .attr("href", "#")
    .attr("id", id + dateSelectorBtnSuffix)
    .text("Custom");

    var $customDialog = $("<div>")
    .attr("id", id + customDateDialogSuffix)
    .css("display", "none");

    var $fromInput = $("<input>")
    .attr("id", id + startDateInputSuffix)
    .attr("type", "text");

    var $toInput = $("<input>")
    .attr("id", id + endDateInputSuffix)
    .attr("type", "text");

    var $applyBtn = $("<button>")
    .attr("id", id + applyBtnSuffix)
    .text("Apply");

    var $errorDiv = $("<div>")
    .attr("id", id + errorSuffix);

    var presets = [30, 60, 90, 360, 720, 1440];
    var presetIds = ["30m", "60m", "90m", "6h", "12h", "24h"];
    var i;

    for (i = 0; i < presetIds.length; i += 1) {
      var $presetBtn = $("<button>")
      .attr("id", id + "_" + presetIds[i])
      .text(presetIds[i]);
      $customDialog.append($presetBtn);
    }

    $customDialog
    .append($fromInput)
    .append($toInput)
    .append($applyBtn)
    .append($errorDiv);

    $container.append($zoomOutBtn)
    .append($zoomInBtn)
    .append($nowBtn)
    .append($customBtn)
    .append($customDialog);

    return $container;
  };

  var commonBeforeEach = function(options) {
    jasmine.Ajax.useMock();
    spyOn(TimeUtil, 'getTimezoneDelta').andReturn(0);

    $("body").append(buildTimeControl(id));
    spyOn($.fn, "datetimepicker").andCallThrough();

    tc = new TimeControl2(options, id);
    spyOn(tc.state, "zoomIn").andCallThrough();
    spyOn(tc.state, "zoomOut").andCallThrough();
    spyOn(tc.marker, "onWindowResized").andCallThrough();
    spyOn(tc.state, "moveToNow").andCallThrough();
    spyOn(tc.state, "expandRange").andCallThrough();
    spyOn(tc.state, "setMarkerDate").andCallThrough();

    tc.openCustomDateDialog = function(options) {
      $("#" + id + customDateDialogSuffix).show();
    };

    tc.closeCustomDateDialog = function() {
      $("#" + id + customDateDialogSuffix).hide();
    };

    var customServerMarkerDate;

    tc.getCustomServerMarkerDate = function() {
      return customServerMarkerDate;
    };

    tc.setCustomServerMarkerDate = function(date) {
      customServerMarkerDate = date;
    };
  };

  var commonAfterEach = function() {
    $("#" + id).remove();
    if (tc) {
      tc.unsubscribe();
    }
  };

  describe("TimeControl2 Tests", function() {
    var options = $.extend({}, baseOptions);

    beforeEach(function() {
      commonBeforeEach(options);
    });
    afterEach(commonAfterEach);

    it("should trigger the zoomIn operation when clicking on the zoom in button", function() {
      var event = jQuery.Event("click");
      spyOn(event, "preventDefault").andCallThrough();
      $("#" + id + zoomInBtnSuffix).trigger(event);
      expect(tc.state.zoomIn).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should trigger the zoom out operation when clicked on the zoom out button", function() {
      var event = jQuery.Event("click");
      spyOn(event, "preventDefault").andCallThrough();
      $("#" + id + zoomOutBtnSuffix).trigger(event);
      expect(tc.state.zoomOut).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should trigger the now operation when clicked on the now button", function() {
      var event = jQuery.Event("click");
      spyOn(event, "preventDefault").andCallThrough();
      $("#" + id + nowSuffix).trigger(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should trigger the expand operation when the expandTimeRangeSelection event is fired", function() {
      $.publish("expandTimeRangeSelection");
      expect(tc.state.expandRange).toHaveBeenCalled();
    });

    it("should trigger the now operation when the switchToCurrent event is fired", function() {
      $.publish("switchToCurrent");
      expect(tc.state.moveToNow).toHaveBeenCalled();
    });

    it("should make the custom date dialog appear when the custom date icon is clicked", function() {
      $("#" + id + dateSelectorBtnSuffix).trigger("click");
      expect($("#" + id + customDateDialogSuffix).is(":visible")).toEqual(true);
    });

    it("should hide the custom date dialog when the OK button is clicked", function() {
      $("#" + id + dateSelectorBtnSuffix).trigger("click");

      spyOn(tc.state, "setSelectedRange").andCallThrough();
      expect($("#" + id + customDateDialogSuffix).is(":visible")).toEqual(true);

      $("#" + id + applyBtnSuffix).trigger("click");
      expect($("#" + id + customDateDialogSuffix).is(":visible")).toEqual(false);
      expect(tc.state.setSelectedRange).toHaveBeenCalled();
    });

    it("should make the custom date dialog appear again when the custom date icon is clicked again", function() {
      $("#" + id + dateSelectorBtnSuffix).trigger("click");
      expect($("#" + id + customDateDialogSuffix).is(":visible")).toEqual(true);
    });

    it("should change marker time in response to changeMarkerTime event", function() {
      spyOn(tc.marker, 'setMarkerDate');
      spyOn(tc.state, 'getOffsetFromDate').andReturn(5);
      spyOn(tc.marker, 'moveToOffset');
      var date = new Date();
      $.publish("changeMarkerTime", [date, true]);
      expect(tc.state.zoomOut).wasCalled();
      expect(tc.state.getOffsetFromDate).wasCalledWith(date);
      expect(tc.marker.moveToOffset).wasCalled();
      var args = tc.marker.moveToOffset.mostRecentCall.args;
      expect(args[0]).toEqual(5); // offset from date
      expect(args[1]).toEqual(true); // animate
      var cb = args[2];
      expect(tc.marker.setMarkerDate).wasNotCalled();
      cb();
      expect(tc.marker.setMarkerDate).wasCalled();
    });

    it("should trigger setMarkerDate", function() {
      spyOn(tc.marker, "setMarkerDate").andCallThrough();
      $("#" + id).trigger("click");
      expect(tc.marker.setMarkerDate).wasCalled();
    });

    it("should create a TimeControlMini object", function() {
      expect(tc.timeControlMini).toBeDefined();
    });

    it("should create datetimepicker with select control type", function() {
      expect($.fn.datetimepicker).wasCalledWith({
        controlType: "select"
      });
    });

    it("should test onChangeMarkerTime", function() {
      $.publish("changeMarkerTime", [new Date(6), false]);
      expect(tc.state.markerDate).toEqual(new Date(6));
    });

    it("should test onChangeTimeSelection", function() {
      spyOn(tc.state, "selectRange").andCallThrough();

      $.publish("changeTimeSelection", [new TimeRange(new Date(6), new Date(8))]);
      expect(tc.state.firstVisibleDate).toEqual(new Date(6));
      expect(tc.state.lastVisibleDate).toEqual(new Date(8));
    });
  });

  describe("TimeControl2 Tests with showRange=false, showMarker=true", function() {
    var options = $.extend({}, baseOptions, {
      showRange: false,
      showMarker: true
    });

    beforeEach(function() {
      commonBeforeEach(options);
    });
    afterEach(commonAfterEach);

    it("should trigger the zoomIn operation when clicking on the zoom in button", function() {
      $("#" + id + zoomInBtnSuffix).trigger("click");
      expect(tc.state.zoomIn).toHaveBeenCalled();
    });

    it("should trigger the zoom out operation when clicked on the zoom out button", function() {
      $("#" + id + zoomOutBtnSuffix).trigger("click");
      expect(tc.state.zoomOut).toHaveBeenCalled();
    });

    it("should trigger the expand operation when the expandTimeRangeSelection event is fired", function() {
      $.publish("expandTimeRangeSelection");
      expect(tc.state.expandRange).toHaveBeenCalled();
    });

    it("should trigger the now operation when the switchToCurrent event is fired", function() {
      $.publish("switchToCurrent");
      expect(tc.state.moveToNow).toHaveBeenCalled();
    });

    it("should make the custom date dialog appear when the custom date icon is clicked", function() {
      $("#" + id + dateSelectorBtnSuffix).trigger("click");
      expect($("#" + id + customDateDialogSuffix).is(":visible")).toEqual(true);
    });

    it("should hide the custom date dialog when the OK button is clicked", function() {
      $("#" + id + dateSelectorBtnSuffix).trigger("click");
      expect($("#" + id + customDateDialogSuffix).is(":visible")).toEqual(true);

      $("#" + id + applyBtnSuffix).trigger("click");
      expect($("#" + id + customDateDialogSuffix).is(":visible")).toEqual(false);
      expect(tc.state.setMarkerDate).toHaveBeenCalled();
    });

    it("should make the custom date dialog appear again when the custom date icon is clicked again", function() {
      $("#" + id + dateSelectorBtnSuffix).trigger("click");
      expect($("#" + id + customDateDialogSuffix).is(":visible")).toEqual(true);
    });

    it("should trigger setMarkerDate", function() {
      spyOn(tc.marker, "setMarkerDate").andCallThrough();
      $("#" + id).trigger("click");
      expect(tc.marker.setMarkerDate).wasCalled();
    });
  });

  describe("TimeControl2 Tests with showRange=false, showMarker=false", function() {
    var options = $.extend({}, baseOptions, {
      mode: "INTERACTIVE",
      showRange: false,
      showMarker: false
    });
    beforeEach(function() {
      commonBeforeEach(options);
    });
    afterEach(commonAfterEach);

    it("should not trigger setMarkerDate", function() {
      spyOn(tc.marker, "setMarkerDate").andCallThrough();
      $("#" + id).trigger("click");
      expect(tc.marker.setMarkerDate).wasNotCalled();
    });
  });

  describe("TimeControl2 Tests with showRange=false, showMarker=false", function() {
    var options = $.extend({}, baseOptions, {
      mode: "READONLY",
      showRange: false,
      showMarker: false
    });
    beforeEach(function() {
      commonBeforeEach(options);
    });
    afterEach(commonAfterEach);

    it("should not trigger setMarkerDate", function() {
      spyOn(tc.marker, "setMarkerDate").andCallThrough();
      $("#" + id).trigger("click");
      expect(tc.marker.setMarkerDate).wasNotCalled();
    });
  });
});
