// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/search/SearchResults',
  'cloudera/search/FilterModel',
  'cloudera/Util',
  'knockout',
  'underscore'
], function(SearchResults, FilterModel, Util, ko, _) {

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

  describe('SearchResults', function() {

    var $resultList, options, searchResults, goodResponse;

    beforeEach(function() {
      jasmine.Ajax.useMock();
      // Dummy success JSON to return from mock responses.
      goodResponse = {
        status: 200,
        responseText: JSON.stringify({success: true})
      };
      // Container for results.
      $resultList = $('<div></div>').appendTo($('body'));

      options = {
        resultsContainer: $resultList[0],
        executeQuery: jasmine.createSpy('executeQuery'),
        getResults: jasmine.createSpy('getResults'),
        orderingProperty: 'catpants',
        getMaximum: jasmine.createSpy('getMaximum').andReturn('doggyhat')
      };
      searchResults = new SearchResults(options);
    });

    afterEach(function() {
      $resultList.remove();
    });

    describe('option validation', function() {
      var createSearchResults = function() {
        return new SearchResults(options);
      };

      it('works if everything is there', function() {
        expect(createSearchResults).not.toThrow();
      });

      it('validates that resultsContainer is there', function() {
        options.resultsContainer = null;
        expect(createSearchResults).toThrow();
      });

      it('validates executeQuery is there', function() {
        options.executeQuery = null;
        expect(createSearchResults).toThrow();
      });

      it('validates getResults is there', function() {
        options.getResults = null;
        expect(createSearchResults).toThrow();
      });

      it('validates orderingProperty is there', function() {
        options.orderingProperty = null;
        expect(createSearchResults).toThrow();
      });
    });

    it('defines some attributes', function() {
      expect(searchResults.executeQuery).toBeDefined();
      expect(searchResults.getResults).toBeDefined();
      expect(searchResults.orderingProperty).toBeDefined();
      expect(searchResults.getMaximum).toBeDefined();
      expect(searchResults.errors).toBeDefined();
      expect(searchResults.results).toBeDefined();
      expect(searchResults.loading).toBeDefined();
      expect(searchResults.dataSource).toBeDefined();
    });

    it('applies bindings correctly', function() {
      spyOn(ko, 'applyBindings');
      searchResults = new SearchResults(options);
      expect(ko.applyBindings.callCount).toEqual(0);
      searchResults.applyBindings();
      expect(ko.applyBindings.callCount).toEqual(1);
      var args = ko.applyBindings.argsForCall[0];
      expect(args[1]).toEqual($resultList[0]);
    });

    it('exposes a subset of itself as a view model to the result list', function() {
      spyOn(ko, 'applyBindings');
      searchResults = new SearchResults(options);
      searchResults.applyBindings();
      expect(ko.applyBindings.callCount).toEqual(1);
      var args = ko.applyBindings.argsForCall[0];
      var viewModel = args[0];
      expect(viewModel.loading).toEqual(searchResults.loading);
      expect(viewModel.errors).toEqual(searchResults.errors);
      expect(viewModel.results).toEqual(searchResults.results);
    });

    it('exposes hook for modifying view model passed to applyBindings', function() {
      var modifyViewModel = jasmine.createSpy('modifyViewModel');
      options.modifyViewModel = modifyViewModel;
      searchResults = new SearchResults(options);
      expect(modifyViewModel).wasCalled();
      // Were we given the view model?
      var viewModel = modifyViewModel.mostRecentCall.args[0];
      expect(viewModel.loading).toBeDefined();
      expect(viewModel.errors).toBeDefined();
      expect(viewModel.results).toBeDefined();
    });

    it('getHead and getTail work when there are no results', function() {
      expect(searchResults.length()).toEqual(0);
      expect(searchResults.getHead()).toBeNull();
      expect(searchResults.getTail()).toBeNull();
    });

    it('getHead and getTail work when there are results', function() {
      searchResults.results([1, 2, 3]);
      expect(searchResults.length()).toEqual(3);
      expect(searchResults.getHead()).toEqual(1);
      expect(searchResults.getTail()).toEqual(3);
    });

    it('can splice results to the end', function() {
      searchResults.results([1, 2, 3]);
      expect(searchResults.length()).toEqual(3);
      searchResults.splice(0);
      expect(searchResults.length()).toEqual(0);
      searchResults.results([1, 2, 3]);
      searchResults.splice(3, 0, 4);
      expect(searchResults.length()).toEqual(4);
      var results = searchResults.results();
      expect(results[0]).toEqual(1);
      expect(results[1]).toEqual(2);
      expect(results[2]).toEqual(3);
      expect(results[3]).toEqual(4);
    });

    it('correctly prepends results', function() {
      // Test the single result case.
      var result1 = new FilterModel();
      result1.name = 'result1';
      var result = searchResults.prepend(result1);
      expect(result).toEqual(1);

      // Test the array case.
      var result2 = new FilterModel();
      result2.name = 'result2';
      var result3 = new FilterModel();
      result3.name = 'result3';
      result = searchResults.prepend([result2, result3]);
      expect(result).toEqual(3);
      var results = searchResults.results();
      expect(results[0].name).toEqual('result2');
      expect(results[1].name).toEqual('result3');
      expect(results[2].name).toEqual('result1');

      // Test the prepend to empty results case.
      searchResults.results([]);
      expect(searchResults.length()).toEqual(0);
      result = searchResults.prepend([result1, result2, result3]);
      expect(result).toEqual(searchResults.length());
    });

    it('correctly appends results', function() {
      // Test the single result case.
      var result1 = new FilterModel();
      result1.name = 'result1';
      var result = searchResults.append(result1);
      expect(result).toEqual(1);

      // Test the array case.
      var result2 = new FilterModel();
      result2.name = 'result2';
      var result3 = new FilterModel();
      result3.name = 'result3';
      result = searchResults.append([result2, result3]);
      expect(result).toEqual(3);
      var results = searchResults.results();
      expect(results[0].name).toEqual('result1');
      expect(results[1].name).toEqual('result2');
      expect(results[2].name).toEqual('result3');

      // Test the append to empty results case.
      searchResults.results([]);
      expect(searchResults.length()).toEqual(0);
      result = searchResults.append([result1, result2, result3]);
      expect(result).toEqual(searchResults.length());
    });

    it('has method for retrying the dataSource after a time', function() {
      var clear = true;
      var handler = jasmine.createSpy();
      var timeoutInMs = 5;
      searchResults.dataSource = jasmine.createSpy('dataSource');
      runs(function() {
        searchResults.retryHandlerAfterTime(clear, handler, timeoutInMs);
      });
      waitsFor(function() {
        return searchResults.dataSource.callCount > 0;
      }, 'dataSource never called', timeoutInMs * 2);
      runs(function() {
        // Verify that dataSource was called with correct args.
        var args = searchResults.dataSource.mostRecentCall.args;
        expect(args[0]).toEqual(clear);
        expect(args[1]).toEqual(handler);
      });
    });

    it('knows how to handle errors when loading data', function() {
      // We're not providing a callback here so we don't have to
      // worry about async retries.
      var handler = searchResults.makeLoadDataHandler(true);
      var errors = searchResults.errors();
      expect(errors.length).toEqual(0);
      searchResults.loading(true);

      handler(null);
      errors = searchResults.errors();
      expect(errors.length).toEqual(0);
      expect(searchResults.loading()).toBeFalsy();

      searchResults.loading(true);
      var errorMessage = 'catpants';
      handler(errorMessage);
      errors = searchResults.errors();
      expect(errors.length).toEqual(1);
      expect(errors[0]).toEqual(errorMessage);
      expect(searchResults.loading()).toBeFalsy();
    });

    it('knows how to call callbacks when loading data', function() {
      var callback = jasmine.createSpy().andReturn(false);
      spyOn(searchResults, 'retryHandlerAfterTime');
      var handler = searchResults.makeLoadDataHandler(true, callback);

      handler(null);
      expect(callback).wasCalled();
      expect(searchResults.retryHandlerAfterTime).wasNotCalled();

      callback.andReturn(true);
      handler('error');
      expect(callback).wasCalledWith('error');
      expect(searchResults.retryHandlerAfterTime).wasCalled();
    });

    it('knows how to load data', function() {
      var handler = 'handler';
      var callback = function() {};
      spyOn(searchResults, 'dataSource');
      spyOn(searchResults, 'makeLoadDataHandler').andReturn(handler);
      searchResults.errors(['catpants error']);
      expect(searchResults.loading()).toBeFalsy();

      searchResults.loadData(true, callback);
      var errors = searchResults.errors();
      expect(errors.length).toEqual(0);
      expect(searchResults.loading()).toBeTruthy();
      expect(searchResults.dataSource).wasCalledWith(true, handler);

      searchResults.errors(['catpants error']);
      searchResults.loading(false);
      searchResults.dataSource.reset();
      searchResults.loadData(callback);
      errors = searchResults.errors();
      expect(errors.length).toEqual(0);
      expect(searchResults.loading()).toBeTruthy();
      expect(searchResults.dataSource).wasCalledWith(undefined, handler);
    });

    it('can clear results', function() {
      searchResults.results([1, 2, 3]);
      searchResults.clear();
      expect(searchResults.results().length).toEqual(0);
    });

    describe('dataSource', function() {
      beforeEach(function() {
        spyOn(searchResults, 'clear');
        spyOn(searchResults, 'length').andReturn(0);
      });

      it('clears when told to do so', function() {
        searchResults.dataSource(true);
        expect(searchResults.clear).wasCalled();
      });

      it('executes query with correct handlers', function() {
        // Return sentinel from makeOnRetrieveHistorySuccess.
        var callback = jasmine.createSpy('callback');
        searchResults.dataSource(false, callback);
        expect(searchResults.clear).wasNotCalled();
        expect(options.executeQuery).wasCalled();
        var args = options.executeQuery.mostRecentCall.args;
        var handlers = args[0];
        // Check the handlers.
        expect(_.isFunction(handlers.success)).toBeTruthy();
        expect(_.isFunction(handlers.error)).toBeTruthy();
        expect(_.isFunction(handlers.complete)).toBeTruthy();
        // Quick check on the error handler.
        handlers.error(null, null, 'catpants');
        handlers.complete();
        expect(callback).wasCalledWith('catpants');
      });
    });

    describe('createOnRetrieveHistorySuccess', function() {
      var mockData, callback, successHandler;

      var makeSuccessHandler = function() {
        successHandler = searchResults.createOnRetrieveHistorySuccess(false);
      };

      beforeEach(function() {
        mockData = makeTestData(3);
        options.getResults.andReturn(mockData.queries);
        options.orderingProperty = 'endTime';
        options.getMaximum.andReturn(999999);
        searchResults = new SearchResults(options);
        // Mock the heck out of searchResults.
        spyOn(searchResults, 'append');
        spyOn(searchResults, 'prepend');
        spyOn(searchResults, 'getHead');
        spyOn(searchResults, 'getTail');
        spyOn(searchResults, 'length').andReturn(0);

        callback = jasmine.createSpy('callback');
        makeSuccessHandler();
      });

      it('does nothing if no data came back', function() {
        successHandler(null);
        expect(searchResults.append).wasNotCalled();
      });

      it('gives the onDataReceived function a chance to do something', function() {
        options.onDataReceived = jasmine.createSpy('onDataReceived');
        searchResults = new SearchResults(options);
        makeSuccessHandler();
        successHandler('catpants');
        expect(options.onDataReceived).wasCalledWith('catpants');
      });

      it('does nothing if data has length 0', function() {
        options.getResults.andReturn([]);
        searchResults = new SearchResults(options);
        spyOn(searchResults, 'append');
        makeSuccessHandler();
        successHandler(mockData);
        expect(options.getResults).wasCalled();
        expect(searchResults.append).wasNotCalled();
      });

      it('does nothing if result lengths do not match', function() {
        searchResults.length.andReturn(5);
        successHandler(mockData);
        expect(searchResults.append).wasNotCalled();
      });

      it('appends results if there were none to begin with', function() {
        var testData = makeTestData(5);
        successHandler(testData);
        expect(searchResults.append).wasCalled();
        expect(searchResults.getTail).wasNotCalled();
      });

      it('appends data if response from server is older than current oldest', function() {
        searchResults.length.andReturn(5);
        // Set initial length.
        makeSuccessHandler();
        var testData = makeTestData(3);
        searchResults.getTail.andReturn({
          endTime: testData.queries[2].endTime + 1000000
        });
        successHandler(testData);
        expect(searchResults.append).wasCalled();
      });

      // This test is more about coverage than it is about testing
      // the underlying logic. So, crummy test. It's true purpose is to
      // provide a scaffold to let me know if I broke things. As such,
      // testing a lot of permutations of data getting prepended is not
      // the immediate goal.
      it('prepends data if newer and found valid prepend range', function() {
        searchResults.length.andReturn(5);
        // Set initial length.
        makeSuccessHandler();
        var testData = makeTestData(3);
        searchResults.getTail.andReturn({
          endTime: testData.queries[0].endTime - 50
        });
        searchResults.getHead.andReturn({
          endTime: testData.queries[2].endTime + 50
        });
        spyOn(Util, 'findRange').andReturn({
          start: 0,
          end: testData.length - 1
        });
        successHandler(testData);
        expect(searchResults.getTail).wasCalled();
        expect(searchResults.getHead).wasCalled();
        expect(searchResults.prepend).wasCalled();
      });
    });
  });
});