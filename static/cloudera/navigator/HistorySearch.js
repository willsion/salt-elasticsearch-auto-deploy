// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/search/SearchFilters',
  'cloudera/search/SearchResults',
  'cloudera/common/TimeBoundedQuery',
  'cloudera/common/Humanize',
  'cloudera/Util',
  'cloudera/common/TimeUtil',
  'cloudera/chart/TimeBrowserState',
  'underscore',
  // Below this line, we only depend on the modules to be loaded,
  // not use them by name.
  'cloudera/MegaBase',
  'cloudera/knockout/ko.formattedDate',
  'cloudera/knockout/ko.joinText',
  'cloudera/knockout/ko.tokenize',
  'cloudera/knockout/ko.multiSelect'
], function(SearchFilters, SearchResults, TimeBoundedQuery, Humanize, Util,
      TimeUtil, TimeBrowserState, _) {

    // Options:
    // * filterElement: (required) The element containing the filter
    //   selection panel.
    // * listElement: (required) The element containing the search results.
    // * historyUrl: (required) The URL to retrieve audits from.
    // * filtersUrl: (required) The URL to retrieve the list of filters from.
    // * useTimeControl: (optional) Set to true to listen for
    //   timeSelectionChanged events.
    // * updateRecentFiltersUrl: (optional) the URL we POST to to update
    //   recent filters.
    // * getRecentFiltersUrl: (optional) the URL we GET recent filters from.
    return function(options) {
        var self = this;
            // The 'state' variable is used to identify a state of the filter
            // list to ensure that we don't load data that is no longer applicable.
        var state = 0,
            // Static filters can be embedded in a template to limit the filterable result. This is used on the service audit pages.
            staticFilters = $(options.filterElement).data('static-filters');
        // Object that queries the history service.
        self.query = new TimeBoundedQuery();

        // Exposed for testing
        // The last scroll increment at which infinite scrolling requested more data.
        self.lastIncrement = 0;

        /**
         * Initiates a download of a CSV file.
         */
        self.exportEvents = function() {
          var params = [],
            param,
            exportParams = $.extend({}, self.query.getParams(), {
                limit: -1,
                format: "CSV",
                attachment: true
            });
          _.each(exportParams, function(value, key) {
              params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
          });
          Util.setWindowLocation(options.historyUrl + '?' + params.join("&"));
        };

        self.subscriptionHandles = [];

        /**
         * Applies the current selected filters to the data set.
         */
        self.search = function() {
            self.query.filters = self.searchFilters.getAppliedFilters();
            // Incrementing the state to ensure we ignore result from previous filter states.
            state += 1;
            // Clear results and load new the data.
            self.searchResults.loadData(true);
        };

        self.onTimeSelectionChanged = function(range, isCurrentMode, isAutoUpdate) {
            // Ignore auto update.
            if (isAutoUpdate) {
                return;
            }
            self.query.startTime = range.startDate;
            self.query.endTime = range.endDate;
            self.searchResults.loadData(true);
        };

        self.subscribe = function() {
          Util.unsubscribe(self);
          /** Time Control **/
          // Listen for timeSelectionChanged event and request and up-to-date result.
          if (options.useTimeControl) {
            self.subscriptionHandles = [$.subscribe("timeSelectionChanged", self.onTimeSelectionChanged)];
          } else {
            self.onTimeSelectionChanged({startDate: new Date(0), endDate: TimeUtil.getServerNow()});
          }
        };

        self.searchFilters = new SearchFilters({
          filterContainer: options.filterElement,
          filtersUrl: options.filtersUrl,
          searchFunction: function() {
            self.search();
          },
          staticFilters: staticFilters,
          exportResults: self.exportEvents,
          updateRecentFiltersUrl: options.updateRecentFiltersUrl,
          getRecentFiltersUrl: options.getRecentFiltersUrl
        });

        self.searchResults = new SearchResults({
          resultsContainer: options.listElement,
          executeQuery: function(handlers) {
            // If I call query.execute directly I can't mock it in tests.
            self.query.execute(options.historyUrl, handlers);
          },
          getResults: function(data) {
            return data;
          },
          orderingProperty: 'timestamp',
          getMaximum: function() {
            return Infinity;
          }
        });

        self.searchResults.applyBindings();

        // Tell SearchFilters when we're loading so it can show the spinner.
        self.searchResults.loading.subscribe(function(newValue) {
            self.searchFilters.loading(newValue);
        });

        // This is to avoid showing the "No records found..." message while waiting for the context to load.
        self.searchResults.loading(true);

        // Load the applicable filters from the server.
        self.searchFilters.loadFilters();
        // Grab any applied filters first.
        self.query.filters = self.searchFilters.getAppliedFilters();

        /** Infinite Scroll **/
        var loadingNext = false, 
            $history = $(window).scroll(function(e) {
                var position = $history.scrollTop(),
                historyScrollHeight = $('body').height();
                if (!loadingNext
                        && historyScrollHeight > self.lastIncrement
                        && (historyScrollHeight - $history.innerHeight() - position) < 200) {
                    loadingNext = true;
                    self.searchResults.loadData(function(err){
                        if(err) {
                            return true;
                        } else {
                            loadingNext = false;
                        }
                    });
                    self.lastIncrement = historyScrollHeight;
                }
            });

        /** Filter Activation **/
        $(options.listElement).on('click', 'a', function(e){
            var $target = $(e.currentTarget), filterName = $target.data('filter'), filter;
            if (filterName) {
                filter = self.searchFilters.findFilter(filterName);
                if (filter) {
                    self.searchFilters.applyFilter(filter, 'EQ',  $target.data('filter-value'));
                }
            }
        });

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

        self.subscribe();

        // Check to see if we've missed the initial time range selection event.
        self.checkInitialTimeRange();
    };
});
