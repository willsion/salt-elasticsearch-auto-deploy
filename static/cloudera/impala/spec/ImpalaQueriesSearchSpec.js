// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/impala/ImpalaQueriesSearch',
  'cloudera/Util',
  'cloudera/chart/TimeRange',
  'cloudera/common/UrlParams',
  'underscore'
], function(QuerySearch, Util, TimeRange, UrlParams, _) {
  describe('QuerySearch', function() {
    var querySearch, options, $queryFiltersElem, $queriesListElem,
      $queryInputContainer, $queriesContainer;

    var makeTestData = function(length) {
      var results = [];
      _.times(length, function(i) {
        results.push({
          startTime: 1348766817260 + (1000000 * i),
          endTime: 1348767817260 + (1000000 * i),
          statement: 'query ' + i
        });
      });
      return {
        queries: results
      };
    };

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
      $queryFiltersElem = $('<div></div>').appendTo(document.body);
      $queryInputContainer = $('<div></div>').appendTo(document.body);
      $queriesListElem = $('<div class="event-list"></div>').appendTo(document.body);
      $queriesContainer = $('<div></div>').appendTo(document.body);
      options = {
        filterContainer: $queryFiltersElem[0],
        queryInputContainer: $queryInputContainer,
        queriesContainer: $queriesContainer[0],
        executingQueriesUrl: '/some/random/query/executing',
        completedQueriesUrl: '/some/random/query/completed',
        cancelQueryUrl: '/cancel/query/url',
        serviceName: 'testServiceName',
        updateRecentFiltersUrl: '/update/recent/filters',
        getRecentFiltersUrl: '/get/recent/filters'
      };
      // Don't make live Ajax calls.
      jasmine.Ajax.useMock();
      // Instantiate our module.
      querySearch = new QuerySearch(options);
    });

    afterEach(function() {
      $queryFiltersElem.remove();
      $queriesListElem.remove();
      $queriesContainer.remove();
      if (querySearch) {
        Util.unsubscribe(querySearch);
      }
    });

    it('maintains search results', function() {
      expect(querySearch.searchResults).toBeDefined();
    });

    it('enables tooltips', function() {
      Util.unsubscribe(querySearch);
      spyOn($.fn, 'tooltip');
      querySearch = new QuerySearch(options);
      expect($.fn.tooltip).wasCalled();
    });

    it('enables typeahead of the query input container', function() {
      spyOn($.fn, 'SimpleTypeahead');
      // Unsubscribe the existing one so we don't have closures hanging around
      // up to no good.
      Util.unsubscribe(querySearch);
      querySearch = new QuerySearch(options);
      expect($.fn.SimpleTypeahead).wasCalled();
    });

    it('subscribes to time changed events', function() {
      Util.unsubscribe(querySearch);
      spyOn($, 'subscribe');
      querySearch = new QuerySearch(options);
      expect($.subscribe).wasCalledWith('timeSelectionChanged', jasmine.any(Function));
      // Null out querySearch -- it doesn't need an unsubscribe call
      querySearch = null;
    });

    it('ignores auto update', function() {
      spyOn(querySearch.searchResults, 'setDates');

      var timeRange = new TimeRange(new Date(), new Date());
      querySearch.onTimeSelectionChanged(timeRange, true, true);

      expect(querySearch.searchResults.setDates).wasNotCalled();
    });

    it('resets query based on time params', function() {
      spyOn(querySearch.searchResults, 'setDates');
      spyOn(querySearch, 'loadData');

      var timeRange = new TimeRange(new Date(0), new Date(1000));
      querySearch.onTimeSelectionChanged(timeRange, false, false);

      expect(querySearch.searchResults.setDates).wasCalledWith(
        new Date(0), new Date(1000), false);
    });

    it('searches correctly', function() {
      spyOn(querySearch, 'updateUrlParamsFromQuery');
      spyOn(querySearch, 'loadData');
      querySearch.search();
      expect(querySearch.updateUrlParamsFromQuery).wasCalled();
      expect(querySearch.loadData).wasCalledWith(true);
    });

    it('updates query from url params', function() {
      var index = 0;
      var params = [];
      var getFake = function(param) {
        params.push(param);
        index += 1;
        return index;
      };
      spyOn(UrlParams, 'get').andCallFake(getFake);
      spyOn(UrlParams, 'getInt').andCallFake(getFake);
      Util.unsubscribe(querySearch);
      querySearch = new QuerySearch(options);

      expect(querySearch.filters()).toEqual(1);
      expect(params.length).toEqual(3);
      expect(params[0]).toEqual('filters');
      expect(params[1]).toEqual('startTime');
      expect(params[2]).toEqual('endTime');
    });

    it('updates query correctly in the presence of invalid dates', function() {
      UrlParams.params.startTime = 'invalid start time';
      UrlParams.params.endTime = 'invalid end time';
      Util.unsubscribe(querySearch);
      querySearch = new QuerySearch(options);
      // Verify the date params on the search results query.
      expect(isNaN(querySearch.searchResults.query.startTime.getTime())).toBeFalsy();
      expect(isNaN(querySearch.searchResults.query.endTime.getTime())).toBeFalsy();
    });

    it('updates query filters as undefined initially', function() {
      expect(querySearch.filters()).toEqual(undefined);
    });

    it('updates url from query when searching', function() {
      spyOn(UrlParams, 'set');
      querySearch.filters('catpants');
      querySearch.updateUrlParamsFromQuery();
      expect(UrlParams.set).wasCalled();
      var filters = UrlParams.set.mostRecentCall.args[1];
      expect(filters).toEqual('catpants');
    });

    it('removes filters from url if there are no filters', function() {
      spyOn(UrlParams, 'set');
      spyOn(UrlParams, 'remove');
      querySearch.filters('');
      querySearch.updateUrlParamsFromQuery();
      expect(UrlParams.remove).wasCalled();
      expect(UrlParams.set).wasNotCalled();
    });

    it('does not error out if filters is undefined', function() {
      spyOn(UrlParams, 'set');
      spyOn(UrlParams, 'remove');
      querySearch.filters(undefined);
      querySearch.updateUrlParamsFromQuery();
      expect(UrlParams.remove).wasCalled();
      expect(UrlParams.set).wasNotCalled();
    });

    it('can load data correctly', function() {
      spyOn(querySearch.searchResults, 'loadData');
      querySearch.loadData();
      expect(querySearch.searchResults.loadData).wasCalled();
    });

    describe('filterViewModel', function() {
      var viewModel;

      beforeEach(function() {
        viewModel = querySearch.filterViewModel;
      });

      it('tracks filters', function() {
        querySearch.filters('catpants doggyhat');
        expect(viewModel.filters()).toEqual('catpants doggyhat');
      });

      it('knows how to search', function() {
        expect(viewModel.search).toEqual(querySearch.search);
      });

      it('searches on enter keypress', function() {
        spyOn(querySearch, 'search');
        expect(viewModel.searchOnEnter(null, { which: 42 })).toBeTruthy();
        expect(querySearch.search).wasNotCalled();
        // 13 === the Enter key.
        expect(viewModel.searchOnEnter(null, { which: 13 })).toBeFalsy();
        expect(querySearch.search).wasCalled();
      });

      it('supports suggested filters', function() {
        spyOn(querySearch, 'filters');
        spyOn(querySearch, 'search');
        var $suggestedFilter = $('<div data-filter="here is my filter">Hello there</div>').appendTo(document.body);
        viewModel.useSuggestedFilter(null, {
          target: $suggestedFilter[0]
        });
        expect(querySearch.filters).wasCalledWith('here is my filter');
        expect(querySearch.search).wasCalled();
        $suggestedFilter.remove();
      });

      it('supports recent filters', function() {
        spyOn(querySearch, 'filters');
        spyOn(querySearch, 'search');
        viewModel.useFilter('catpants');
        expect(querySearch.filters).wasCalledWith('catpants');
        expect(querySearch.search).wasCalled();
      });
    });

    describe('recent filters', function() {
      beforeEach(function() {
        jasmine.Ajax.useMock();
      });

      it('gets recent filters on instantiation', function() {
        var request = mostRecentAjaxRequest();
        // Find the request to getRecentFiltersUrl.
        var found = false;
        // ajaxRequests comes from the jasmine.Ajax stuff as a global.
        /*global ajaxRequests: true */
        _.each(ajaxRequests, function(request) {
          found = found || request.url === options.getRecentFiltersUrl;
        });
        expect(found).toBeTruthy();
      });

      it('can get recent filters', function() {
        querySearch.getRecentFilters();
        var request = mostRecentAjaxRequest();
        expect(request.url).toEqual(options.getRecentFiltersUrl);
        request.response({
          status: 200,
          responseText: JSON.stringify([
            'recentFilter1',
            'recentFilter2'])
        });
        var recentFilters = querySearch.recentFilters();
        expect(recentFilters.length).toEqual(2);
        expect(recentFilters[0]).toEqual('recentFilter1');
        expect(recentFilters[1]).toEqual('recentFilter2');
      });

      it('can update recent filters', function() {
        querySearch.filters('select the cat where dog');
        querySearch.updateRecentFilters();
        var request = mostRecentAjaxRequest();
        expect(request.url).toEqual(options.updateRecentFiltersUrl);
        expect(request.params).toEqual('filters=select+the+cat+where+dog');
      });

      it('does not update recent filters if filter is empty', function() {
        spyOn($, 'post').andCallThrough();
        querySearch.filters('select the cat where dog');
        querySearch.updateRecentFilters();
        expect($.post).wasCalled();
        $.post.reset();

        querySearch.filters('');
        querySearch.updateRecentFilters();
        expect($.post).wasNotCalled();

        querySearch.filters(undefined);
        querySearch.updateRecentFilters();
        expect($.post).wasNotCalled();
      });
    });

    it('will fire its onTimeSelectionChanged method if it missed the initial' +
        'time selection changed event', function() {
      spyOn(querySearch, 'onTimeSelectionChanged');
      // Blank out any cached values. We expect it not to update itself.
      window._currentTimeSelection = null;
      querySearch.checkInitialTimeRange();
      expect(querySearch.onTimeSelectionChanged).wasNotCalled();

      window._currentTimeSelection = {
        timeRange: 'timeRange',
        isCurrentMode: 'isCurrentMode',
        isAutoUpdate: 'isAutoUpdate'
      };
      querySearch.checkInitialTimeRange();
      expect(querySearch.onTimeSelectionChanged).wasCalledWith(
        'timeRange', 'isCurrentMode', 'isAutoUpdate');
    });
  });
});
