// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/headlamp/hdfs/include/WatchedDirsManager',
  'cloudera/Util',
  'cloudera/TestUtil'
], function(WatchedDirsManager, Util, TestUtil) {
  describe("WatchedDirsManager tests", function() {
    var module, somePath = "/hbase/myPath", tableId = "myFileSearchTableForWatchedDirs";
    var baseOptions = {
      tableId: tableId,
      addWatchedDirUrl: "dontcare",
      removeWatchedDirUrl: "dontcare"
    };
    beforeEach(function() {
      var $table = $("<table>").attr("id", tableId).appendTo(document.body);
      var $tbody = $("<tbody>").appendTo($table);
      var $tr = $("<tr>").appendTo($tbody);
      $("<td>").addClass("watchedDir").appendTo($tr);

      var dataStr = JSON.stringify({
        path: somePath
      });
      $("<td>").addClass("data").text(dataStr).appendTo($tr);
    });

    afterEach(function() {
      $("#" + tableId).remove();
    });

    function simulateWatchRequest(responseText) {
      $("td.watchedDir").trigger("click");
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: responseText,
        contentType: "text/html"
      });
    }

    it("should test isDirWatched when a directory is initially watched", function() {
      var options = $.extend({}, baseOptions, {
        watchedDirs: {
          results: [{
            path: somePath
          }]
        }
      });
      module = new WatchedDirsManager(options);
      expect(module.isDirWatched(somePath)).toBeTruthy();
    });

    it("should test addDir and removeDir", function() {
      module = new WatchedDirsManager(baseOptions);
      // Initially not watched.
      expect(module.isDirWatched(somePath)).toBeFalsy();

      // Not watched to watched OK.
      simulateWatchRequest("OK");
      expect(module.isDirWatched(somePath)).toBeTruthy();

      // Watched to not watched OK.
      simulateWatchRequest("OK");
      expect(module.isDirWatched(somePath)).toBeFalsy();
    });

    it("should test addDir and removeDir with errors", function() {
      module = new WatchedDirsManager(baseOptions);
      spyOn(Util, "filterError");

      // Initially is not watched.
      expect(module.isDirWatched(somePath)).toBeFalsy();

      // Not watched to watched.
      simulateWatchRequest("OK");
      expect(module.isDirWatched(somePath)).toBeTruthy();

      // Watched to not watched failed, still watched.
      var failedToRemoveMsg = "Failed to remove";
      simulateWatchRequest(failedToRemoveMsg);
      expect(module.isDirWatched(somePath)).toBeTruthy();
      expect(Util.filterError).wasCalledWith(failedToRemoveMsg);

      // Watched to not watched OK.
      simulateWatchRequest("OK");
      expect(module.isDirWatched(somePath)).toBeFalsy();

      // Not watched to watched failed, still not watched.
      var failedToAddMsg = "Failed to add";
      simulateWatchRequest(failedToAddMsg);
      expect(module.isDirWatched(somePath)).toBeFalsy();
      expect(Util.filterError).wasCalledWith(failedToAddMsg);
    });

    function compareHTML(html1, html2) {
      var diffs = TestUtil.compareHTML(html1, html2);
      expect(diffs).toEqual([]);
    }

    it("should test renderIcon", function() {
      var options = $.extend({}, baseOptions, {
        watchedDirs: {
          results: [{
            path: somePath
          }]
        }
      });
      module = new WatchedDirsManager(options);

      var selectedText = '<div class="watchedDir label label-warning"><i class="icon-white icon-star"></i></div>';
      compareHTML(module.renderIcon(somePath), selectedText);

      var notSelectedText = '<div class="watchedDir label label-default"><i class="icon-white icon-star"></i></div>';
      compareHTML(module.renderIcon("anotherPath"), notSelectedText);
    });
  });
});
