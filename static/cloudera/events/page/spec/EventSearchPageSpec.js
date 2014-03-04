// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/events/page/EventSearchPage',
  'cloudera/common/UrlParams',
  'cloudera/Util',
  'underscore'
], function(EventSearchPage, UrlParams, Util, _) {
  describe('EventSearchPage', function() {
    var $filterElement, $listElement, options;
    var eventSearchPage, searchFilters, searchResults;

    // Simulated data from the server.
    var makeTestData = function(length) {
      var results = [];
      _.times(length, function() {
        results.push({
          timestamp: 1348766817260 + (1000000 * results.length),
          attributes: []
        });
      });
      return results;
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      $filterElement = $('<div></div>').appendTo($('body'));
      $listElement = $('<div></div>').appendTo($('body'));
      options = {
        filtersElem: $filterElement[0],
        resultsElem: $listElement[0],
        queryUrl: 'historyUrl',
        filtersUrl: 'filtersUrl'
      };
      eventSearchPage = new EventSearchPage(options);
      searchFilters = eventSearchPage.searchFilters;
      searchResults = eventSearchPage.searchResults;
    });

    afterEach(function() {
      Util.unsubscribe(eventSearchPage);
      $filterElement.remove();
      $listElement.remove();
    });

    it('has some attributes', function() {
      expect(eventSearchPage.searchFilters).toBeDefined();
      expect(eventSearchPage.searchResults).toBeDefined();
      expect(eventSearchPage.subscriptionHandles).toBeDefined();
    });

    it('has a sensible default state upon construction', function() {
      expect(searchResults.loading()).toBeTruthy();
      expect(eventSearchPage.subscriptionHandles.length).toEqual(1);
    });

    it('syncs loading between SearchResults and SearchFilters', function() {
      expect(searchResults.loading()).toBeTruthy();
      expect(searchFilters.loading()).toBeTruthy();
      searchResults.loading(false);
      expect(searchFilters.loading()).toBeFalsy();
    });

    it('takes the right steps when searching', function() {
      var appliedFilters = { test: 'catpants '};
      spyOn(searchFilters, 'getAppliedFilters').andReturn(appliedFilters);
      spyOn(searchResults, 'loadData');
      spyOn(eventSearchPage, 'updateUrlParamsFromQuery');
      eventSearchPage.query.offset = 200;

      eventSearchPage.search();

      expect(searchResults.loadData).wasCalledWith(true);
      expect(eventSearchPage.query.filters).toEqual(appliedFilters);
      expect(eventSearchPage.updateUrlParamsFromQuery).wasCalled();
      expect(eventSearchPage.query.offset).toEqual(0);
    });

    it('updates the query object based on the location hash', function() {
      var index = 0;
      spyOn(UrlParams, 'getInt').andCallFake(function() {
        return index++;
      });
      spyOn(UrlParams, 'get').andCallFake(function() {
        return index++;
      });
      eventSearchPage.updateQueryFromUrlParams();
      var query = eventSearchPage.query;
      expect(query.startTime.getTime()).toEqual(0);
      expect(query.endTime.getTime()).toEqual(1);
      expect(query.offset).toEqual(2);
      expect(query.limit).toEqual(3);
      expect(query.filters).toEqual(4);
    });

    it('will not update url hash if there are no filters', function() {
      var testData = [];
      eventSearchPage.query.filters = testData;
      spyOn(UrlParams, 'set');
      spyOn(UrlParams, 'remove');
      eventSearchPage.updateUrlParamsFromQuery();
      expect(UrlParams.set).wasNotCalled();
      expect(UrlParams.remove).wasCalledWith('filters');
    });

    it('updates url params from the query which updates the url hash', function() {
      var testData = [{
        cat: 'pants'
      }, {
        dog: 'hat'
      }];
      eventSearchPage.query.filters = testData;
      spyOn(UrlParams, 'set');
      eventSearchPage.updateUrlParamsFromQuery();
      expect(UrlParams.set).wasCalled();
      var args = UrlParams.set.mostRecentCall.args;
      expect(args[0]).toEqual('filters');
      expect(args[1]).toEqual(JSON.stringify(testData));
    });

    it('presents errors, if any, to the user', function() {
      var mockServerResponse = {
        errors: ['catpants'],
        // Events will be ignored because of errors.
        events: [{
          data: 'stuff'
        }, {
          otherData: 'other stuff'
        }]
      };
      spyOn(eventSearchPage.searchResults, 'errors');
      var results = eventSearchPage.getResults(mockServerResponse);
      // No results handed back because of the errors.
      expect(results).toBeFalsy();
      expect(eventSearchPage.searchResults.errors).wasCalledWith(['catpants']);

      mockServerResponse = {
        errors: [],
        events: [{}]
      };
      results = eventSearchPage.getResults(mockServerResponse);
      // Don't care so much what came back, only that something did because
      // there were no errors.
      expect(results).toBeTruthy();
    });

    describe('rebuildFilters', function() {
      beforeEach(function() {
        spyOn(eventSearchPage, 'updateQueryFromUrlParams');
      });

      it('does nothing if there are no filters in the URL', function() {
        spyOn(UrlParams, 'get').andReturn('[]');
        spyOn(eventSearchPage, 'rebuildFilter');
        eventSearchPage.rebuildFilters();
        expect(eventSearchPage.rebuildFilter).wasNotCalled();
        expect(eventSearchPage.updateQueryFromUrlParams).wasCalled();
      });

      it('appends no filters if they do not generate a FilterModel', function() {
        spyOn(UrlParams, 'get').andReturn(JSON.stringify([{
          cat: 'pants'
        }]));
        spyOn(eventSearchPage, 'rebuildFilter').andReturn(undefined);
        spyOn(searchFilters, 'insertFilter');
        eventSearchPage.rebuildFilters();
        expect(eventSearchPage.rebuildFilter).wasCalled();
        expect(searchFilters.insertFilter).wasNotCalled();
      });

      it('appends filters found in the URL', function() {
        spyOn(UrlParams, 'get').andReturn(JSON.stringify([{
          cat: 'pants'
        }]));
        var dummyFilter = { dummy: 'property' };
        spyOn(eventSearchPage, 'rebuildFilter').andReturn(dummyFilter);
        spyOn(searchFilters, 'insertFilter');
        eventSearchPage.rebuildFilters();
        expect(eventSearchPage.rebuildFilter).wasCalled();
        expect(searchFilters.insertFilter).wasCalledWith(dummyFilter);
        expect(eventSearchPage.updateQueryFromUrlParams).wasCalled();
      });

      it('will not allow searches until deferred is resolved', function() {
        var dummyFilter = { dummy: 'property' };
        spyOn(eventSearchPage, 'rebuildFilter').andReturn(dummyFilter);
        spyOn(searchFilters, 'insertFilter');
        spyOn(eventSearchPage.query, 'execute');
        eventSearchPage.executeQuery();
        expect(eventSearchPage.query.execute).wasNotCalled();
        eventSearchPage.rebuildFilters();
        expect(eventSearchPage.query.execute).wasCalled();
      });

    });

    describe('rebuildFilter', function() {
      var testFilter = {
        propertyName: 'propertyName',
        compareType: 'compareType',
        value: 'value'
      };

      it('does nothing if filter not found in known filters', function() {
        spyOn(searchFilters, 'findFilter').andReturn(null);
        var result = eventSearchPage.rebuildFilter(testFilter);
        expect(result).not.toBeDefined();
      });

      it('does nothing if matching compareType not found', function() {
        spyOn(searchFilters, 'findFilter').andReturn({
          compareTypes: [{
            name: 'badCompare1'
          }, {
            name: 'badCompare2'
          }]
        });
        var result = eventSearchPage.rebuildFilter(testFilter);
        expect(result).not.toBeDefined();
      });

      it('works for filters with "values" property too', function() {
        var valuesFilter = {
          propertyName: 'propertyName',
          compareType: 'compareType',
          values: ['value1', 'value2']
        };
        var foundCompareType = {
          name: valuesFilter.compareType
        };
        var foundFilter = {
          compareTypes: [foundCompareType]
        };
        spyOn(searchFilters, 'findFilter').andReturn(foundFilter);
        var result = eventSearchPage.rebuildFilter(valuesFilter);
        expect(result).toBeDefined();
        expect(result.filter()).toEqual(foundFilter);
        expect(result.compareType()).toEqual(foundCompareType);
        expect(result.value()).toEqual('value1,value2');
      });

      it('supports changing the filter later', function() {
        // Very specfic test. If the instance of FilterModel created
        // in this method isn't given a FilterViewModel instance here
        // then changing the filters later by setting the filter
        // observable doesn't work.
        var valuesFilter = {
          propertyName: 'propertyName',
          compareType: 'compareType',
          values: ['value1', 'value2']
        };
        var foundCompareType = {
          name: valuesFilter.compareType
        };
        var foundFilter = {
          compareTypes: [foundCompareType]
        };
        spyOn(searchFilters, 'findFilter').andReturn(foundFilter);
        var result = eventSearchPage.rebuildFilter(valuesFilter);
        expect(result).toBeDefined();
        // Now change the filter by setting its name. This should
        // trigger a lookup of all the filters.
        result.filterName('propertyName2');
      });
    });

    describe('onRetrieveHistorySuccess callback', function() {
      var mockEventSearch = {
        length: jasmine.createSpy(),
        append: jasmine.createSpy(),
        prepend: jasmine.createSpy(),
        getHead: jasmine.createSpy(),
        getTail: jasmine.createSpy()
      }, mockData;

      var successHandler;

      var makeSuccessHandler = function() {
        successHandler = eventSearchPage.makeOnRetrieveHistorySuccess(false, mockEventSearch);
      };

      beforeEach(function() {
        mockData = [1, 2, 3];
        mockEventSearch.length.andReturn(0);
        makeSuccessHandler();
      });

      it('does nothing if another request has come in before it', function() {
        // Increments the internal state so that a call to the callback
        // won't apply the data.
        eventSearchPage.search();
        successHandler(mockData);
        expect(mockEventSearch.append).wasNotCalled();
      });

      it('does nothing if no data came back', function() {
        successHandler(null);
        expect(mockEventSearch.append).wasNotCalled();
      });

      it('does nothing if data has length 0', function() {
        successHandler([]);
        expect(mockEventSearch.append).wasNotCalled();
      });

      it('does nothing if event lengths do not match', function() {
        mockEventSearch.length.andReturn(5);
        successHandler(mockData);
        expect(mockEventSearch.append).wasNotCalled();
      });

      it('appends events if there were none to begin with', function() {
        var testData = makeTestData(5);
        successHandler(testData);
        expect(mockEventSearch.append).wasCalled();
        expect(mockEventSearch.getTail).wasNotCalled();
      });

      it('appends data if response from server is older than current oldest', function() {
        mockEventSearch.length.andReturn(5);
        // Set initial length.
        makeSuccessHandler();
        var testData = makeTestData(3);
        mockEventSearch.getTail.andReturn({
          timestamp: testData[2].timestamp + 1000000
        });
        successHandler(testData);
        expect(mockEventSearch.append).wasCalled();
      });

      // This test is more about coverage than it is about testing
      // the underlying logic. So, crummy test. It's true purpose is to
      // provide a scaffold to let me know if I broke things. As such,
      // testing a lot of permutations of data getting prepended is not
      // the immediate goal.
      it('prepends data if newer and found valid prepend range', function() {
        mockEventSearch.length.andReturn(5);
        // Set initial length.
        makeSuccessHandler();
        var testData = makeTestData(3);
        mockEventSearch.getTail.andReturn({
          timestamp: testData[0].timestamp - 50
        });
        mockEventSearch.getHead.andReturn({
          timestamp: testData[2].timestamp + 50
        });
        spyOn(Util, 'findRange').andReturn({
          start: 0,
          end: testData.length - 1
        });
        successHandler(testData);
        expect(mockEventSearch.getTail).wasCalled();
        expect(mockEventSearch.getHead).wasCalled();
        expect(mockEventSearch.prepend).wasCalled();
      });
    });

    describe('dataSource callback', function() {
      var successCallback, completeCallback, mockEventSearch;

      beforeEach(function() {
        mockEventSearch = {
          clear: jasmine.createSpy()
        };
        jasmine.Ajax.useMock();
        successCallback = jasmine.createSpy();
        completeCallback = jasmine.createSpy();
        spyOn(eventSearchPage, 'makeOnRetrieveHistorySuccess').andReturn(successCallback);
      });

      it('clears when asked', function() {
        eventSearchPage.dataSource(mockEventSearch, true, completeCallback);
        expect(mockEventSearch.clear).wasCalled();
      });

      it('calls success callback then complete callback with no error on good response from server', function() {
        eventSearchPage.query.abort();
        eventSearchPage.dataSource(mockEventSearch, false, completeCallback);
        var request = mostRecentAjaxRequest();
        request.response({
          status: 200,
          responseText: JSON.stringify({ stuff: 'catpants' })
        });
        expect(successCallback).wasCalled();
        // Getting called with nothing defined for err; success!
        expect(completeCallback).wasCalledWith(undefined);
      });

      it('calls complete callback with error on bad response from server', function() {
        eventSearchPage.query.abort();
        eventSearchPage.dataSource(mockEventSearch, false, completeCallback);
        var request = mostRecentAjaxRequest();
        // Respond with badly formed JSON to validate the error is
        // passed to the complete callback.
        request.response({
          status: 200,
          responseText: 'stuff!'
        });
        expect(successCallback).wasNotCalled();
        expect(completeCallback).wasCalled();
        expect(completeCallback.mostRecentCall.args.length).toEqual(1);
        expect(completeCallback.mostRecentCall.args[0]).toBeTruthy();
      });
    });

    it('changes the query on time selection change and fetches results', function() {
      spyOn(searchResults, 'loadData');
      eventSearchPage.query = {
        startTime: 42,
        endTime: 2012,
        offset: 999,
        limit: 3
      };
      eventSearchPage.onTimeSelectionChanged({
        startDate: 0,
        endDate: 1
      });
      expect(eventSearchPage.query.startTime).toEqual(0);
      expect(eventSearchPage.query.endTime).toEqual(1);
      expect(eventSearchPage.query.offset).toEqual(0);
      expect(eventSearchPage.query.limit).toEqual(50);
      expect(searchResults.loadData).wasCalled();
    });

    it('does not search on time selection changed until filters ' +
        'are rebuilt', function() {
      spyOn(eventSearchPage.query, 'execute');
      eventSearchPage.onTimeSelectionChanged({
        startDate: 0,
        endDate: 1
      });
      expect(eventSearchPage.query.execute).wasNotCalled();
      eventSearchPage.rebuildFilters();
      expect(eventSearchPage.query.execute).wasCalled();
    });

    it('does not change query on auto update', function() {
      spyOn(searchResults, 'loadData');
      eventSearchPage.query = {
        startTime: 42,
        endTime: 2012,
        offset: 999,
        limit: 3
      };
      eventSearchPage.onTimeSelectionChanged({
        startDate: 0,
        endDate: 1
      }, true, true);
      expect(eventSearchPage.query.startTime).toEqual(42);
      expect(eventSearchPage.query.endTime).toEqual(2012);
      expect(eventSearchPage.query.offset).toEqual(999);
      expect(eventSearchPage.query.limit).toEqual(3);
      expect(searchResults.loadData).wasNotCalled();
    });

    it('pauses auto-refresh on instantiation', function() {
      spyOn($, 'publish');
      var es = new EventSearchPage(options);
      expect($.publish).wasCalled();
      var args = $.publish.mostRecentCall.args;
      expect(args[0]).toEqual('pauseAutoRefresh');
    });

    it('sorts certain filters to the top of the list of filters', function() {
      var createFakeFilter = function(propertyName) {
        return {
          propertyName: propertyName
        };
      };
      var fakeFilters = [
        createFakeFilter('ACTIVITY_ID'),
        createFakeFilter('CATPANTS'),
        createFakeFilter('CONTENT'),
        createFakeFilter('NAMESERVICE'),
        createFakeFilter('SERVICE')];
      searchFilters.registerAllFilters(fakeFilters);
      // Verify the new order.
      var filters = searchFilters.filters();
      expect(filters.length).toEqual(fakeFilters.length);
      expect(filters[0].propertyName).toEqual('CONTENT');
      expect(filters[1].propertyName).toEqual('SERVICE');
      expect(filters[2].propertyName).toEqual('ACTIVITY_ID');
      expect(filters[3].propertyName).toEqual('CATPANTS');
      expect(filters[4].propertyName).toEqual('NAMESERVICE');
    });

    it('will fire its onTimeSelectionChanged method if it missed the initial' +
        'time selection changed event', function() {
      spyOn(eventSearchPage, 'onTimeSelectionChanged');
      // Blank out any cached values. We expect it not to update itself.
      window._currentTimeSelection = null;
      eventSearchPage.checkInitialTimeRange();
      expect(eventSearchPage.onTimeSelectionChanged).wasNotCalled();

      window._currentTimeSelection = {
        timeRange: 'timeRange',
        isCurrentMode: 'isCurrentMode',
        isAutoUpdate: 'isAutoUpdate'
      };
      eventSearchPage.checkInitialTimeRange();
      expect(eventSearchPage.onTimeSelectionChanged).wasCalledWith(
        'timeRange', 'isCurrentMode', 'isAutoUpdate');
    });

    describe('filter links', function() {
      var $filterLink, mockFilter, searchFilters;

      beforeEach(function() {
        // Add a "filter" link to the results list.
        $filterLink = $('<a></a>')
          .data('filter', 'filterName')
          .appendTo($listElement);
        mockFilter = {
          compareTypes: [{
            name: 'EQ'
          }]
        };
        searchFilters = eventSearchPage.searchFilters;
        spyOn(searchFilters, 'findFilter').andReturn(mockFilter);
        spyOn(searchFilters, 'applyFilter');
      });

      it('does nothing if filter not found', function() {
        searchFilters.findFilter.andReturn(null);
        $filterLink.trigger('click');
        expect(searchFilters.applyFilter).wasNotCalled();
      });

      it('handles data-filter-value attribute', function() {
        $filterLink.data('filter-value', 'filterValue');
        $filterLink.trigger('click');
        expect(searchFilters.applyFilter).wasCalledWith(
          mockFilter, mockFilter.compareTypes[0], 'filterValue');
      });

      it('handles filter value pulled from text', function() {
        $filterLink.text('otherFilterValue');
        $filterLink.trigger('click');
        expect(searchFilters.applyFilter).wasCalledWith(
          mockFilter, mockFilter.compareTypes[0], 'otherFilterValue');
      });

      it('handles no EQish comparator found', function() {
        $filterLink.data('filter-value', 'filterValue');
        mockFilter.compareTypes = [];
        $filterLink.trigger('click');
        expect(searchFilters.applyFilter).wasNotCalled();
      });

      it('handles CONTAINS as comparator', function() {
        $filterLink.data('filter-value', 'filterValue');
        mockFilter.compareTypes = [{
          name: 'CONTAINS'
        }];
        $filterLink.trigger('click');
        expect(searchFilters.applyFilter).wasCalledWith(
          mockFilter, mockFilter.compareTypes[0], 'filterValue');
      });
    });
  });
});
