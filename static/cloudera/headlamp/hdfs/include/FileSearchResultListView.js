// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/headlamp/hdfs/include/FileSearchResultTable"
], function(Util, FileSearchResultTable) {

  /**
   * Listens for "fileSearchFilterChanged" event,
   * and re-renders the table.
   *
   * @param options {
   *     searchUrl:  (required) "the URL to perform file search",
   *     tableId:    (required) "the ID of the table",
   *     path:       (required) "the path of the current directory",
   *     queryTerms: (optional) {
   *         data: [{
   *             // see QueryTerm.js
   *         }, {
   *             // see QueryTerm.js
   *         }]
   *     },
   *     watchedDirsManager: (required) something to add or remove watched dirs.
   * }
   */
  return function(options) {
    var initialized = false;
    var resultTable = new FileSearchResultTable(options);

    var populateData = function(response) {
      $(".fetchingData").addClass("hidden");
      // the response corresponds to a JSON array.
      // Each row is represented by the FileSearchResult Java Class.
      var filteredResponse = Util.filterJsonResponseError(response);
      if (filteredResponse && filteredResponse.results) {
        resultTable.render(filteredResponse.results, initialized);
        initialized = true;
      }
    };

    var onSearchFilterChanged = function(searchUrl, searchJson) {
      var params = {
        json: searchJson
      };
      $(".fetchingData").removeClass("hidden");
      $.post(searchUrl, params, populateData);
    };

    // initial query on page load.
    if (options.queryTerms) {
      onSearchFilterChanged(options.searchUrl, JSON.stringify(options.queryTerms));
    }

    var handle1 = jQuery.subscribe("fileSearchFilterChanged", onSearchFilterChanged);
    this.subscriptionHandles = [handle1];
    this.unsubscribe = function() {
      Util.unsubscribe(this);
    };
  };
});
