// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/impala/QuerySearchResults',
  'cloudera/common/UrlParams',
  'cloudera/Util',
  'cloudera/chart/TimeBrowserState',
  'knockout',
  'underscore',
  // Below this line we don't need a reference to the module.
  'cloudera/impala/ko.expandOnHover',
  'cloudera/impala/ko.formattedStatement',
  'cloudera/knockout/ko.formattedDate',
  'cloudera/knockout/ko.formattedDuration',
  'cloudera/layout/Toggler',
  'cloudera/form/SimpleTypeahead'
], function(QuerySearchResults, UrlParams, Util, TimeBrowserState, ko, _) {
  // Page widget for doing Impala query filtering.
  // Overview:
  // * QuerySearch: Instantiates the QuerySearchResults, maintains the filter
  //   view model, and keeps the URL up-to-date on any changes to the query.
  //   It also subscribes to timeSelectionChanged events to update the query.
  // * QuerySearchResults: Responsible for displaying the results. Makes sure
  //   the results are properly ordered and provides a facade for manipulating
  //   the query object. It also decorates the server's response queries with
  //   properties necessary for their useful display.
  // * ImpalaSearchQuery: Instantiated by QuerySearchResults, this object
  //   coordinates multiple requests to the server.
  //
  // Options:
  // * filterContainer: the element containing the filters (passed to
  //   SearchFilters).
  // * queryInputContainer: the element containing the search box.
  // * queriesContainer: the element containing the list of Impala queries we
  //   return as results of a search.
  // * executingQueriesUrl: the url used to retrieve executing query results.
  // * completedQueriesUrl: the url used to retrieve completed query results.
  // * cancelQueryUrl: the url used to cancel a running query.
  // * serviceName: the name of the service we are querying.
  // * queryDetailsUrl: the URL of the page to get details about a query
  // * typeaheadUrl: the url used to fetch typeahead results.
  // * updateRecentFiltersUrl: the URL we POST to to update recent filters.
  // * getRecentFiltersUrl: the URL we GET recent filters from.
  return function(options) {
    var self = this;

    // Activate tooltips.
    $(options.queriesContainer).tooltip({
      selector: '[rel=tooltip]'
    });

    // The recent filters for this user, retrieved from the server.
    self.recentFilters = ko.observableArray();

    self.getRecentFilters = function() {
      $.getJSON(options.getRecentFiltersUrl, function(data) {
        if (data) {
          self.recentFilters(data);
        }
      }).error(function(response) {
        Util.filterError(response);
      });
    };

    self.getRecentFilters();

    // Set to true when a request goes to the server and false once it completes.
    self.liveServerRequest = ko.observable(false);

    self.updateRecentFilters = function() {
      // Don't update recent filters if the current filter is blank.
      var filters = self.filters();
      if (!filters || filters.length === 0) {
        return;
      }
      $.post(options.updateRecentFiltersUrl, {
        filters: filters
      })
      .done(function() {
        self.getRecentFilters();
      })
      .fail(function(jqXHR, textStatus, error) {
        console.error('Error updating recent filters: ', textStatus, error);
      });
    };

    // Set up the search result container.
    self.searchResults = new QuerySearchResults({
      queriesContainer: options.queriesContainer,
      executingQueriesUrl: options.executingQueriesUrl,
      completedQueriesUrl: options.completedQueriesUrl,
      cancelQueryUrl: options.cancelQueryUrl,
      serviceName: options.serviceName,
      queryDetailsUrl: options.queryDetailsUrl,
      orderingProperty: 'duration',
      onSuccess: self.updateRecentFilters,
      onQueryStart: function() {
        self.liveServerRequest(true);
      },
      onQueryEnd: function() {
        self.liveServerRequest(false);
      }
    });

    // The filters we're sending as part of the query.
    self.filters = ko.observable();
    // Anytime the filter changes, update the query objects of our
    // search result widget.
    self.filters.subscribe(function(newValue) {
      self.searchResults.query.filters = newValue;
    });

    // Set up typeahead in filter box.
    var $queryInput = options.queryInputContainer;
    $queryInput.SimpleTypeahead({
      url: options.typeaheadUrl + "?limit=8",
      value: 'label',
      name: 'value',
      updater: function(name, value) {
        if (name && name.cursor !== undefined) {
          _.defer(function() {
            Util.setCaretToPos($queryInput[0], name.cursor);
          });
        }
        return name.tsquery;
      },
      matcher: function() {
        return true;
      },
      noResults: function() {}
    });

    // The user might have been sent to this page with params in the
    // URL hash. Apply those to the query.
    self.filters(UrlParams.get('filters', undefined));
    self.searchResults.setDates(
      new Date(UrlParams.getInt('startTime', self.searchResults.query.startTime)),
      new Date(UrlParams.getInt('endTime', self.searchResults.query.endTime)));

    self.updateUrlParamsFromQuery = function() {
      var filters = self.filters();
      if (!filters || _.size(filters) === 0) {
          UrlParams.remove('filters');
          return;
      }
      UrlParams.set('filters', filters);
    };

    // Ask the results widget to load data from the server.
    self.loadData = function(clear) {
      self.searchResults.loadData(clear);
    };

    // Called when the user initiates a search. If the user is not initiating
    // this search then call loadData. This method updates the recent filters.
    self.search = function() {
      // Propogate back to URL params.
      self.updateUrlParamsFromQuery();
      // Clear results and load new the data.
      self.loadData(true);
    };

    // If the TC changed we need to update the parameters of the query
    // and load new data.
    self.onTimeSelectionChanged = function(timeRange, isCurrentMode, isAutoUpdate) {
      // If this change is because of autoUpdate, ignore it.
      if (isAutoUpdate) {
        return;
      }
      self.searchResults.setDates(timeRange.startDate, timeRange.endDate, isCurrentMode);
      // Clear results and load new data.
      self.loadData(true);
    };

    self.subscriptionHandles = [];

    self.subscribe = function() {
      // Listen for timeSelectionChanged event and request up-to-date results.
      var handle1 = $.subscribe("timeSelectionChanged", self.onTimeSelectionChanged);
      self.subscriptionHandles = [handle1];
    };

    // Start listening for events.
    self.subscribe();

    // Set up filters view model to capture Enter keypresses.
    // TODO: Consider refactoring this into its own file.
    self.filterViewModel = {
      filters: self.filters,
      search: self.search,
      recentFilters: self.recentFilters,
      liveServerRequest: self.liveServerRequest,
      searchOnEnter: function(data, event) {
        // If user pressed Enter, do a search but don't add the newline to
        // the associated control.
        if (event.which === 13) {
          self.search();
          return false;
        }
        return true;
      },
      useSuggestedFilter: function(vm, e) {
        var filter = $(e.target).data('filter');
        self.filters(filter);
        self.search();
      },
      useFilter: function(filter) {
        self.filters(filter);
        self.search();
      }
    };

    // TODO: Duplicate of method in EventSearchPage. Consider refactoring.
    self.checkInitialTimeRange = function() {
      // If we can find the cached values of the current TC time then
      // we missed the initial timeSelectionChanged event and need to
      // update manually.
      var cachedValues = TimeBrowserState.getTimeSelectionValues();
      if (cachedValues) {
        self.onTimeSelectionChanged(cachedValues.timeRange,
          cachedValues.isCurrentMode, cachedValues.isAutoUpdate);
      }
    };

    // Check to see if we've missed the initial time range selection event.
    self.checkInitialTimeRange();

    self.applyBindings = function() {
      ko.applyBindings(self.filterViewModel, options.filterContainer);
      self.searchResults.applyBindings();
    };
  };
});
