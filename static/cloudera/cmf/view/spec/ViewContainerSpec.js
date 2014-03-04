// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'underscore',
  'cloudera/Util',
  'cloudera/cmf/view/ViewContainer',
  'cloudera/chart/TimeRange'
], function(_, Util, ViewContainer, TimeRange) {
  describe("ViewContainer Tests", function() {
    var module, request, id = "viewContainer", options = {
      container: "#" + id,
      timeRange: new TimeRange(new Date(1), new Date(2)),
      timeSeriesUri: "dontcareUri",
      view: {
        name: "MyViewName",
        displayName: "My View Name",
        plots: [{
          tsquery: "foo0"
        }]
      },
      context: {
        "$FOO": "foo",
        "$BAR": "bar"
      }
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $('<div id="' + id + '"><div id="chartContainer"/></div>').appendTo(document.body);
    });

    afterEach(function() {
      module.unsubscribe();
      $("#" + id).remove();
    });

    it("should call render when a view parameter is present", function() {
      module = new ViewContainer(options);
      spyOn(module.bulkTsqueryFetcher, 'render').andCallThrough();

      module.render();

      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify([{
          tsquery: "foo0",
          timeSeries: []
        }])
      });
      expect(module.bulkTsqueryFetcher.render).wasCalled();
    });

    it("should set dimension for each container", function() {
      module = new ViewContainer(options);
      // Fake up enough of a plotContainer for this test.
      var mockPlotContainer = {
        setDimension: jasmine.createSpy('setDimension')
      };
      module.plotContainers = [mockPlotContainer];
      module.setDimension(20, 30);
      expect(mockPlotContainer.setDimension).wasCalledWith(20, 30);
      // Without this line, our afterEach will break. We don't need to verify
      // that our mockPlotContainer gets unsubscribed.
      module.plotContainers = [];
    });

    it("should return a view object", function() {
      module = new ViewContainer(options);

      var view = module.getView();
      expect(view.plots.length).toEqual(1);
      expect(view.plots[0].tsquery).toEqual("foo0");
    });

    it("should call render when the timeSelectionChanged event is fired", function() {
      module = new ViewContainer(options);

      spyOn(module, "render");
      var newRange = new TimeRange(new Date(2), new Date(3));
      $.publish("timeSelectionChanged", [newRange]);
      expect(module.timeRange.equals(newRange)).toBeTruthy();
      expect(module.render).wasCalled();
    });

    it("should not call render when the totalTimeRangeChanged event is fired", function() {
      module = new ViewContainer(options);

      spyOn(module, "render");
      var newRange = new TimeRange(new Date(2), new Date(4));
      $.publish("totalTimeRangeChanged", [newRange]);
      expect(module.render).wasNotCalled();
    });

    it("should call removePlot", function() {
      var plot = {
        tsquery: "SOME QUERY"
      };
      var $chartContainer = $("#chartContainer");
      var called = false;
      var callback = function() {
        called = true;
      };
      var plotJson = JSON.stringify(plot);

      module = new ViewContainer(options);
      spyOn($, "post").andCallThrough();

      $.publish("removePlot", [plot, $chartContainer, callback]);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK"
        })
      });

      expect($.post).wasCalled();
      expect($.post.mostRecentCall.args[1].plotJson).toEqual(plotJson);
      expect(called).toBeTruthy();
    });

    it("should call editPlot", function() {
      var plot = {
        tsquery: "A QUERY"
      };
      var $chartContainer = $("#chartContainer");
      spyOn(Util, "getWindowLocation").andReturn("currentUrl");
      spyOn(Util, "setWindowLocation");
      module = new ViewContainer(options);

      $.publish("editPlot", [plot, $chartContainer]);

      var params = $.param({
        tsquery: 'A QUERY',
        viewName: 'MyViewName',
        returnUrl: 'currentUrl',
        mode: 'edit',
        context: '{"$FOO":"foo","$BAR":"bar"}'
      });

      expect(Util.setWindowLocation).wasCalledWith("/cmf/views/search?" + params);
    });

    it("should call clonePlot", function() {
      var plot = {
        tsquery: "SOME QUERY"
      };
      var $chartContainer = $("#chartContainer");
      spyOn(Util, "setWindowLocation");
      module = new ViewContainer(options);

      $.publish("clonePlot", [plot, $chartContainer]);

      var params = $.param({
        tsquery: 'SOME QUERY',
        context: '{"$FOO":"foo","$BAR":"bar"}'
      });

      expect(Util.setWindowLocation).wasCalledWith("/cmf/views/search?" + params);
    });

    it('should only enable warnings and errors if enabled', function() {
      // Have to clean up after ourselves.
      var handlers = [];

      var errorsListener = jasmine.createSpy('errorsListener');
      var warningsListener = jasmine.createSpy('warningsListener');
      handlers.push($.subscribe('chartErrorsChanged', errorsListener));
      handlers.push($.subscribe('chartWarningsChanged', warningsListener));

      module = new ViewContainer(options);
      module.render();

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify([{
          tsquery: 'tsquery0',
          timeSeries: [],
          errors: ['catpants'],
          warnings: ['doggyhat']
        }])
      });

      expect(errorsListener).wasCalled();
      expect(warningsListener).wasCalled();

      errorsListener.reset();
      warningsListener.reset();
      module.unsubscribe();
      options.enableFeedback = false;
      clearAjaxRequests();
      module = new ViewContainer(options);

      module.render();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify([{
          tsquery: 'tsquery0',
          timeSeries: [],
          errors: ['catpants'],
          warnings: ['doggyhat']
        }])
      });

      expect(errorsListener).wasNotCalled();
      expect(warningsListener).wasNotCalled();

      // Clean up our subscriptions.
      _.each(handlers, function(handler) {
        $.unsubscribe(handler);
      });
    });

    it("should test enableSelection", function() {
      var newOptions = $.extend({}, options, {
        enableSelection: true
      });
      module = new ViewContainer(newOptions);
      expect($("#" + id).find(".plot-container").hasClass("selectable")).toBeTruthy();
    });

    it("should test searchChanged event", function() {
      module = new ViewContainer(options);
      var mockPlotContainer = {
        setFilter: jasmine.createSpy('setFilter')
      };
      module.plotContainers = [mockPlotContainer];
      $.publish("searchChanged", ["My New Filter"]);
      expect(mockPlotContainer.setFilter).wasCalledWith("New Filter");
      // Without this line, our afterEach will break. We don't need to verify
      // that our mockPlotContainer gets unsubscribed.
      module.plotContainers = [];
    });
  });
});
