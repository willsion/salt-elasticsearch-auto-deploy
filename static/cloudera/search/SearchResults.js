// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'knockout',
  'underscore'
], function(Util, ko, _) {

  var assert = function(result, message) {
    if (!result) {
      throw new Error(message);
    }
  };

  // Options:
  // * resultsContainer: (required) DOM element that will contain the results.
  // * executeQuery (required) Function that takes an object defining
  //   the response handlers and makes the actual query to the server.
  // * getResults (required) Function that returns list of results given
  //   the actual server response.
  // * orderingProperty (required) String property of individual result
  //   to order the results by.
  // * getMaximum (required) Function that returns maximum possible value
  //   of orderingProperty.
  // * modifyViewModel: (optional) callback to modify SearchResults view model
  //   before binding.
  // * onDataReceived (optional) Called with data from the server once
  //   response comes back.
  var SearchResults = function(options) {
    // Verify that we're given the options we need.
    assert(options.resultsContainer, 'resultsContainer must be present');
    assert(_.isFunction(options.executeQuery),
      'executeQuery must be present and a function');
    assert(_.isFunction(options.getResults),
      'getResults must be present and a function');
    assert(options.orderingProperty, 'orderingProperty must be present');
    assert(_.isFunction(options.getMaximum),
      'getMaximum must be present and a function');

    this.resultsContainer = options.resultsContainer;
    this.executeQuery = options.executeQuery;
    this.getResults = options.getResults;
    this.orderingProperty = options.orderingProperty;
    this.getMaximum = options.getMaximum;
    this.onDataReceived = options.onDataReceived;
    this.errors = ko.observableArray();
    this.results = ko.observableArray();
    this.loading = ko.observable(false);

    this.viewModel = {
      loading: this.loading,
      errors: this.errors,
      results: this.results
    };

    if (_.isFunction(options.modifyViewModel)) {
      options.modifyViewModel(this.viewModel);
    }
  };

  SearchResults.prototype.applyBindings = function() {
    ko.applyBindings(this.viewModel, this.resultsContainer);
  };

  SearchResults.prototype.getTail = function() {
    return this.length() ? this.results()[this.length() - 1] : null;
  };

  SearchResults.prototype.getHead = function() {
    return this.length() ? this.results()[0] : null;
  };

  SearchResults.prototype.length = function() {
    return this.results().length;
  };

  SearchResults.prototype.splice = function() {
    return this.results.splice.apply(this.results, $.makeArray(arguments));
  };

  SearchResults.prototype.prepend = function(newResult) {
    var result;
    if (_.isArray(newResult)) {
      this.results(this.length() ? newResult.concat(this.results()) : newResult);
      result = this.length();
    } else {
      result = this.results.unshift(newResult);
    }
    return result;
  };

  SearchResults.prototype.append = function(newResult) {
    var result;
    if (_.isArray(newResult)) {
      this.results(this.length() ? this.results().concat(newResult) : newResult);
      result = this.length();
    } else {
      result = this.results.push(newResult);
    }
    return result;
  };

  SearchResults.prototype.retryHandlerAfterTime = function(clear, handler, timeInMs) {
    var self = this;
    setTimeout(function() {
      self.dataSource(clear, handler);
    }, timeInMs);
  };

  SearchResults.prototype.makeLoadDataHandler = function(clear, callback) {
    var self = this;
    return function(err) {
      self.loading(false);

      if (err) {
        self.errors([err]);
      }

      if (callback && callback(err)) {
        var boundHandler = _.bind(self.makeLoadDataHandler, self);
        self.retryHandlerAfterTime(clear, boundHandler, 2000);
      }
    };
  };

  SearchResults.prototype.loadData = function(clear, callback) {
    if (_.isFunction(clear)) {
      callback = clear;
      clear = undefined;
    }

    this.errors([]);
    this.loading(true);

    var handler = this.makeLoadDataHandler(clear, callback);
    this.dataSource(clear, handler);
  };

  SearchResults.prototype.clear = function() {
    this.results.splice(0);
  };

  // Return a function suitable for use in the later call to retrieve
  // history events from the server.
  SearchResults.prototype.createOnRetrieveHistorySuccess = function(clear) {
    // Persist the length of the events at the time on the request.
    var initialLength = clear ? 0 : this.length();
    var self = this;

    return function(data) {
      if (data && _.isFunction(self.onDataReceived)) {
        self.onDataReceived(data);
      }

      var currentLength = self.length(),
      searcher, newest, oldest, prependRange;
      // Ignore the result if there's no data returned or if another request
      // beat this request in.
      if (data === null || initialLength !== currentLength) {
        return;
      }
      
      var results = self.getResults(data);
      // Check if any data was returned from getResults.
      if (_.isEmpty(results)) {
        return;
      }

      // If the list is currently empty, just push the results
      // into the list.
      if (!currentLength) {
        self.append(results);
        return;
      }

      oldest = self.getTail()[self.orderingProperty];
      // Check the ordering property of our "oldest" record. If it is newer
      // then append the result.
      if (results[0][self.orderingProperty] < oldest) {
        self.append(results);
      } else {
        // Otherwise, prepend the results.
        results.reverse();
        searcher = function(i) {
          return results[i][self.orderingProperty];
        };

        newest = self.getHead()[self.orderingProperty];
        var maximum = self.getMaximum();
        prependRange = Util.findRange(searcher, results.length-1, newest+1, maximum);
        if (prependRange) {
          self.prepend(results.slice(prependRange.start, prependRange.end).reverse());
        }
      }
    };
  };

  SearchResults.prototype.dataSource = function(clear, callback) {
    // Stores any error that occurs during the request phase.
    var err;
    // Clear the results if they're no longer applicable.
    if (clear) {
      this.clear();
    }
    // Create the response handlers.
    var successHandler = this.createOnRetrieveHistorySuccess(clear);
    var handlers = {
      success: successHandler,
      error: function(jqXHR, textStatus, errorThrown) {
          // Store the error for later use.
          err = errorThrown;
      },
      complete: function() {
        // Invoke the callback, passing an error if one occurred.
        callback(err);
      }
    };
    // Execute the query.
    this.executeQuery(handlers);
  };

  return SearchResults;
});