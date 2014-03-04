// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
/*global ajaxRequests: true */
define([
  'cloudera/impala/ImpalaSearchQuery',
  'cloudera/common/TimeUtil',
  'underscore'
], function(ImpalaSearchQuery, TimeUtil, _) {
  describe('ImpalaSearchQuery', function() {
    var options;

    beforeEach(function() {
      options = {
        executingQueriesUrl: '/executingQueries',
        completedQueriesUrl: '/completedQueries',
        limit: 500
      };
    });

    it('sets startTime and endTime using getServerNow', function() {
      spyOn(TimeUtil, 'getServerNow').andReturn(new Date(1000));
      var query = new ImpalaSearchQuery(options);
      expect(TimeUtil.getServerNow).wasCalled();
      expect(query.startTime).toEqual(new Date(1000));
      expect(query.endTime).toEqual(new Date(1000));
    });

    it('maintains isCurrentMode property', function() {
      var query = new ImpalaSearchQuery(options);
      expect(query.isCurrentMode).toBeTruthy();
    });

    it('offers method to set dates and current mode', function() {
      var query = new ImpalaSearchQuery(options);
      query.setDates(new Date(1000), new Date(2000));
      expect(query.startTime).toEqual(new Date(1000));
      expect(query.endTime).toEqual(new Date(2000));
      expect(query.isCurrentMode).toBeTruthy();

      // Set isCurrentMode explicitly.
      query.setDates(new Date(1000), new Date(2000), false);
      expect(query.isCurrentMode).toBeFalsy();
    });

    it('starts with filters undefined', function() {
      var query = new ImpalaSearchQuery(options);
      expect(query.filters).toEqual(undefined);
    });

    it('calls onStart and onEnd during execution', function() {
      options.onStart = jasmine.createSpy('onStart');
      options.onEnd = jasmine.createSpy('onEnd');
      var query = new ImpalaSearchQuery(options);
      jasmine.Ajax.useMock();
      // Let's simplify and have one request.
      query.isCurrentMode = false;

      query.execute({
        success: jasmine.createSpy()
      });

      expect(options.onStart).wasCalled();
      expect(options.onEnd).wasNotCalled();
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: ''
      });
      expect(options.onEnd).wasCalled();
    });

    describe('execute', function() {
      var query, handlers, executingRequest, completedRequest;

      var emptyResponse = {
        status: 200,
        responseText: JSON.stringify({
          errors: [],
          warnings: [],
          queries: []
        })
      };

      var errorResponse = {
        status: 500,
        responseText: JSON.stringify({})
      };

      var makeFakeData = function(from, to) {
        return _.map(_.range(from, to), function(index) {
          return {
            index: index
          };
        });
      };

      beforeEach(function() {
        jasmine.Ajax.useMock();
        // Since we're using the global ajaxRequests array and need to know
        // the position of each request, let's clear out the ajaxRequests
        // array in between each test.
        clearAjaxRequests();
        // Create the spy handlers.
        handlers = {
          success: jasmine.createSpy('success'),
          error: jasmine.createSpy('error'),
          complete: jasmine.createSpy('complete')
        };
        query = new ImpalaSearchQuery(options);
        query.execute(handlers);
        executingRequest = ajaxRequests[0];
        completedRequest = ajaxRequests[1];
      });

      it('sends filters even if blank', function() {
        // Verify that the filters param showed up regardless; it is required.
        expect(query.filters).toEqual(undefined);
        expect(executingRequest.url.indexOf('filters=&') !== -1).toBeTruthy();
        expect(completedRequest.url.indexOf('filters=&') !== -1).toBeTruthy();
      });

      it('handles inflight queries gracefully', function() {
        // query.execute was called in the beforeEach, which means that a query
        // is inflight. Since we're not calling abort first, if we call execute
        // again then the TimeBoundedQuery objects' execute methods will both
        // return undefined (their behavior in the case of an inflight query).
        // WorkSearchQuery should handle this case gracefully.
        query.execute(handlers);
        expect(handlers.success).wasNotCalled();
        expect(handlers.error).wasNotCalled();
        expect(handlers.complete).wasCalled();
      });

      it('does not make executing queries request if not in current mode', function() {
        query.abort();
        query.isCurrentMode = false;
        clearAjaxRequests();
        query.execute(handlers);
        expect(ajaxRequests.length).toEqual(1);
        var request = mostRecentAjaxRequest();
        expect(request.url).toContain(options.completedQueriesUrl);

        // Verify success handler works.
        request.response(emptyResponse);
        expect(handlers.success).wasCalled();
      });

      it('does okay if there are no success or complete handlers', function() {
        query.abort();
        clearAjaxRequests();
        handlers = {};
        query.execute(handlers);
        executingRequest = ajaxRequests[0];
        completedRequest = ajaxRequests[1];
        executingRequest.response(emptyResponse);
        completedRequest.response(emptyResponse);
        // If this test doesn't blow up, then we did okay.
      });

      it('does okay if there is not an error handler', function() {
        query.abort();
        clearAjaxRequests();
        handlers = {};
        query.execute(handlers);
        executingRequest = ajaxRequests[0];
        completedRequest = ajaxRequests[1];
        executingRequest.response(errorResponse);
        completedRequest.response(emptyResponse);
        // If this test doesn't blow up, then we did okay.
      });

      it('fires the success handler on both success', function() {
        executingRequest.response(emptyResponse);
        completedRequest.response(emptyResponse);
        expect(handlers.success).wasCalled();
        expect(handlers.error).wasNotCalled();
        expect(handlers.complete).wasCalled();
      });

      it('fires the error handler on one failure', function() {
        executingRequest.response(errorResponse);
        completedRequest.response(emptyResponse);
        expect(handlers.success).wasNotCalled();
        expect(handlers.error).wasCalled();
        expect(handlers.complete).wasCalled();

        // Verify arguments to failure handler.
        var args = handlers.error.mostRecentCall.args;
        // Is the first a jqXHR?
        expect(args[0].then).toBeDefined();
        // Second should be the text status.
        expect(args[1]).toEqual('error');

        // Verify arguments to complete handler.
        args = handlers.complete.mostRecentCall.args;
        // Is the first a jqXHR?
        expect(args[0].then).toBeDefined();
        // Second should be the text status.
        expect(args[1]).toEqual('error');
      });

      it('fires the error handler on other failure', function() {
        executingRequest.response(emptyResponse);
        completedRequest.response(errorResponse);
        expect(handlers.success).wasNotCalled();
        expect(handlers.error).wasCalled();
        expect(handlers.complete).wasCalled();
      });

      it('splices executing and completed queries together', function() {
        executingRequest.response({
          status: 200,
          responseText: JSON.stringify({
            errors: makeFakeData(20, 25),
            warnings: makeFakeData(40, 45),
            queries: makeFakeData(0, 5)
          })
        });
        completedRequest.response({
          status: 200,
          responseText: JSON.stringify({
            errors: makeFakeData(25, 30),
            warnings: makeFakeData(45, 50),
            queries: makeFakeData(5, 10)
          })
        });
        expect(handlers.success).wasCalled();
        var data = handlers.success.argsForCall[0][0];
        expect(data).toBeDefined();
        expect(data.queries).toBeDefined();
        expect(data.errors).toBeDefined();
        expect(data.warnings).toBeDefined();
        var queries = data.queries;
        expect(queries.length).toEqual(10);
        _.each(queries, function(query, i) {
          expect(query.index).toEqual(i);
        });
        var errors = data.errors;
        expect(errors.length).toEqual(10);
        _.each(errors, function(error, i) {
          expect(error.index).toEqual(i + 20);
        });
        var warnings = data.warnings;
        expect(warnings.length).toEqual(10);
        _.each(warnings, function(warning, i) {
          expect(warning.index).toEqual(i + 40);
        });

        // Verify the arguments to the complete handler.
        var args = handlers.complete.mostRecentCall.args;
        expect(args[0].queries).toBeDefined();
        expect(args[0].errors).toBeDefined();
        expect(args[0].warnings).toBeDefined();
        expect(args[1]).toEqual('success');
      });
    });
  });
});
