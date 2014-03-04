// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
    'cloudera/search/SearchFilters',
    'cloudera/search/SearchResults',
    'cloudera/search/FilterModel',
    'cloudera/common/Humanize',
    'cloudera/Util',
    'cloudera/common/TimeBoundedQuery',
    'cloudera/common/UrlParams',
    'cloudera/events/page/PrepareEventData',
    'cloudera/chart/TimeBrowserState',
    'underscore',
    'knockout',
    // Below this line, we only depend on the modules to be loaded,
    // not use them by name.
    'cloudera/knockout/ko.formattedDate',
    'cloudera/knockout/ko.joinText',
    'cloudera/knockout/ko.tokenize',
    'cloudera/events/page/ko.defaultTemplate',
    'cloudera/events/page/ko.substituteText',
    'cloudera/events/page/ko.withHealthCheckJson',
    'cloudera/MegaBase'
], function(SearchFilters, SearchResults, FilterModel, Humanize, Util,
        TimeBoundedQuery, UrlParams, prepareEventData,
        TimeBrowserState, _, ko) {
    var DEFAULT_QUERY_OFFSET = 0;
    var DEFAULT_QUERY_LIMIT = 50;
    // These correspond to the propertyName of filters we get from the server.
    // These filters will be listed first in the filter dropdown.
    var POPULAR_FILTERS = ['CONTENT', 'SERVICE', 'ROLE', 'HOSTS'];

    // Options:
    // * filtersElem: the element containing the filters (passed to SearchFilters).
    // * resultsElem: the element containing the results (passed to SearchResults).
    // * queryUrl: the url used to retrieve results.
    // * filtersUrl: the url used to retrieve filters. (passed to SearchFilters).
    // * updateRecentFiltersUrl: the URL we POST to to update recent filters.
    // * getRecentFiltersUrl: the URL we GET recent filters from.
    return function(options) {
        var filterElement = options.filtersElem;
        var listElement = options.resultsElem;
        var self = this;
        // The 'state' variable is used to identify a state of the filter
        // list to ensure that we don't load data that is no longer applicable.
        var state = 0;
        // Used in infinite scroll. Declared here to prevent jslint
        // from complaining.
        var lastIncrement = 0;
        // The query object we use to get events from the server.
        self.query = new TimeBoundedQuery();
        // Sometimes the TC issues its initial timeSelectionChanged event
        // before the event search filters have been built. This causes a
        // search with invalid properties; none of the user's parameters have
        // been read off the URL yet so we're likely to get it wrong.
        // Use the jQuery Deferred object to prevent searches from going
        // through until the filters have been reconstructed.
        var deferredSearch = new $.Deferred();

        self.subscriptionHandles = [];

        // The user might have been sent to this page with params in the
        // URL hash. Apply those to the query. Do not call this method
        // before filters have been loaded from the server.
        self.updateQueryFromUrlParams = function() {
            self.query.startTime = new Date(UrlParams.getInt('startTime', self.query.startTime));
            self.query.endTime = new Date(UrlParams.getInt('endTime', self.query.endTime));
            self.query.offset = parseInt(UrlParams.getInt('offset', DEFAULT_QUERY_OFFSET), 10);
            self.query.limit = parseInt(UrlParams.getInt('limit', DEFAULT_QUERY_LIMIT), 10);
            self.query.filters = JSON.parse(UrlParams.get('filters', '[]'));
        };

        self.updateUrlParamsFromQuery = function() {
            if (_.size(self.query.filters) === 0) {
                UrlParams.remove('filters');
                return;
            }
            UrlParams.set('filters', JSON.stringify(self.query.filters));
        };

        // Applies the current selected filters to the query and loads events.
        self.search = function() {
            self.query.filters = self.searchFilters.getAppliedFilters();
            // Incrementing the state to ensure we ignore result from previous filter states.
            state += 1;
            // Update the filters set in the URL.
            self.updateUrlParamsFromQuery();
            // Reset back to the beginning.
            self.query.offset = 0;
            // Clear results and load new the data.
            self.searchResults.loadData(true);
        };

        // Return a function suitable for use in the later call to retrieve
        // history events from the server.
        self.makeOnRetrieveHistorySuccess = function(clear, searchResults) {
            // Persist the state at the time of the request.
            var requestState = state, 
            // Persist the length of the events at the time on the request.
            initialLength = clear ? 0 : searchResults.length();

            return function(data) {
                var currentLength = searchResults.length(),
                    searcher,
                    newest,
                    oldest,
                    prependRange;
                // Ignore the result if the current state doesn't equal 
                // the state when the request was made
                if (requestState !== state
                        // or there's no data returned
                        || data === null
                        || (!data.length) 
                        // or another request beat this request in.
                        || initialLength !== currentLength) {
                    return;
                }
                
                // If the list is currently empty, just push the results
                // into the list.
                if (!currentLength) {
                    searchResults.append(prepareEventData(data));
                    return;
                }
                
                oldest = searchResults.getTail().timestamp;
                // If the oldest record in the list is newer than the newest result append the result
                if (data[0].timestamp < oldest) {
                    searchResults.append(prepareEventData(data));
                    // otherwise, attempt to prepend the result.
                    // (this code should probably be moved into the prepend function of SearchResults.js
                } else {
                    data.reverse();
                    searcher = function(i) {
                        return data[i].timestamp;
                    };
                
                    newest = searchResults.getHead().timestamp;
                    prependRange = Util.findRange(searcher, data.length-1, newest+1, self.query.endTime);
                    if (prependRange) {
                        searchResults.prepend(prepareEventData(data.slice(prependRange.start, prependRange.end).reverse()));
                    }
                }
            };
        };

        // This is the primary data handling function for doing searches.
        self.dataSource = function(searchResults, clear, callback) {
            // A variable to store an error during the request phase if applicable.
            var err;
    
            // Clear the current results of they're no longer applicable.
            if (clear) {
                searchResults.clear();
            }

            var handlers = {
                success: self.makeOnRetrieveHistorySuccess(clear, searchResults),
                error: function(jqXHR, textStatus, errorThrown) {
                    // Store the error for later use.
                    err = errorThrown;
                },
                complete: function() {
                    // Invoke the callback, passing an error if one occurred.
                    callback(err);
                }
            };

            self.query.execute(options.queryUrl, handlers);
        };

        // If the TC changed we need to update the parameters of the query
        // and load new data.
        self.onTimeSelectionChanged = function(timeRange, isCurrentMode, isAutoUpdate) {
            // If this change is because of autoUpdate, ignore it.
            if (isAutoUpdate) {
                return;
            }
            self.query.startTime = timeRange.startDate;
            self.query.endTime = timeRange.endDate;
            self.query.offset = 0;
            self.query.limit = DEFAULT_QUERY_LIMIT;
            lastIncrement = 0;
            // Clear results and load new data.
            self.searchResults.loadData(true);
        };

        self.subscribe = function() {
            Util.unsubscribe(self);
            // Listen for timeSelectionChanged event and request up-to-date results.
            var handle1 = $.subscribe("timeSelectionChanged", self.onTimeSelectionChanged);
            self.subscriptionHandles = [handle1];
        };

        self.subscribe();

        // Given a filter hydrated from the URL, reconstruct the corresponding
        // FilterModel instance and return it.
        // urlFilter is:
        // * propertyName: internal name of the filter
        // * compareType: internal name of the comparison (e.g. EQ)
        // * value: the value to compare with
        self.rebuildFilter = function(urlFilter) {
            var matchingFilter = self.searchFilters.findFilter(urlFilter.propertyName);
            if (!matchingFilter) {
                return;
            }
            // Find the compare type.
            var matchingCompareType = _.find(matchingFilter.compareTypes, function(compareType) {
                return compareType.name === urlFilter.compareType;
            });
            if (!matchingCompareType) {
                return;
            }
            // Found all the info we need. Construct the FilterModel instance.
            var filterModel = new FilterModel(self.searchFilters);
            filterModel.filter(matchingFilter);
            filterModel.compareType(matchingCompareType);
            filterModel.values(urlFilter.values);
            return filterModel;
        };

        // Pull the filters off the URL, find them in self.searchFilters.filters,
        // and rebuild them for display to the user. Afterward, update the
        // query from the URL params (including the filters we now know more
        // about) and subscribe to global events.
        self.rebuildFilters = function() {
            var urlFilters = JSON.parse(UrlParams.get('filters', '[]'));
            // Do nothing if there are no filters.
            if (urlFilters) {
                _.each(urlFilters, function(urlFilter) {
                    var filterModel = self.rebuildFilter(urlFilter);
                    if (filterModel) {
                        self.searchFilters.insertFilter(filterModel);
                    }
                });
            }
            self.updateQueryFromUrlParams();
            deferredSearch.resolve();
        };

        self.searchFilters = new SearchFilters({
            filterContainer: filterElement,
            filtersUrl: options.filtersUrl,
            searchFunction: function() {
                self.search();
            },
            updateRecentFiltersUrl: options.updateRecentFiltersUrl,
            getRecentFiltersUrl: options.getRecentFiltersUrl
        });

        // We need to modify the view model that SearchResults will apply
        // bindings with to add the hasFilterNamed function.
        var modifyViewModel = function(vm) {
            // Return true if there is a filter with the given name.
            vm.hasFilterNamed = function(name) {
                return _.some(self.searchFilters.filters(), function(filter) {
                  return filter.propertyName === name;
                });
            };
        };

        self.getResults = function(serverResponse) {
            if (serverResponse) {
                if (serverResponse.errors && serverResponse.errors.length) {
                    self.searchResults.errors(serverResponse.errors);
                    return;
                }
                return prepareEventData(serverResponse);
            }
        };

        self.executeQuery = function(handlers) {
            deferredSearch.then(function() {
                // If I call query.execute directly I can't mock it in tests.
                self.query.execute(options.queryUrl, handlers);
            });
        };

        self.searchResults = new SearchResults({
            resultsContainer: listElement,
            executeQuery: self.executeQuery,
            getResults: self.getResults,
            orderingProperty: 'timestamp',
            getMaximum: function() {
              return Infinity;
            },
            modifyViewModel: modifyViewModel
        });

        self.searchResults.applyBindings();

        // Tell SearchFilters when we're loading so it can show the spinner.
        self.searchResults.loading.subscribe(function(newValue) {
            self.searchFilters.loading(newValue);
        });

        // This is to avoid showing the "No records found..." message while waiting for the context to load.
        self.searchResults.loading(true);

        // Monkeypatch the filter loader in SearchFilters. We want to customize
        // the order of the filters to put often-used ones up top.
        self.searchFilters.registerAllFilters = function(filters) {
            // Create map of propertyName to index in original list for use
            // in _.sortBy iterator below.
            var propertyNameToIndex = _.object(
                _.map(filters, function(filter, index) {
                    return [filter.propertyName, index];
                }));
            // POPULAR_FILTERS appear in order first. Then the rest in
            // alphabetical order.
            var popularSort = function(filter) {
                var popularIndex = _.indexOf(POPULAR_FILTERS, filter.propertyName);
                if (popularIndex === -1) {
                    // Not one of the popular filters, just alphabetical.
                    return propertyNameToIndex[filter.propertyName];
                } else {
                    // This returns a negative number based on the index of the
                    // propertyName in the POPULAR_FILTERS array.
                    return -POPULAR_FILTERS.length + popularIndex;
                }
            };
            var sortedFilters = _.sortBy(filters, popularSort);
            _.each(sortedFilters, self.searchFilters.registerFilter, self.searchFilters);
        };

        // Load the applicable filters from the server.
        self.searchFilters.loadFilters(self.rebuildFilters);
        
        /** Infinite Scroll **/
        var loadingNext = false, 
            $history = $(window).scroll(function(e) {
                var position = $history.scrollTop(),
                historyScrollHeight = $('body').height();
                if (!loadingNext
                        && historyScrollHeight > lastIncrement
                        && (historyScrollHeight - $history.innerHeight() - position) < 200) {
                    loadingNext = true;
                    self.query.offset = self.searchResults.length();
                    self.searchResults.loadData(function(err){
                        if(err) {
                            return true;
                        } else {
                            loadingNext = false;
                        }
                    });
                    lastIncrement = historyScrollHeight;
                }
            });

        // Search the compareTypes for this filter looking for a compare type
        // that is EQish: either 'EQ' or 'EQ_WITH_OR'.
        var findEQishName = function(filter) {
            return _.find(filter.compareTypes, function(compareType) {
                if (compareType.name.substr(0, 2) === 'EQ' ||
                        compareType.name === 'CONTAINS') {
                    return compareType.name;
                }
            });
        };
    
        // When user clicks on a link that has been decorated with a
        // data-filter attribute add a filter using the link's information.
        $(listElement).on('click', 'a', function(e) {
            var $this = $(this);
            var filterName = $this.data('filter');
            var filter;
            if (filterName) {
                filter = self.searchFilters.findFilter(filterName);
                if (filter) {
                    var value = $this.data('filter-value');
                    if (!value) {
                        value = $this.text();
                    }
                    var eqishComparatorName = findEQishName(filter);
                    if (!eqishComparatorName) {
                        console.error('No EQlike comparator for filter: %s for value: %S',
                            filterName, value);
                        return false;
                    }
                    var successful = self.searchFilters.applyFilter(
                        filter, eqishComparatorName, value);
                    if (!successful) {
                        console.error('Failed to apply filter: %s for value: %s', filterName, value);
                    }
                    return false;
                }
            }
        });

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

        // Disable auto-refresh of the TC on this page.
        $.publish('pauseAutoRefresh');

        // Check to see if we've missed the initial time range selection event.
        self.checkInitialTimeRange();
    };
});
