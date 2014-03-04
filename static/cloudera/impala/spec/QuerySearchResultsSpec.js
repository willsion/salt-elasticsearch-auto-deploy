// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/impala/QuerySearchResults',
  'cloudera/common/UrlParams',
  'cloudera/Util',
  'underscore'
], function(QuerySearchResults, UrlParams, Util, _) {
  describe('QuerySearchResults', function() {
    var querySearchResults, options, $queriesContainer;

    var createFakeQuery = function(i) {
      var fakeQuery = {
        startTime: {
          millis: i + 1000
        },
        endTime: {
          millis: i + 2000
        },
        duration: {
          millis: i + 3000
        }
      };
      if (i >= 10) {
        fakeQuery.endTime = null;
      }
      return fakeQuery;
    };

    beforeEach(function() {
      $queriesContainer = $('<div></div>').appendTo(document.body);

      options = {
        queriesContainer: $queriesContainer[0],
        executingQueriesUrl: 'get/those/executing/queries',
        completedQueriesUrl: 'get/those/completed/queries',
        cancelQueryUrl: 'cancel/that/query',
        serviceName: 'testServiceName',
        queryDetailsUrl: 'i/want/some/details',
        orderingProperty: 'ordering'
      };
      jasmine.Ajax.useMock();
      querySearchResults = new QuerySearchResults(options);
    });

    it('exposes the query it uses', function() {
      expect(querySearchResults.query).toBeDefined();
    });

    describe('canceling a query', function() {
      it('works at all', function() {
        querySearchResults.cancelQuery({
          queryId: 'catpants'
        });
        var request = mostRecentAjaxRequest();
        expect(request.url).toEqual(options.cancelQueryUrl);
      });

      it('handles failure response from server', function() {
        spyOn($, 'publish');
        querySearchResults.cancelQuery({
          queryId: 'catpants'
        });
        var request = mostRecentAjaxRequest();
        request.response({
          status: 500,
          responseText: ''
        });
        expect($.publish).wasCalled();
        var args = $.publish.argsForCall[0];
        expect(args[0]).toEqual('chartErrorsChanged');
        expect(args[1][0]).toEqual('error');
      });

      it('handles errors and warnings from the server', function() {
        spyOn($, 'publish');
        var canceled = jasmine.createSpy('canceled');
        querySearchResults.cancelQuery({
          queryId: 'catpants'
        });
        var request = mostRecentAjaxRequest();
        // Check out ImpalaCancelQueryResponse.java for the structure
        // of what comes back here.
        request.response({
          status: 200,
          responseText: JSON.stringify({
            errors: ['error!'],
            warnings: ['warning!']
          })
        });
        expect($.publish.callCount).toEqual(2);
        var args = $.publish.argsForCall[0];
        expect(args[0]).toEqual('chartWarningsChanged');
        expect(args[1][0]).toEqual(['warning!']);
        args = $.publish.argsForCall[1];
        expect(args[0]).toEqual('chartErrorsChanged');
        expect(args[1][0]).toEqual(['error!']);
      });

      it('clears out errors and warnings if none come back', function() {
        spyOn($, 'publish');
        querySearchResults.cancelQuery({
          queryId: 'catpants'
        });
        var request = mostRecentAjaxRequest();
        // Check out ImpalaCancelQueryResponse.java for the structure
        // of what comes back here.
        request.response({
          status: 200,
          responseText: JSON.stringify({
            errors: [],
            warnings: []
          })
        });
        expect($.publish.callCount).toEqual(2);
        var args = $.publish.argsForCall[0];
        expect(args[0]).toEqual('chartWarningsChanged');
        expect(args[1][0]).toEqual([]);
        args = $.publish.argsForCall[1];
        expect(args[0]).toEqual('chartErrorsChanged');
        expect(args[1][0]).toEqual([]);
      });

      it('sets canceled to true if no errors or warnings', function() {
        var canceled = jasmine.createSpy('canceled');
        querySearchResults.cancelQuery({
          queryId: 'catpants',
          canceled: canceled
        });
        var request = mostRecentAjaxRequest();
        // Check out ImpalaCancelQueryResponse.java for the structure
        // of what comes back here.
        request.response({
          status: 200,
          responseText: JSON.stringify({
            error: null,
            warning: null
          })
        });
        expect(canceled).wasCalledWith(true);
      });
    });

    describe('viewDetails', function() {
      var query = {
        queryId: 'fakeQueryId',
        runtimeProfileAvailable: false
      };

      beforeEach(function() {
        spyOn(Util, 'setWindowLocation');
      });

      it('only works for queries that have a runtime profile available', function() {
        querySearchResults.viewDetails(query);
        expect(Util.setWindowLocation).wasNotCalled();
      });

      it('navigates to view details page', function() {
        query.runtimeProfileAvailable = true;
        querySearchResults.viewDetails(query);
        expect(Util.setWindowLocation).wasCalledWith(
          'i/want/some/details?queryId=fakeQueryId');
      });

      it('escapes queryId', function() {
        query.queryId = 'something that needs escaping';
        querySearchResults.viewDetails(query);
        expect(Util.setWindowLocation).wasCalledWith(
          'i/want/some/details?queryId=something%20that%20needs%20escaping');
      });
    });

    it('passes through setDates to query', function() {
      spyOn(querySearchResults.query, 'setDates');
      querySearchResults.setDates(new Date(1000), new Date(2000), false);
      expect(querySearchResults.query.setDates).wasCalledWith(
        new Date(1000), new Date(2000), false);
    });

    it('adds properties to individual queries', function() {
      var prepareData = QuerySearchResults.prepareData;
      var fakeData = {
        queries: _.map(_.range(7, 13), createFakeQuery)
      };
      prepareData(fakeData);
      _.each(fakeData.queries, function(query, i) {
        expect(query.startTimeMillis).toEqual(1007 + i);
        // The createFakeQuery method sets any query with an index higher
        // than 9 as running. Our starting index in generating the data
        // is 7. 10 - 7 = 3, so that's what we test on.
        if (i < 3) {
          expect(query.endTimeMillis).toEqual(2007 + i);
        } else {
          expect(query.endTime).toEqual(null);
        }
        expect(query.durationMillis).toEqual(3007 + i);
        expect(query.isRunning).toEqual(i >= 3);
        expect(_.isFunction(query.viewDetails)).toBeTruthy();
      });
    });

    it('adds cancel method with confirmation dialog to query', function() {
      spyOn(querySearchResults, 'cancelQuery');
      var prepareData = QuerySearchResults.prepareData;
      var fakeData = {
        queries: [createFakeQuery(7)]
      };
      prepareData(fakeData);
      var query = fakeData.queries[0];
      spyOn($, 'publish');
      query.cancel();
      expect($.publish).wasCalled();
      var args = $.publish.mostRecentCall.args;
      expect(args[0]).toEqual('showConfirmation');
      var messageArgs = args[1];
      expect(messageArgs[0]).toEqual('ui.impala.confirmCancel');
      messageArgs[1]();
      expect(querySearchResults.cancelQuery).wasCalled();
    });

    it('loads data by deferring to SearchResults', function() {
      spyOn(querySearchResults.searchResults, 'loadData');
      querySearchResults.loadData(true);
      expect(querySearchResults.searchResults.loadData).wasCalledWith(true);
    });

    it('provides feedback based on server response', function() {
      var success = null;
      runs(function() {
        spyOn($, 'publish');
        spyOn(querySearchResults.query, 'execute').andCallFake(function(handlers) {
          success = handlers.success;
        });
        querySearchResults.loadData(true);        
      });
      waitsFor(function() {
        return success;
      });
      runs(function() {
        success({
          warnings: ['catpants'],
          errors: ['horsepoo'],
          queries: []
        });
        expect($.publish.callCount).toEqual(2);
        // Warnings.
        var args = $.publish.argsForCall[0];
        expect(args[0]).toEqual('chartWarningsChanged');
        expect(args[1][0]).toEqual(['catpants']);
        expect(args[1][1]).toEqual('impala-query-list');
        // Errors.
        args = $.publish.argsForCall[1];
        expect(args[0]).toEqual('chartErrorsChanged');
        expect(args[1][0]).toEqual(['horsepoo']);
        expect(args[1][1]).toEqual('impala-query-list');
      });
    });

    describe('onSuccess', function() {
      beforeEach(function() {
        Util.unsubscribe(querySearchResults);
        options.onSuccess = jasmine.createSpy('onSuccess');
        querySearchResults = new QuerySearchResults(options);
      });

      it('calls onSuccess handler on success', function() {
        var success = null;
        runs(function() {
          spyOn(querySearchResults.query, 'execute').andCallFake(function(handlers) {
            success = handlers.success;
          });
          querySearchResults.loadData(true);
        });
        waitsFor(function() {
          return success;
        });
        runs(function() {
          success({
            warnings: [],
            errors: [],
            queries: []
          });
          expect(options.onSuccess).wasCalled();
        });
      });

      it('does not call onSuccess if there were errors', function() {
        var success = null;
        runs(function() {
          spyOn(querySearchResults.query, 'execute').andCallFake(function(handlers) {
            success = handlers.success;
          });
          querySearchResults.loadData(true);
        });
        waitsFor(function() {
          return success;
        });
        runs(function() {
          success({
            warnings: [],
            errors: ['error!'],
            queries: []
          });
          expect(options.onSuccess).wasNotCalled();
        });
      });
    });
  });
});
