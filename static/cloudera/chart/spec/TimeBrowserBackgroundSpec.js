// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/Humanize",
  "cloudera/chart/TimeRange",
  "cloudera/chart/TimeBrowserBackground",
  "underscore"
], function(Util, Humanize, TimeRange, TimeBrowserBackground, _) {

  describe("TimeBrowserBackground Tests", function() {

    var id = "timeBrowserBackground";

    var options = {
      container: "#" + id,
      timeRange: new TimeRange(new Date(1), new Date(3)),
      width: 100,
      height: 40,
      view: {
        plots: [ {
          tsquery: "SELECT cpu_percent"
        } ]
      }
    };

    var module, state = {
      markerRightWidth: 9
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      $("<div></div>").attr("id", id).appendTo(document.body);
      module = new TimeBrowserBackground(options, state);
    });

    afterEach(function() {
      module.unsubscribe();
      $("#" + id).remove();
    });

    it("should not call updateTimeRange.", function() {
      spyOn(module.viewContainer, "updateTimeRange");
      $.publish("timeSelectionChanged", [new TimeRange(new Date(1), new Date(2)), false]);
      expect(module.viewContainer.updateTimeRange).wasNotCalled();
    });

    it("should call updateTimeRange.", function() {
      spyOn(module.viewContainer, "updateTimeRange");
      $.publish("totalTimeRangeChanged",[new TimeRange(new Date(3), new Date(4))]);
      expect(module.viewContainer.updateTimeRange).wasCalled();
    });

    it("should call setDimension", function() {
      $("#" + id).width(200).height(80);
      spyOn(module.viewContainer, "setDimension");
      module.onWindowResized();
      expect(module.viewContainer.setDimension).wasCalledWith(191, 80);
    });

    it("should render an empty chart", function() {
      spyOn(module.viewContainer.plotContainers[0], "render");

      $.publish("totalTimeRangeChanged",[new TimeRange(new Date(3), new Date(4))]);
      var timeSeriesResponse = {
        tsquery: "SELECT cpu_percent",
        timeSeries: [ {
          data: [ {
            x: 3,
            y: 0
          }, {
            x: 4,
            y: 0
          } ],
          metadata: {
            label: ""
          }
        } ]
      };
      expect(module.viewContainer.plotContainers[0].render).wasCalledWith(timeSeriesResponse);
      expect(module.viewContainer.plotContainers[0].render.callCount).toEqual(1);
      $.publish("totalTimeRangeChanged",[new TimeRange(new Date(4), new Date(5))]);
      // If the same duration is applied, then not called again.
      expect(module.viewContainer.plotContainers[0].render.callCount).toEqual(1);
      $.publish("totalTimeRangeChanged",[new TimeRange(new Date(6), new Date(8))]);
      // If a different duration is applied, then called again.
      expect(module.viewContainer.plotContainers[0].render.callCount).toEqual(2);
    });

    it('should not publish errors and warnings', function() {
      // We have to clean up those subscriptions later.
      var handlers = [];

      var errorListener = jasmine.createSpy('errorListener');
      var warningListener = jasmine.createSpy('warningListener');
      handlers.push($.subscribe('chartErrorsChanged', errorListener));
      handlers.push($.subscribe('chartWarningsChanged', warningListener));

      $.publish('totalTimeRangeChanged', [new TimeRange(new Date(3), new Date(4))]);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify([{
          tsquery: 'SELECT cpu_percent',
          timeSeries: [],
          errors: ['Got a bad error here'],
          warnings: ['Look out! Warnings!']
        }])
      });

      expect(errorListener).wasNotCalled();
      expect(warningListener).wasNotCalled();

      _.each(handlers, function(handler) {
        $.unsubscribe(handler);
      });
    });
  });
});
