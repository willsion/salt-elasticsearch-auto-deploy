// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/search/SearchFilters',
  'cloudera/search/FilterModel',
  'knockout',
  'underscore'
], function(SearchFilters, FilterModel, ko, _) {

  describe('SearchFilters', function() {

    var $searchFilters, staticFilters, searchFilters, goodResponse,
      exportResults, options, searchFunction;

    beforeEach(function() {
      jasmine.Ajax.useMock();
      // Dummy success JSON to return from mock responses.
      goodResponse = {
        status: 200,
        responseText: JSON.stringify({success: true})
      };
      // Generate the mock data that we're sending in to the
      // search instance.
      $searchFilters = $('<div></div>').appendTo($('body'));
      staticFilters = [];
      exportResults = jasmine.createSpy('exportResults');
      searchFunction = jasmine.createSpy('searchFunction');
      options = {
        filterContainer: $searchFilters[0],
        filtersUrl: 'test/filters/url',
        searchFunction: searchFunction,
        staticFilters: staticFilters,
        exportResults: exportResults
      };

      searchFilters = new SearchFilters(options);
    });

    afterEach(function() {
      $searchFilters.remove();
    });

    it('defines some attributes', function() {
      expect(searchFilters.filterContainer).toBeDefined();
      expect(searchFilters.filters).toBeDefined();
      expect(searchFilters.staticFilters).toBeDefined();
      expect(searchFilters.appliedFilters).toBeDefined();
      expect(searchFilters.filtersUrl).toBeDefined();
    });

    it('applies bindings upon instantiation', function() {
      spyOn(ko, 'applyBindings');
      searchFilters = new SearchFilters(options);
      spyOn(searchFilters, 'insertFilter');
      spyOn(searchFilters, 'removeFilter');
      expect(ko.applyBindings.callCount).toEqual(1);
      var args = ko.applyBindings.argsForCall[0];
      expect(args[1]).toEqual($searchFilters[0]);
      var viewModel = args[0];
      // Verify the view model.
      expect(viewModel.filters).toEqual(searchFilters.filters);
      expect(viewModel.staticFilters).toEqual(searchFilters.staticFilters);
      expect(viewModel.appliedFilters).toEqual(searchFilters.appliedFilters);
      expect(viewModel.loading).toEqual(searchFilters.loading);
      expect(viewModel.search).toEqual(options.searchFunction);
      expect(viewModel.addFilter).toBeDefined();
      expect(viewModel.removeFilter).toBeDefined();
      expect(viewModel.generateTokenizeConfig).toBeDefined();
      // Test the view model callbacks.
      viewModel.addFilter();
      expect(searchFilters.insertFilter).wasCalled();
      viewModel.removeFilter();
      expect(searchFilters.removeFilter).wasCalled();
    });

    describe('view model', function() {
      var viewModel;

      beforeEach(function() {
        spyOn(ko, 'applyBindings');
        searchFilters = new SearchFilters(options);
        expect(ko.applyBindings.callCount).toEqual(1);
        var args = ko.applyBindings.argsForCall[0];
        expect(args[1]).toEqual($searchFilters[0]);
        viewModel = args[0];
      });

      it('addFilter calls insertFilter with number for argument', function() {
        spyOn(searchFilters, 'insertFilter');
        viewModel.addFilter(2);
        expect(searchFilters.insertFilter).wasCalled();
        var args = searchFilters.insertFilter.argsForCall[0];
        // One more than what we passed.
        expect(args[1]).toEqual(3);
        // Is the first argument really a FilterModel?
        var filterModel = args[0];
        expect(filterModel.filter).toBeDefined();
        expect(filterModel.compareType).toBeDefined();
        expect(filterModel.values).toBeDefined();
      });

      it('addFilter calls insertFilter with observable for argument', function() {
        spyOn(searchFilters, 'insertFilter');
        viewModel.addFilter(ko.observable(5));
        expect(searchFilters.insertFilter).wasCalled();
        var args = searchFilters.insertFilter.argsForCall[0];
        expect(args[1]).toEqual(6);
      });
    });

    describe('generateTokenizeConfig', function() {
      var generateTokenizeConfig, mockFilterModel, mockFilter;

      beforeEach(function() {
        spyOn(ko, 'applyBindings');
        searchFilters = new SearchFilters(options);
        expect(ko.applyBindings.callCount).toEqual(1);
        var args = ko.applyBindings.argsForCall[0];
        generateTokenizeConfig = args[0].generateTokenizeConfig;
        // Set up mocks.
        mockFilter = {
          valueUri: '/some/path/to/filter/values'
        };
        mockFilterModel = {
          filter: jasmine.createSpy('filter').andReturn(mockFilter)
        };
      });

      it('sets base options correctly', function() {
        var config = generateTokenizeConfig(mockFilterModel);
        expect(config.convertServerResponse).toBeDefined();
        expect(config.convertValue).toBeDefined();
        expect(config.tokenInputOptions).toBeDefined();
        expect(config.tokenInputOptions.preventDuplicates).toBeTruthy();
        // Test the convert methods.
        var converted = config.convertServerResponse(['catpants', 'doggyhat']);
        expect(converted.length).toEqual(2);
        expect(converted[0].id).toEqual('catpants');
        expect(converted[0].name).toEqual('catpants');
        expect(converted[1].id).toEqual('doggyhat');
        expect(converted[1].name).toEqual('doggyhat');
        converted = config.convertValue('horsepoo');
        expect(converted.id).toEqual('horsepoo');
        expect(converted.name).toEqual('horsepoo');
      });

      it('sets valueUri as source when present', function() {
        var config = generateTokenizeConfig(mockFilterModel);
        expect(config.source).toEqual(mockFilter.valueUri);
      });

      it('provides values as source correctly', function() {
        mockFilter.valueUri = null;
        mockFilter.values = ['catpants', 'doggyhat', 'horsepoo'];
        var config = generateTokenizeConfig(mockFilterModel);
        expect(config.source.length).toEqual(3);
        expect(config.source[0].id).toEqual('catpants');
        expect(config.source[0].name).toEqual('catpants');
        expect(config.source[1].id).toEqual('doggyhat');
        expect(config.source[1].name).toEqual('doggyhat');
        expect(config.source[2].id).toEqual('horsepoo');
        expect(config.source[2].name).toEqual('horsepoo');
      });

      it('shows all values if no typeahead match', function() {
        mockFilter.valueUri = null;
        mockFilter.values = ['catpants', 'doggyhat', 'horsepoo'];
        var config = generateTokenizeConfig(mockFilterModel);
        var results = config.convertServerResponse([]);
        expect(results.length).toEqual(3);
        expect(results[0].id).toEqual(mockFilter.values[0]);
        expect(results[1].id).toEqual(mockFilter.values[1]);
        expect(results[2].id).toEqual(mockFilter.values[2]);
      });

      it('shows values if typeahead match', function() {
        mockFilter.valueUri = null;
        mockFilter.values = ['catpants', 'doggyhat', 'horsepoo'];
        var config = generateTokenizeConfig(mockFilterModel);
        var results = config.convertServerResponse(['catpants', 'doggyhat']);
        expect(results.length).toEqual(2);
        expect(results[0]).toEqual('catpants');
        expect(results[1]).toEqual('doggyhat');
      });
    });

    it('can get a compare type from its name', function() {
      var compareType1 = { name: 'compareType1' };
      var compareType2 = { name: 'compareType2' };
      var filter = {
        compareTypes: [compareType1, compareType2]
      };
      var compareType = searchFilters.compareTypeFromName(filter, 'compareType2');
      expect(compareType).toEqual(compareType2);
      compareType = searchFilters.compareTypeFromName(filter, 'unknown');
      expect(compareType).toBeFalsy();
    });

    it('correctly inserts filters', function() {
      var filter = new FilterModel();
      expect(searchFilters.appliedFilters().length).toEqual(0);
      searchFilters.insertFilter(filter);
      expect(searchFilters.appliedFilters().length).toEqual(1);
    });

    it('does not insert if any filters are duplicates', function() {
      var filter = new FilterModel();
      filter.filter('filter');
      filter.compareType('compareType');
      filter.value('value');
      expect(searchFilters.appliedFilters().length).toEqual(0);
      searchFilters.insertFilter(filter);
      expect(searchFilters.appliedFilters().length).toEqual(1);
      // Try to add exact same filter.
      var filter2 = new FilterModel();
      filter2.filter('filter');
      filter2.compareType('compareType');
      filter2.value('value');
      searchFilters.insertFilter(filter2);
      expect(searchFilters.appliedFilters().length).toEqual(1);
    });

    it('inserts filters by index if given', function() {
      var filter1 = new FilterModel();
      filter1.filter('filter1');
      var filter2 = new FilterModel();
      filter2.filter('filter2');
      var filter3 = new FilterModel();
      filter3.filter('filter3');
      searchFilters.insertFilter(filter1);
      searchFilters.insertFilter(filter2);
      expect(searchFilters.appliedFilters().length).toEqual(2);
      searchFilters.insertFilter(filter3, 1);
      expect(searchFilters.appliedFilters()[1]).toEqual(filter3);
    });

    it('knows how to remove a filter', function() {
      var filter1 = new FilterModel();
      filter1.filter('filter1');
      filter1.compareType('compareType1');
      filter1.value('value1');
      var filter2 = new FilterModel();
      filter2.filter('filter2');
      filter2.compareType('compareType2');
      filter2.value('value2');
      searchFilters.insertFilter(filter1);
      searchFilters.insertFilter(filter2);
      expect(searchFilters.appliedFilters().length).toEqual(2);

      // Start tracking how many times the array is changed.
      var count = 0;
      searchFilters.appliedFilters.subscribe(function() {
        count += 1;
      });
      searchFilters.removeFilter(filter1);
      expect(searchFilters.appliedFilters().length).toEqual(1);
      expect(count).toEqual(1);
    });

    it('loads filters via a getJSON call', function() {
      spyOn(searchFilters, 'loadFiltersHandler');
      searchFilters.loadFilters();
      var request = mostRecentAjaxRequest();
      request.response(goodResponse);
      expect(searchFilters.loadFiltersHandler).wasCalled();
    });

    it('knows how to handle the filters response from the server', function() {
      searchFilters.filters([1, 2]);
      var responseFromServer = {
        message: 'OK',
        data: [4, 5, 6]
      };
      searchFilters.loadFiltersHandler(responseFromServer);
      expect(searchFilters.filters().length).toEqual(3);
      var filters = searchFilters.filters();
      expect(filters[0]).toEqual(4);
      expect(filters[1]).toEqual(5);
      expect(filters[2]).toEqual(6);
    });

    it('calls a callback when filters are loaded', function() {
      searchFilters.filters([1, 2]);
      var callback = jasmine.createSpy('load filters callback');
      searchFilters.loadFilters(callback);
      var request = mostRecentAjaxRequest();
      request.response(goodResponse);
      expect(callback).wasCalled();
    });

    it('can return all the applied filters', function() {
      var makeTestFilterModel = function(index) {
        var model = new FilterModel();
        model.filter({ propertyName: 'propertyName ' + index});
        model.compareType({ name: 'compareType ' + index });
        model.value('value ' + index);
        return model;
      };
      var model1 = makeTestFilterModel(1);
      var model2 = makeTestFilterModel(2);
      var model3 = makeTestFilterModel(3);
      // Create a special one that has 'values' set instead of 'value'.
      var model4 = new FilterModel();
      model4.filter({ propertyName: 'propertyName 4'});
      model4.compareType({ name: 'compareType 4' });
      model4.values(['value 4.1', 'value 4.2']);

      // The integrity check in getAppliedFilters should discard
      // model3 because of its null value.
      model3.value(null);
      // Add a static filter, it should come first. We don't care about
      // the rest of the properties for the purposes of this test.
      var staticModel = {
        values: ['value 0']
      };
      searchFilters.staticFilters = [staticModel];
      searchFilters.appliedFilters([model1, model2, model3, model4]);

      var appliedFilters = searchFilters.getAppliedFilters();
      expect(appliedFilters.length).toEqual(4);
      expect(appliedFilters[0].values).toEqual(['value 0']);
      expect(appliedFilters[1].values).toEqual(['value 1']);
      expect(appliedFilters[2].values).toEqual(['value 2']);
      var values = appliedFilters[3].values;
      expect(values.length).toEqual(2);
      expect(values[0]).toEqual('value 4.1');
      expect(values[1]).toEqual('value 4.2');
    });

    it('can find filters', function() {
      var filter1 = { propertyName: 'filter1' };
      var filter2 = { propertyName: 'filter2' };
      var filter3 = { propertyName: 'filter3' };
      searchFilters.filters([filter1, filter2, filter3]);
      var foundFilter = searchFilters.findFilter('filter2');
      expect(foundFilter).toEqual(filter2);
      foundFilter = searchFilters.findFilter('unknown');
      expect(foundFilter).toEqual(null);
    });

    it('can register filters', function() {
      var filter1 = {};
      expect(searchFilters.filters().length).toEqual(0);
      searchFilters.registerFilter(filter1);
      expect(searchFilters.filters().length).toEqual(1);
      expect(searchFilters.filters()[0]).toEqual(filter1);

      var filter2 = {};
      var filter3 = {};
      searchFilters.registerAllFilters([filter2, filter3]);
      expect(searchFilters.filters().length).toEqual(3);
    });

    it('won\'t register a filter that is in the static filters list', function() {
      var filter1 = {};
      expect(searchFilters.filters().length).toEqual(0);
      searchFilters.registerFilter(filter1);
      expect(searchFilters.filters().length).toEqual(1);
      expect(searchFilters.filters()[0]).toEqual(filter1);
      
      var staticFilter = {propertyName: 'static'};
      searchFilters.staticFilters = [staticFilter];

      var filter2 = {propertyName: 'static'};
      var filter3 = {};
      searchFilters.registerAllFilters([filter2, filter3]);
      expect(searchFilters.filters().length).toEqual(2);
      expect(_.find(searchFilters.filters(), function(filter) {
        return staticFilter.propertyName === filter.propertyName;
      })).toBeUndefined();
    });

    it('adds utility methods to registered filters', function() {
      var filter = {};
      searchFilters.registerFilter(filter);
      expect(filter.has).toBeDefined();
      expect(filter.hasnt).toBeDefined();

      // Test the utility methods.
      filter.catpants = true;
      expect(filter.has('catpants')).toBeTruthy();
      expect(filter.has('catpants', 'doghat')).toBeFalsy();
      expect(filter.hasnt('catpants')).toBeFalsy();
      expect(filter.hasnt('catpants', 'doghat')).toBeTruthy();
    });

    it('can clear out the filters', function() {
      var filter1 = { propertyName: 'filter1' };
      var filter2 = { propertyName: 'filter2' };
      var filter3 = { propertyName: 'filter3' };
      searchFilters.filters([filter1, filter2, filter3]);
      expect(searchFilters.filters().length).toEqual(3);
      searchFilters.clearFilters();
      expect(searchFilters.filters().length).toEqual(0);
    });

    it('converts single value to singleton array for values', function() {
      spyOn(searchFilters, 'compareTypeFromName').andReturn('compareType');
      spyOn(searchFilters, 'insertFilter').andCallThrough();
      var result = searchFilters.applyFilter('filter', 'compareTypeName', 'catpants');
      expect(result).toBeTruthy();
      var filterModel = searchFilters.insertFilter.mostRecentCall.args[0];
      expect(filterModel.values().length).toEqual(1);
      expect(filterModel.values()[0]).toEqual('catpants');
    });

    it('will convert inserted filter compare type if given string', function() {
      spyOn(searchFilters, 'compareTypeFromName').andReturn('compareType');
      spyOn(searchFilters, 'insertFilter').andReturn(true);
      var result = searchFilters.applyFilter('filter', 'compareTypeName', 'value');
      expect(result).toBeTruthy();
      expect(searchFilters.compareTypeFromName).wasCalled();

      searchFilters.compareTypeFromName.reset();
      result = searchFilters.applyFilter('filter', {}, 'value');
      expect(result).toBeTruthy();
      expect(searchFilters.compareTypeFromName).wasNotCalled();
    });

    it('will fail if compare type is not found', function() {
      spyOn(searchFilters, 'compareTypeFromName').andReturn(null);
      spyOn(searchFilters, 'insertFilter').andReturn(true);
      var result = searchFilters.applyFilter('filter', 'compareTypeName', 'value');
      expect(result).toBeFalsy();
      expect(searchFilters.compareTypeFromName).wasCalled();
    });
  });
});