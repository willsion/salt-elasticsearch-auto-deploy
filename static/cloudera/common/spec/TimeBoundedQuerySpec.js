// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/TimeBoundedQuery',
  'cloudera/events/EventFilter',
  'cloudera/Util',
  'cloudera/common/TimeUtil'
], function(TimeBoundedQuery, EventFilter, Util, TimeUtil) {
  describe('TimeBoundedQuery', function() {

    var startTime = new Date();
    var endTime = new Date(startTime.getTime() - 60 * 60 * 1000);
    var filter1 = new EventFilter('filter1Property', 'EQ', 'filter1');
    var filter2 = new EventFilter('filter2Property', 'EQ', 'filter2');
    
    it('defines attributes', function() {
      expect(TimeBoundedQuery).toBeDefined();
      var query = new TimeBoundedQuery(startTime, endTime, [filter1, filter2], 0, 50);
      expect(query.startTime).toEqual(startTime);
      expect(query.endTime).toEqual(endTime);
      expect(query.filters.length).toEqual(2);
      expect(query.filters[0]).toEqual(filter1);
      expect(query.filters[1]).toEqual(filter2);
      expect(query.offset).toEqual(0);
      expect(query.limit).toEqual(50);
    });

    it('has sensible constructor defaults', function() {
      var query = new TimeBoundedQuery();
      expect(query.startTime).toBeTruthy();
      expect(query.endTime).toBeTruthy();
      expect(query.filters).toBeDefined();
      expect(query.filters.length).toEqual(0);
      expect(query.offset).toEqual(0);
      expect(query.limit).toEqual(50);
    });

    it('gets the adjusted server time for start and end time', function() {
      spyOn(TimeUtil, 'getServerNow');
      var query = new TimeBoundedQuery();
      expect(TimeUtil.getServerNow).wasCalled();
    });

    it('can turn its attributes into params correctly', function() {
      var query = new TimeBoundedQuery(startTime, endTime, [filter1, filter2]);
      var params = query.getParams();
      expect(params.startTime).toEqual(startTime.getTime());
      expect(params.endTime).toEqual(endTime.getTime());
      var expectedFilters = JSON.stringify([filter1, filter2]);
      expect(params.filters).toEqual(expectedFilters);
      expect(params.offset).toEqual(0);
      expect(params.limit).toEqual(50);
    });

    it('will validate its parameters', function() {
      var query = new TimeBoundedQuery();
      query.startTime = NaN;
      query.endTime = NaN;
      expect(query.isValid()).toBeFalsy();
      query.startTime = new Date();
      query.endTime = new Date();
      expect(query.isValid()).toBeTruthy();
    });

    it('knows if a query is in-flight', function() {
      var query = new TimeBoundedQuery();
      query.execute('eventsUrl', {});
      expect(query.isInflight()).toBeTruthy();
    });

    it('can abort when nothing is in-flight with no error', function() {
      var query = new TimeBoundedQuery();
      query.abort();
    });

    it('can abort an in-flight query', function() {
      var query = new TimeBoundedQuery();
      query.execute('eventsUrl', {});
      spyOn(query.jqXHR, 'abort');
      query.abort();
      expect(query.jqXHR.abort).wasCalled();
    });

    it('will not execute a query with one already in-flight', function() {
      spyOn($, 'ajax');
      var query = new TimeBoundedQuery();
      spyOn(query, 'isInflight').andReturn(true);
      query.execute('eventsUrl', {});
      expect($.ajax).wasNotCalled();
    });

    it('will not execute a query with invalid parameters', function() {
      spyOn($, 'ajax');
      var query = new TimeBoundedQuery();
      query.startTime = NaN;
      query.endTime = NaN;
      query.execute('eventsUrl', {});
      expect($.ajax).wasNotCalled();
    });

    it('returns the jqXHR object from its execute method', function() {
      var query = new TimeBoundedQuery(startTime, endTime);
      jasmine.Ajax.useMock();
      var result = query.execute('testUrl', {});
      // How to prove it's a jqXHR? Look for some functions.
      expect(result.done).toBeDefined();
      expect(result.fail).toBeDefined();
      expect(result.always).toBeDefined();
    });

    describe('server communication', function() {

      var query, handlers, request;

      var testUrl = 'eventsUrl';

      beforeEach(function() {
        jasmine.Ajax.useMock();
        query = new TimeBoundedQuery(startTime, endTime, [filter1, filter2]);
        handlers = {
          success: jasmine.createSpy('success'),
          error: jasmine.createSpy('error'),
          complete: jasmine.createSpy('complete')
        };
        query.execute(testUrl, handlers);
        request = mostRecentAjaxRequest();
      });

      it('will construct the correct URL', function() {
        var url = request.url;
        var parts = url.split('?');
        expect(parts[0]).toEqual('eventsUrl');
        var params = Util.unparam(parts[1]);
        expect(params.startTime).toEqual(String(startTime.getTime()));
        expect(params.endTime).toEqual(String(endTime.getTime()));
        expect(params.filters).toEqual(JSON.stringify([filter1, filter2]));
        expect(params.offset).toEqual('0');
        expect(params.limit).toEqual('50');
      });

      it('calls the right handlers during success', function() {
        request.response({
          status: 200,
          responseText: JSON.stringify({ stuff: 'catpants' })
        });
        expect(handlers.success).wasCalled();
        expect(handlers.error).wasNotCalled();
        expect(handlers.complete).wasCalled();
      });

      it('calls the right handlers during an error', function() {
        request.response({
          status: 404
        });
        expect(handlers.success).wasNotCalled();
        expect(handlers.error).wasCalled();
        expect(handlers.complete).wasCalled();
      });
    });
  });
});
