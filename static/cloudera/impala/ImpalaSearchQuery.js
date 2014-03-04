// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/TimeBoundedQuery',
  'cloudera/common/TimeUtil',
  'underscore'
], function(TimeBoundedQuery, TimeUtil, _) {
  // An Impala-query-list-specific query object we can use with a SearchResults
  // instance. It obeys the TimeBoundedQuery interface and uses two internally
  // but overrides most of their behaviors:
  // * If we are in current mode it issues two queries and waits for both
  //   results to come back.
  // * If we are in historical mode it only issues one query, for completed
  //   Impala queries.
  // * It forces the offset to be 0 and the limit to be options.limit.
  // * It forces the filters to be a string and not a JSON object.
  //
  // Options:
  // * executingQueriesUrl: the url used to retrieve query results.
  // * completedQueriesUrl: the url used to retrieve query results.
  // * serviceName: the name of the Impala service we are querying.
  // * limit: the maximum number of items to return from the query.
  // * onStart: (optional) called when request begins.
  // * onEnd: (optional) called when request ends.
  return function(options) {
    var self = this;
    // The TimeBoundedQuery instances we use internally.
    var executingQueries = new TimeBoundedQuery();
    var completedQueries = new TimeBoundedQuery();
    // The string sent to the server to filter the Impala query results.
    self.filters = undefined;

    // startTime and endTime are Date objects. isCurrentMode is a boolean and
    // defaults to true.
    self.setDates = function(startTime, endTime, isCurrentMode) {
      self.startTime = startTime || TimeUtil.getServerNow();
      self.endTime = endTime || TimeUtil.getServerNow();
      self.isCurrentMode = isCurrentMode === undefined ? true : isCurrentMode;
    };

    self.setDates();

    // This method overrides the two query instances' getParams functions.
    // It is called bound to the TimeBoundedQuery instance it overrides.
    var getQueryParams = function() {
      return {
        startTime: self.startTime.getTime(),
        endTime: self.endTime.getTime(),
        // filters is required. Always send at least a blank string.
        filters: self.filters || '',
        offset: 0,
        limit: options.limit,
        serviceName: options.serviceName
      };
    };

    // Override the two queries' getParams methods to force our params.
    executingQueries.getParams = getQueryParams;
    completedQueries.getParams = getQueryParams;

    var spliceResults = function(executingResponse, completedResponse) {
      var errors = [].concat(
        executingResponse.errors, completedResponse.errors);
      var warnings = [].concat(
        executingResponse.warnings, completedResponse.warnings);
      var queries = [].concat(
        executingResponse.queries, completedResponse.queries);
      // Do not return more than options.limit queries.
      queries.splice(options.limit, queries.length);
      return {
        errors: errors,
        warnings: warnings,
        queries: queries
      };
    };

    // Abort any inflight queries.
    self.abort = function() {
      executingQueries.abort();
      completedQueries.abort();
    };

    // TODO: Fix this stupidity.
    // I am *really* not happy with how createDoneResponder and
    // createAlwaysResponder work with regard to being in current mode and
    // handling errors. Maybe createDoneResponder gets split into two different
    // functions and the if stays in execute? The single request case and the
    // error case look the same in createAlwaysResponder. This all seems
    // really clumsy to me.
    self.createDoneResponder = function(handlers) {
      // I think this is jQuery being even dumber. Since I've only put in one
      // async request, the parameters to my success handler revert back to
      // the three arguments the jqXHR success would receive with one request.
      if (!self.isCurrentMode) {
        return function(results, textStatus, jqXHR) {
          if (handlers.success) {
            handlers.success(results, textStatus, jqXHR);
          }
        };
      } else {
        return function(executingResultArgs, completedResultArgs) {
          // If we received no executingResultArgs and completedResultArgs then
          // maybe we already had an inflight query when making a second
          // request. In that case, the success handler should not execute.
          if (!executingResultArgs && !completedResultArgs) {
            return;
          }
          // Splice together the responses from the two calls, executing first.
          var executingData = executingResultArgs[0];
          var completedData = completedResultArgs[0];
          var results = spliceResults(executingData, completedData);
          if (handlers.success) {
            handlers.success(results, 'success', {});
          }
        };
      }
    };

    self.createFailResponder = function(handlers) {
      return function(jqXHR, textStatus, errorThrown) {
        if (handlers.error) {
          handlers.error(jqXHR, textStatus, errorThrown);
        }
      };
    };

    self.createAlwaysResponder = function(handlers) {
      // I think this is jQuery being dumb. The arguments to always vary based
      // on whether the call succeeded or failed; they also vary based on how
      // many async requests were made. That means I don't really know which
      // is which until I look at the properties of the arguments. Does that
      // first argument resemble the server response? Maybe we're "done". Does
      // it have jqXHR properties? Maybe we "fail"ed. This sucks.
      return function(first, second, third) {
        // If there isn't a complete handler, skip all this.
        if (!handlers.complete) {
          return;
        }

        // If we received no arguments to the responder then maybe we already
        // had an inflight query when making a second request. We should still
        // call the complete handler, but it will receive no arguments.
        if (!first && !second && !third) {
          handlers.complete();
          return;
        }

        if (first.length) {
          // The call succeeded. The first argument is an array of success
          // params for a done call.
          var executingData = first[0];
          var completedData = second[1];
          var results = spliceResults(executingData, completedData);
          handlers.complete(results, 'success', {});
        } else {
          // The call failed or we only made one request. The first argument
          // is the jqXHR of the call that failed.
          handlers.complete(first, second, third);
        }
      };
    };

    self.execute = function(handlers) {
      var requests = [];
      // Only make the request for executing queries if in current mode.
      if (self.isCurrentMode) {
        requests.push(executingQueries.execute(options.executingQueriesUrl, {}));
      }
      requests.push(completedQueries.execute(options.completedQueriesUrl, {}));
      if (_.isFunction(options.onStart)) {
        options.onStart();
      }
      // Only complete when both queries are complete.
      var deferred = $.when.apply($, requests);
      deferred.done(self.createDoneResponder(handlers));
      deferred.fail(self.createFailResponder(handlers));
      deferred.always(self.createAlwaysResponder(handlers));
      if (_.isFunction(options.onEnd)) {
        deferred.always(options.onEnd);
      }
    };
  };
});