// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/headlamp/hdfs/include/FileSearchResultListView'
], function(FileSearchResultListView) {
  describe("FileSearchResultListView Tests", function() {
    var mockWatchedDirsManager = {
      isDirWatched: function() {
        return true;
      },
      // Sometimes, mockWatchedDirsManager.renderIcon is mocked,
      // but sometimes it is actually called, so we can't
      // use jasmine.createSpy("renderIcon")
      renderIcon: function() {
        return "";
      }
    };

    var module, tableId = "myFileSearchTable", baseOptions = {
      searchUrl: "dontcare",
      tableId: tableId,
      path: "/hbase",
      watchedDirsManager: mockWatchedDirsManager
    };

    beforeEach(function() {
      var $table = $("<table>").attr("id", tableId);
      var $tbody = $("<tbody>").appendTo($table);
      $table.appendTo(document.body);
    });

    afterEach(function() {
      module.unsubscribe();
      $("#" + tableId).remove();
    });

    it("should trigger watchedDirsManager.renderIcon twice because there are two directories", function() {
      module = new FileSearchResultListView(baseOptions);
      spyOn(mockWatchedDirsManager, "renderIcon").andCallThrough();

      // Simulate a search.
      var searchUrl = "dontcare";
      var searchJson = {};
      $.publish("fileSearchFilterChanged", [searchUrl, searchJson]);

      var request = mostRecentAjaxRequest();
      var sampleResponse = {
        "results":[{
          "path":"/hbase",
          "owner":"hbase",
          "group":"hbase",
          "mode":16877,
          "mtime":1369521795128,
          "size":4939,
          "diskspaceQuota":-1,
          "namespaceQuota":-1,
          "atime":15128,
          "fileCount":35,
          "rawSize":14817
        },{
          "path":"/user",
          "owner":"hdfs",
          "group":"hdfs",
          "mode":16877,
          "mtime":1369521795128,
          "size":4939,
          "diskspaceQuota":-1,
          "namespaceQuota":-1,
          "atime":15128,
          "fileCount":35,
          "rawSize":14817
        },{
          "path":"file",
          "owner":"hdfs",
          "group":"supergroup",
          "mode":33188,
          "mtime":1369530615129,
          "size":63318972,
          "diskspaceQuota":-1,
          "namespaceQuota":-1,
          "atime":15129,
          "fileCount":209,
          "rawSize":189956916
        }]
      };

      request.response({
        status: 200,
        responseText: JSON.stringify(sampleResponse)
      });
      // 2 folders, 1 file, renderIcon should be called only on folders.
      expect(mockWatchedDirsManager.renderIcon.callCount).toEqual(2);
    });

    it("should test the initial query on page load", function() {
      spyOn($, "post").andCallThrough();
      var options = $.extend({}, baseOptions, {
        queryTerms: {}
      });

      module = new FileSearchResultListView(options);
      expect($.post).wasCalled();

      // Need to generate a fake request because
      // because otherwise, an empty response will
      // trigger an alert due to jQuery's dataTable plugin.
      var request = mostRecentAjaxRequest();
      var sampleResponse = {
        "results":[{
          "path":"file",
          "owner":"hdfs",
          "group":"supergroup",
          "mode":33188,
          "mtime":1369530615129,
          "size":63318972,
          "diskspaceQuota":-1,
          "namespaceQuota":-1,
          "atime":15129,
          "fileCount":209,
          "rawSize":189956916
        }]
      };
      request.response({
        status: 200,
        responseText: JSON.stringify(sampleResponse)
      });
    });
  });
});
