// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/search/enableRecentFilters',
  'cloudera/Util',
  'underscore'
], function(enableRecentFilters, Util, _) {
  describe('enableRecentFilters', function() {
    var viewModel, mockSearchFilters, getFiltersServerResponse;

    var invoke = function() {
      enableRecentFilters(viewModel, 'getRecentFilters', 'updateRecentFilters', mockSearchFilters);
    };

    var makeFilterClause = function(filter, compareType, value)  {
      // Mock filter like the one we get from the server.
      return {
        filter: {
          displayName: filter,
          propertyName: filter
        },
        compareType: {
          displayName: compareType
        },
        value: value,
        values: value
      };
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      viewModel = {
        appliedFilters: jasmine.createSpy('appliedFilters').andReturn([])
      };
      // Make appliedFilters look like an observableArray.
      viewModel.appliedFilters.removeAll = jasmine.createSpy('removeAll');

      mockSearchFilters = {
        findFilter: jasmine.createSpy('findFilter'),
        applyFilter: jasmine.createSpy('applyFilter')
      };
      getFiltersServerResponse = _.map(_.range(5), function(i) {
        return JSON.stringify([
            makeFilterClause('filter' + i, 'EQ', 'value' + i)
          ]);
      });
    });

    it('modifies the viewModel with recent filters properties', function() {
      invoke();
      expect(viewModel.supportRecent).toBeTruthy();
      expect(viewModel.recentFilters).toBeDefined();
      expect(viewModel.getRecentFilters).toBeDefined();
      expect(viewModel.updateRecentFilters).toBeDefined();
      expect(viewModel.selectRecentFilter).toBeDefined();
      expect(viewModel.search).toBeDefined();
    });

    it('updates recent filters immediately on invoke', function() {
      invoke();
      var request = mostRecentAjaxRequest();
      expect(request.url).toEqual('getRecentFilters');
      request.response({
        status: 200,
        responseText: JSON.stringify(getFiltersServerResponse)
      });
      var recentFilters = viewModel.recentFilters();
      expect(recentFilters.length).toEqual(5);
      expect(recentFilters[0].prettyPrinted).toEqual('filter0 EQ value0');
      expect(recentFilters[1].prettyPrinted).toEqual('filter1 EQ value1');
      expect(recentFilters[2].prettyPrinted).toEqual('filter2 EQ value2');
      expect(recentFilters[3].prettyPrinted).toEqual('filter3 EQ value3');
      expect(recentFilters[4].prettyPrinted).toEqual('filter4 EQ value4');
    });

    it('handles errors when getting recent filters', function() {
      spyOn(Util, 'filterError');
      invoke();
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: "Not a JSON string"
      });
      expect(Util.filterError).wasCalled();
    });

    it('does not update if currently applied filters are empty', function() {
      invoke();
      viewModel.updateRecentFilters();
      expect(viewModel.appliedFilters).wasCalled();
      var request = mostRecentAjaxRequest();
      expect(request.url).not.toEqual('updateRecentFilters');
    });

    it('updates recent with current filter and immediately fetches again', function() {
      invoke();
      viewModel.getRecentFilters = jasmine.createSpy('getRecentFilters');
      viewModel.appliedFilters.andReturn(['filter1', 'filter2']);
      viewModel.updateRecentFilters();
      var request = mostRecentAjaxRequest();
      expect(request.url).toEqual('updateRecentFilters');
      var params = Util.unparam(request.params);
      var filters = JSON.parse(params.filters);
      expect(filters.length).toEqual(2);
      expect(filters[0]).toEqual('filter1');
      expect(filters[1]).toEqual('filter2');
      request.response({
        status: 200,
        responseText: ''
      });
      expect(viewModel.getRecentFilters).wasCalled();
    });

    it('searches when a recent filter is selected', function() {
      invoke();
      viewModel.appliedFilters.removeAll = jasmine.createSpy('removeAll');
      var filter = [
        makeFilterClause('filter1', 'EQ', 'value1'),
        makeFilterClause('filter2', 'EQ', 'value2')];
      mockSearchFilters.findFilter.andReturn('filter3');
      viewModel.search = jasmine.createSpy('search');
      viewModel.selectRecentFilter({
        filter: filter
      });

      expect(viewModel.appliedFilters.removeAll).wasCalled();
      expect(mockSearchFilters.applyFilter.callCount).toEqual(2);
      var args = mockSearchFilters.applyFilter.argsForCall[0];
      // The return value from findFilter is 'filter3'.
      expect(args[0]).toEqual('filter3');
      expect(args[1].displayName).toEqual('EQ');
      expect(args[2]).toEqual('value1');
    });

    it('wraps existing search functionality to update recent filters', function() {
      var oldSearch = jasmine.createSpy('oldSearch');
      viewModel.search = oldSearch;
      invoke();
      viewModel.updateRecentFilters = jasmine.createSpy('updateRecentFilters');
      viewModel.search();
      expect(viewModel.updateRecentFilters).wasCalled();
      expect(oldSearch).wasCalled();
    });

    describe('prettyPrintFilter', function() {
      var prettyPrintFilter;

      beforeEach(function() {
        prettyPrintFilter = enableRecentFilters.prettyPrintFilter;
      });

      it('should pretty print simple filter', function() {
        var filters = [makeFilterClause('cat', 'EQ', 'pants')];
        var result = prettyPrintFilter(filters);
        expect(result).toEqual('cat EQ pants');
      });

      it('should combine two clauses with AND', function() {
        var filters = [
          makeFilterClause('cat', 'NEQ', 'pants'),
          makeFilterClause('doggy', 'EQ', 'hat')
        ];
        var result = prettyPrintFilter(filters);
        expect(result).toEqual('cat NEQ pants AND doggy EQ hat');
      });
    });

    describe('transformRecentFilters', function() {
      var transformRecentFilters;

      beforeEach(function() {
        transformRecentFilters = enableRecentFilters.transformRecentFilters;
      });

      it('can interpret filters from the server correctly', function() {
        var filterString1 = JSON.stringify([
          makeFilterClause('cat', 'EQ', 'pants'),
          makeFilterClause('cat2', 'EQ', 'pants2')]);
        var filterString2 = JSON.stringify([
          makeFilterClause('doggy', 'NEQ', 'hat')]);
        var filters = [filterString1, filterString2];
        var results = transformRecentFilters(filters);

        expect(results.length).toEqual(2);

        var filter = results[0];
        expect(filter.filter).toBeDefined();
        expect(filter.filter.length).toEqual(2);
        expect(filter.prettyPrinted).toEqual('cat EQ pants AND cat2 EQ pants2');

        filter = results[1];
        expect(filter.filter).toBeDefined();
        expect(filter.filter.length).toEqual(1);
        expect(filter.prettyPrinted).toEqual('doggy NEQ hat');
      });
    });
  });
});
