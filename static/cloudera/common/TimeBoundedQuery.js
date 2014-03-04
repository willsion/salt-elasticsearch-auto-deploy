// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'cloudera/common/TimeUtil',
  'underscore'
], function(Util, TimeUtil, _) {
  // Create a query suitable for talking to the server and retrieving
  // a list of objects matching this query.
  // * startTime: a Date object marking the beginning of the query.
  // * endTime: a Date object marking the end of the query.
  // * filters: a list of EventFilter objects. All objects returned will match
  //   the given filters (as though they were ANDed together).
  // * offset: for paging, how many objects the server will skip before
  //   returning the data set.
  // * limit: how many objects to return in a single page.
  var TimeBoundedQuery = function(startTime, endTime, filters, offset, limit) {
    this.startTime = startTime || TimeUtil.getServerNow();
    this.endTime = endTime || TimeUtil.getServerNow();
    this.filters = filters || [];
    this.offset = offset || 0;
    this.limit = limit || 50;
  };

  // Called to return an object that can be passed to jQuery $.getJSON
  // as the URL params.
  TimeBoundedQuery.prototype.getParams = function() {
    return {
      startTime: this.startTime.getTime(),
      endTime: this.endTime.getTime(),
      filters: JSON.stringify(this.filters),
      offset: this.offset,
      limit: this.limit
    };
  };

  TimeBoundedQuery.prototype.isValid = function() {
    return _.isObject(this.startTime) && _.isObject(this.endTime);
  };

  // Returns true if a query to the server is already in-flight.
  TimeBoundedQuery.prototype.isInflight = function() {
    return this.jqXHR && this.jqXHR.status === undefined;
  };

  // Abort an in-flight query.
  TimeBoundedQuery.prototype.abort = function() {
    if (this.jqXHR) {
      this.jqXHR.abort();
    }
  };

  // Query the server.
  // * url: the URL of the server to GET the results from.
  // * handlers: an object specifying the following optional functions:
  //   * success
  //   * error
  //   * complete
  TimeBoundedQuery.prototype.execute = function(url, handlers) {
    // jqXHR.status being undefined means the last request is still in process.
    if (this.isInflight()) {
      console.warn('Attempted query while query in-flight.');
      return;
    }
    if (!this.isValid()) {
      console.warn('Attempted to query events with invalid parameters.');
      return;
    }
    var ajaxOptions = {
      dataType: 'json',
      url: url,
      data: this.getParams()
    };
    var assignIfPresent = function(name) {
      if (handlers.hasOwnProperty(name)) {
        ajaxOptions[name] = handlers[name];
      }
    };
    // TODO: Change to done, fail, and always before upgrading past jQuery 1.8.
    assignIfPresent('success');
    assignIfPresent('error');
    assignIfPresent('complete');
    // Make the request.
    var jqXHR = this.jqXHR = $.ajax(ajaxOptions);
    return jqXHR;
  };

  return TimeBoundedQuery;
});
