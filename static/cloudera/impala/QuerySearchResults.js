// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/impala/ImpalaSearchQuery',
  'cloudera/search/SearchResults',
  'cloudera/common/UrlParams',
  'cloudera/common/I18n',
  'cloudera/Util',
  'knockout',
  'underscore',
  // Below this line we don't need a reference to the module.
  'cloudera/knockout/ko.animatedHide'
], function(ImpalaSearchQuery, SearchResults, UrlParams, I18n, Util, ko, _) {
  var DEFAULT_LIMIT = 500;

  // Set up constants we need for providing query feedback. The key corresponds
  // to a field in a response object we get from the server. The value is the
  // message we $.publish to show feedback.
  var FEEDBACK_MESSAGE = {
    'warnings': 'chartWarningsChanged',
    'errors': 'chartErrorsChanged'
  };

  var FEEDBACK_SCOPE = 'impala-query-list';

  var showError = function(message) {
    $.publish(FEEDBACK_MESSAGE.errors, [message, FEEDBACK_SCOPE]);
  };

  var handleFeedback = function(feedbackType, response) {
    var feedback = response[feedbackType] || [];
    $.publish(FEEDBACK_MESSAGE[feedbackType], [feedback, FEEDBACK_SCOPE]);
  };

  // Controls the display of Impala queries, whether running or completed.
  // Provides for modifying the params of the query through its API.
  //
  // Options:
  // * queriesContainer: the element containing the list of search results.
  // * executingQueriesUrl: the url used to retrieve query results.
  // * completedQueriesUrl: the url used to retrieve query results.
  // * cancelQueryUrl: the url used to cancel a query.
  // * serviceName: the name of the service we are querying.
  // * queryDetailsUrl: the URL of the page to get details about a query.
  // * orderingProperty: how to order the query results.
  // * onSuccess: (optional) called after a query is executed with no errors.
  // * onQueryStart: called when query starts.
  // * onQueryEnd: called when query ends.
  var QuerySearchResults = function(options) {
    var self = this;
    // The query object we use to get events from the server.
    // TODO: Consider moving this into QuerySearch.js.
    self.query = new ImpalaSearchQuery({
      executingQueriesUrl: options.executingQueriesUrl,
      completedQueriesUrl: options.completedQueriesUrl,
      serviceName: options.serviceName,
      limit: DEFAULT_LIMIT,
      onStart: options.onQueryStart,
      onEnd: options.onQueryEnd
    });

    // If the user has reached the end of the list of results and has not found
    // what they're looking for then we should display a link that will adjust
    // the TC to an earlier time for them.
    // We only know we should show this link if the user received DEFAULT_LIMIT
    // queries. That means there could be more queries on the server than what
    // we showed.
    self.showLoadMore = ko.observable(false);

    // Called when user cancels a query.
    self.cancelQuery = function(query) {
      var params = {
        queryId: query.queryId,
        serviceName: options.serviceName
      };
      $.post(options.cancelQueryUrl, params)
        .fail(function(jqxhr, textStatus, error) {
          if (error) {
            console.error(error);
          }
          showError(textStatus);
        })
        .done(function(data, textStatus, jqxhr) {
          // data is an instance of ImpalaCancelQueryResponse from the server.
          handleFeedback('warnings', data);
          handleFeedback('errors', data);
          // If there were no warnings or errors, hide the query in the UI.
          if (!data.warnings && !data.errors) {
            query.canceled(true);
          }
        });
    };

    // If there is a runtime profile available then go to the details page for
    // this query.
    self.viewDetails = function(query) {
      if (!query.runtimeProfileAvailable) {
        return;
      }
      var url = options.queryDetailsUrl + '?queryId=' +
        encodeURIComponent(query.queryId);
      Util.setWindowLocation(url);
    };

    // Iterate over query returned from the server and add our
    // custom properties.
    var prepareData = function(data) {
      var prepareQuery = function(query) {
        // query.startTime and .endTime are Impala profile structures that
        // we received from the server.
        query.startTimeMillis = query.startTime && query.startTime.millis;
        query.endTimeMillis = (query.endTime && query.endTime.millis) || null;
        query.durationMillis = (query.duration && query.duration.millis) || 0;
        query.isRunning = (query.endTime === null);
        query.cancel = function(query) {
          var message = I18n.t('ui.impala.confirmCancel');
          var cancelCallback = function() {
            self.cancelQuery(query);
          };
          $.publish('showConfirmation', [message, cancelCallback]);
        };
        query.canceled = ko.observable(false);
        query.viewDetails = self.viewDetails;
        query.queryDetailsUrl = options.queryDetailsUrl + '?queryId=' + query.queryId;
      };
      _.each(data.queries, prepareQuery);
    };
    // Expose prepareData for testing.
    QuerySearchResults.prepareData = prepareData;

    // Called by the queryResponseHandler to interpret the data from the
    // server.
    var getResults = function(data) {
      // Were there errors or warnings? Show them.
      handleFeedback('warnings', data);
      handleFeedback('errors', data);
      if (data.errors.length === 0 && _.isFunction(options.onSuccess)) {
        options.onSuccess();
      }
      // If we're bumping up against our limit then we should offer to load
      // more queries for the user.
      self.showLoadMore(data.queries && data.queries.length === DEFAULT_LIMIT);
      return data.queries;
    };

    // Expose the showLoadMore observable in the SearchResults view model.
    var modifyViewModel = function(viewModel) {
      viewModel.showLoadMore = self.showLoadMore;
    };

    // Does all the actual work of retrieving results and displaying them.
    self.searchResults = new SearchResults({
      resultsContainer: options.queriesContainer,
      executeQuery: function(handlers) {
        // If I call query.execute directly I can't mock it in tests.
        self.query.execute(handlers);
      },
      onDataReceived: prepareData,
      getResults: getResults,
      orderingProperty: options.orderingProperty,
      getMaximum: function() {
        return Infinity;
      },
      modifyViewModel: modifyViewModel
    });

    self.loadData = function(clear) {
      self.searchResults.loadData(clear);
    };

    // Sets the query's startTime, endTime, and isCurrentMode properties.
    // startTime and endTime are Date objects.
    self.setDates = function(startTime, endTime, isCurrentMode) {
      self.query.setDates(startTime, endTime, isCurrentMode);
    };

    self.applyBindings = function() {
      self.searchResults.applyBindings();
    };
  };

  return QuerySearchResults;
});
