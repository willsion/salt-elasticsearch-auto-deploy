// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'cloudera/chart/TimeRange',
  'cloudera/common/ScrollBarStablizer',
  'cloudera/cmf/charts/BulkTsqueryFetcher',
  'underscore'
], function(Util, TimeRange, ScrollBarStablizer, BulkTsqueryFetcher, _) {
  describe("BulkTsqueryFetcher", function() {
    function createMockPlotContainer(tsquery) {
      return {
        getTsquery: function() {
          return tsquery;
        },
        getBoundTsquery: function() {
          return tsquery;
        },
        render: jasmine.createSpy('render')
      };
    }

    var responseData = [{
      tsquery: "tsquery0",
      timeSeries: [ {
        data: [ {
          x: 0,
          y: 100
        } ],
        metadata: {
          attributes: {}
        }
      } ]
    }, {
      tsquery: "tsquery1",
      timeSeries: [ {
        data: [ {
          x: 0,
          y: 200
        } ],
        metadata: {
          attributes: {}
        }
      } ]
    }];

    var module, id="someContainer", timeRange, options, goodResponse;

    var setupRenderCall = function() {
      return {
        container: "#" + id,
        plotContainers: [
          createMockPlotContainer("tsquery0"),
          createMockPlotContainer("tsquery1"),
          createMockPlotContainer("tsquery2")
        ]
      };
    };

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      timeRange = new TimeRange(new Date(1), new Date(2));
      options = setupRenderCall();
      module = new BulkTsqueryFetcher(options);
      goodResponse = [{
        tsquery: "tsquery0",
        timeSeries: [ {
          data: [ {
            x: 0,
            y: 100
          } ],
          metadata: {
            attributes: {}
          }
        } ]
      }];
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it('renders each plot container', function() {
      spyOn(module, 'processPlotContainers');
      module.render(timeRange);
      expect(module.processPlotContainers).wasCalled();
      // plotContainers get bucketed. Check against the default size of the bucket.
      var bucketed = Math.ceil(options.plotContainers.length / 4);
      expect(module.processPlotContainers.callCount).toEqual(bucketed);
    });

    it('should invoke pre- and postRenderHooks', function() {
      spyOn(module, 'processPlotContainers').andReturn({});
      var preRenderHook = jasmine.createSpy('preRenderHook');
      var postRenderHook = jasmine.createSpy('postRenderHook');
      module.render(timeRange, preRenderHook, postRenderHook);
      expect(preRenderHook).wasCalled();
      expect(postRenderHook).wasCalled();
    });

    it('should save scroll position on render', function() {
      spyOn(ScrollBarStablizer, 'addRef');
      spyOn(ScrollBarStablizer, 'release');
      spyOn(module, 'processPlotContainers').andReturn({});
      module.render(timeRange);
      expect(ScrollBarStablizer.addRef).wasCalled();
      expect(ScrollBarStablizer.release).wasCalled();
    });

    it('defers calling postRenderHook until all plotContainers have returned', function() {
      // Make enough plot containers to cover three deferreds. At a default
      // bucket size of 4, that's 12 plotContainers.
      options.plotContainers = _.map(_.range(12), createMockPlotContainer);
      var deferreds = [
        new $.Deferred(),
        new $.Deferred(),
        new $.Deferred()
      ];
      var index = 0;
      spyOn(module, 'processPlotContainers').andCallFake(function() {
        var result = deferreds[index];
        index += 1;
        return result;
      });
      var postRenderHook = jasmine.createSpy('postRenderHook');
      module.render(timeRange, null, postRenderHook);
      expect(postRenderHook).wasNotCalled();
      deferreds[0].resolve();
      expect(postRenderHook).wasNotCalled();
      deferreds[1].resolve();
      expect(postRenderHook).wasNotCalled();
      deferreds[2].resolve();
      expect(postRenderHook).wasCalled();
    });

    it('uses correct URL and query params when processing a plotContainer', function() {
      var plotContainer = createMockPlotContainer('query1');
      module.processPlotContainers(timeRange, [plotContainer]);

      var request = mostRecentAjaxRequest();
      expect(request.url).toEqual('/cmf/charts/timeSeries');
      var params = Util.unparam(request.params);
      expect(params.startTime).toEqual('1');
      expect(params.endTime).toEqual('2');
      expect(params.updateRecent).toEqual('false');
      expect(params.tsquery).toEqual(JSON.stringify(['query1']));
    });

    it('renders the plotContainer with the response from the server', function() {
      var plotContainer = createMockPlotContainer('query1');
      goodResponse[0].tsquery = plotContainer.getBoundTsquery();
      module.processPlotContainers(timeRange, [plotContainer]);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(goodResponse)
      });
      expect(plotContainer.render).wasCalled();
      var renderArg = plotContainer.render.mostRecentCall.args[0];
      expect(_.isEqual(renderArg.timeSeries, goodResponse[0].timeSeries)).toBeTruthy();
      expect(renderArg.hasErrors).toEqual(false);
      expect(renderArg.emptySeries).toEqual(false);
    });

    it('renders multiple plotContainers with the same tsquery correctly', function() {
      var plotContainer1 = createMockPlotContainer('query1');
      var plotContainer2 = createMockPlotContainer('query1');
      goodResponse[0].tsquery = plotContainer1.getBoundTsquery();
      module.processPlotContainers(timeRange, [plotContainer1, plotContainer2]);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(goodResponse)
      });
      expect(plotContainer1.render).wasCalled();
      expect(plotContainer2.render).wasCalled();
    });

    it('processes emptySeries correctly', function() {
      var plotContainer = createMockPlotContainer('query1');
      goodResponse[0].tsquery = plotContainer.getBoundTsquery();
      module.processPlotContainers(timeRange, [plotContainer]);
      var emptyResponse = [{"errors":[],"warnings":[],"timeSeries":[],"tsquery":"query1"}];
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(emptyResponse)
      });
      expect(plotContainer.render).wasCalled();
      var renderArg = plotContainer.render.mostRecentCall.args[0];
      expect(renderArg.hasErrors).toEqual(false);
      expect(renderArg.emptySeries).toEqual(true);
    });

    it('displays server errors on the console', function() {
      spyOn(console, 'error');
      var plotContainer = createMockPlotContainer('query1');
      goodResponse[0].tsquery = plotContainer.getBoundTsquery();
      module.processPlotContainers(timeRange, [plotContainer]);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 500,
        responseText: ''
      });
      expect(plotContainer.render).wasNotCalled();
      expect(console.error).wasCalled();
      var args = console.error.mostRecentCall.args;
      expect(args[0]).toEqual('Error retrieving charts: ');
      var errorArgs = args[1];
      expect(errorArgs.length).toEqual(3);
      // Is the first arg a jqXHR?
      expect(errorArgs[0].done && errorArgs[0].error).toBeTruthy();
      // The second is a message of what we think went wrong.
      expect(errorArgs[1]).toEqual('error');
      // Optional exception object; probably falsy.
      expect(errorArgs[2]).toBeFalsy();
    });

    it('processes query errors correctly', function() {
      var plotContainer = createMockPlotContainer('query1');
      goodResponse[0].tsquery = plotContainer.getBoundTsquery();
      module.processPlotContainers(timeRange, [plotContainer]);
      var emptyResponse = [{"errors":['Error 1'],"warnings":[],"timeSeries":[],"tsquery":"query1"}];
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify(emptyResponse)
      });
      expect(plotContainer.render).wasCalled();
      var renderArg = plotContainer.render.mostRecentCall.args[0];
      expect(renderArg.hasErrors).toEqual(true);
      expect(renderArg.emptySeries).toEqual(true);
    });

    describe('errors and warnings', function() {
      var badResponseData, badResponse;

      var createMessages = function(message, index) {
        return _.map(_.range(5 * index, 5 * (index + 1)), function(i) {
          return message + ' ' + i;
        });
      };

      beforeEach(function() {
        var badResponseData = _.clone(responseData);
        // Create a response that includes errors and warnings.
        badResponseData[0].errors = createMessages('Error', 0);
        badResponseData[0].warnings = createMessages('Warning', 1);
        badResponseData[1].errors = createMessages('Error', 2);
        badResponseData[1].warnings = createMessages('Warning', 3);
        badResponse = {
          status: 200,
          responseText: JSON.stringify(badResponseData)
        };
      });

      it('should ensure errors and warnings are published', function() {
        var options = setupRenderCall();
        spyOn($, 'publish');

        // There are 3 plotContainers.
        module = new BulkTsqueryFetcher(options);
        module.render(timeRange);

        // Server only responded with two responses.
        var request = mostRecentAjaxRequest();
        request.response(badResponse);

        expect($.publish).wasCalled();
        expect($.publish.callCount === 2).toBeTruthy();
      });

      it('should not publish errors and warnings if disabled', function() {
        var options = setupRenderCall();
        options.enableFeedbackWarnings = false;
        options.enableFeedbackErrors = false;
        spyOn($, 'publish');

        module = new BulkTsqueryFetcher(options);
        module.render(timeRange);

        // Server only responded with two responses.
        var request = mostRecentAjaxRequest();
        request.response(badResponse);

        expect($.publish).wasNotCalled();
      });

      it('should not publish errors if disabled', function() {
        var options = setupRenderCall();
        options.enableFeedbackErrors = false;
        spyOn($, 'publish');

        module = new BulkTsqueryFetcher(options);
        module.render(timeRange);

        // Server only responded with two responses.
        var request = mostRecentAjaxRequest();
        request.response(badResponse);

        expect($.publish).wasCalled();
        expect($.publish.callCount === 1).toBeTruthy();
      });

      it('should not publish warnings if disabled', function() {
        var options = setupRenderCall();
        options.enableFeedbackWarnings = false;
        spyOn($, 'publish');

        module = new BulkTsqueryFetcher(options);
        module.render(timeRange);

        // Server only responded with two responses.
        var request = mostRecentAjaxRequest();
        request.response(badResponse);

        expect($.publish).wasCalled();
        expect($.publish.callCount === 1).toBeTruthy();
      });

      it('should assign each plot container an ID', function() {
        _.each(options.plotContainers, function(plotContainer) {
          expect(plotContainer._scopeId).not.toBeDefined();
        });
        module = new BulkTsqueryFetcher(options);
        module.render(timeRange);
        _.each(options.plotContainers, function(plotContainer) {
          expect(plotContainer._scopeId).toBeDefined();
        });
      });

      it('should bucket plot containers and combine their ids', function() {
        options.plotContainers = _.map(_.range(8), function(i) {
          return createMockPlotContainer('tsquery' + i);
        });
        spyOn($, 'publish');

        module = new BulkTsqueryFetcher(options);
        module.render(timeRange);

        // Server only responded with two responses.
        var request = mostRecentAjaxRequest();
        request.response(badResponse);

        expect($.publish).wasCalled();
        // Two buckets of plot containers.
        expect($.publish.callCount).toEqual(2);
        var args = $.publish.argsForCall[0];
        expect(args[0]).toEqual('chartErrorsChanged');
        var scopeIds = args[1][1].split('.');
        var plotContainerScopeIds = _.pluck(options.plotContainers, '_scopeId');
        _.each(scopeIds, function(scopeId) {
          expect(plotContainerScopeIds.indexOf(scopeId)).not.toEqual(-1);
        });
      });
    });
  });
});
