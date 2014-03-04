// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/navigator/HistorySearch',
  'cloudera/chart/TimeRange',
  'cloudera/Util',
  'underscore'
], function(HistorySearch, TimeRange, Util, _) {
  describe('HistorySearch', function() {
    var $filterElement, $listElement;
    var historySearch, searchFilters, searchResults;

    // Simulated data from the server.
    var makeTestData = function(length) {
      var results = [];
      _.times(length, function() {
        results.push({
          timestamp: 1348766817260 + (1000000 * results.length)
        });
      });
      return results;
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      $filterElement = $('<div></div>').appendTo($('body'));
      $listElement = $('<div></div>').appendTo($('body'));
      historySearch = new HistorySearch({
        filterElement: $filterElement[0],
        listElement: $listElement[0],
        historyUrl: 'historyUrl',
        filtersUrl: 'filtersUrl',
        useTimeControl: true,
        updateRecentFiltersUrl: 'updateRecentFiltersUrl',
        getRecentFiltersUrl: 'getRecentFiltersUrl'
      });
      searchFilters = historySearch.searchFilters;
      searchResults = historySearch.searchResults;
    });

    afterEach(function() {
      Util.unsubscribe(historySearch);
      $filterElement.remove();
      $listElement.remove();
    });

    it('has some attributes', function() {
      expect(historySearch.searchFilters).toBeDefined();
      expect(historySearch.searchResults).toBeDefined();
      expect(historySearch.subscriptionHandles).toBeDefined();
    });

    it('has a sensible default state upon construction', function() {
      expect(searchResults.loading()).toBeTruthy();
      expect(historySearch.subscriptionHandles.length).toEqual(1);
    });

    it('syncs loading between SearchResults and SearchFilters', function() {
      expect(searchResults.loading()).toBeTruthy();
      expect(searchFilters.loading()).toBeTruthy();
      searchResults.loading(false);
      expect(searchFilters.loading()).toBeFalsy();
    });

    it('takes the right steps when applying filters', function() {
      var appliedFilters = { test: 'catpants '};
      spyOn(searchFilters, 'getAppliedFilters').andReturn(appliedFilters);
      spyOn(searchResults, 'loadData');

      historySearch.search();

      expect(searchResults.loadData).wasCalledWith(true);
      expect(historySearch.query.filters).
        toEqual(appliedFilters);
    });
    
    it('reloads the data when the time control is updated', function() {
      spyOn(searchResults, 'loadData');
      $.publish('timeSelectionChanged', [new TimeRange(new Date(), new Date())]);
      expect(searchResults.loadData).wasCalledWith(true);
    });

    it('ignores time changes when they are because of auto update', function() {
      spyOn(searchResults, 'loadData');
      var range = new TimeRange(new Date(), new Date());
      historySearch.onTimeSelectionChanged(range, true, true);
      expect(searchResults.loadData).wasNotCalled();
    });

    it('knows how to export events as downloadable CSV', function() {
      spyOn(Util, 'setWindowLocation');
      historySearch.exportEvents();
      expect(Util.setWindowLocation).wasCalled();
      var url = Util.setWindowLocation.mostRecentCall.args[0];
      expect(url).toContain('historyUrl?');
      expect(url).toContain('offset=0');
      expect(url).toContain('limit=-1');
      expect(url).toContain('format=CSV');
      expect(url).toContain('attachment=true');

      historySearch.query.offset = 42;
      Util.setWindowLocation.reset();
      historySearch.exportEvents();
      expect(Util.setWindowLocation).wasCalled();
      url = Util.setWindowLocation.mostRecentCall.args[0];
      expect(url).toContain('historyUrl?');
      expect(url).toContain('offset=42');
      expect(url).toContain('limit=-1');
      expect(url).toContain('format=CSV');
      expect(url).toContain('attachment=true');
    });

    it('will fire its onTimeSelectionChanged method if it missed the initial' +
        'time selection changed event', function() {
      spyOn(historySearch, 'onTimeSelectionChanged');
      // Blank out any cached values. We expect it not to update itself.
      window._currentTimeSelection = null;
      historySearch.checkInitialTimeRange();
      expect(historySearch.onTimeSelectionChanged).wasNotCalled();

      window._currentTimeSelection = {
        timeRange: 'timeRange',
        isCurrentMode: 'isCurrentMode',
        isAutoUpdate: 'isAutoUpdate'
      };
      historySearch.checkInitialTimeRange();
      expect(historySearch.onTimeSelectionChanged).wasCalledWith(
        'timeRange', 'isCurrentMode', 'isAutoUpdate');
    });

    describe('free edition functionality', function () {
      var $freeFilterElement,
          $freeListElement;

      beforeEach(function() {
        $freeFilterElement = $('<div></div>').appendTo($('body'));
        $freeListElement = $('<div></div>').appendTo($('body'));
      });

      afterEach(function() {
        $freeFilterElement.remove();
        $freeListElement.remove();
      });

      it('should not subscribe to the "timecontrol" event', function () {
        spyOn($, 'subscribe');

        historySearch = new HistorySearch({
          filterElement: $freeFilterElement[0],
          listElement: $freeListElement[0],
          historyUrl: 'historyUrl',
          filtersUrl: 'filtersUrl',
          useTimeControl: false,
          updateRecentFiltersUrl: 'updateRecentFiltersUrl',
          getRecentFiltersUrl: 'getRecentFiltersUrl'
        });

        expect($.subscribe).not.toHaveBeenCalledWith("timeSelectionChanged", historySearch.onTimeSelectionChanged);
      });
    });

    describe('filter links', function() {
      var $filterLink, mockFilter, searchFilters;

      beforeEach(function() {
        // Add a "filter" link to the results list.
        $filterLink = $('<a></a>')
          .data('filter', 'filterName')
          .appendTo($listElement);
        mockFilter = {};
        searchFilters = historySearch.searchFilters;
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
          mockFilter, 'EQ', 'filterValue');
      });
    });
  });
});
