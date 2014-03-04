// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util"
], function(Util) {
  var selectedClass = "label-warning";
  var disabledClass = "label-default";
  /**
   * Controls Watched Directories on the browse page.
   * This class currently is not using ko because it references a jquery dataTable.
   *
   * @param options = {
   *    tableId:             (required) the table that contains a list of file/directory entries.
   *    addWatchedDirUrl:    (required) the URL to add a watched dir.
   *    removeWatchedDirUrl: (required) the URL to remove a watched dir.
   *    watchedDirs:         (optional) null or a JSON string: {
   *      results: [ {
   *        path: "..."
   *      } ]
   *    }
   * }
   */
  return function(options) {
    var i;
    var watchedPaths = {};

    if (options.watchedDirs && options.watchedDirs.results) {
      for (i = 0; i < options.watchedDirs.results.length; i+=1) {
        var path = options.watchedDirs.results[i].path;
        watchedPaths[path] = true;
      }
    }

    /**
     * Adds a watched dir.
     * @param path The directory's path.
     * @param $elem The element with class .watchedDir.
     */
    var addDir = function(path, $elem) {
      var onAddSuccess = function(response) {
        if (response === "OK") {
          watchedPaths[path] = true;
          $elem.addClass(selectedClass).removeClass(disabledClass);
        } else {
          Util.filterError(response);
        }
      };

      var urlParams = {
        path: path
      };
      $.post(options.addWatchedDirUrl, urlParams, onAddSuccess);
    };

    /**
     * Removes a watched dir.
     * @param path The directory's path.
     * @param $elem The element with class .watchedDir.
     */
    var removeDir = function(path, $elem) {
      var onRemoveSuccess = function(response) {
        if (response === "OK") {
          delete watchedPaths[path];
          $elem.removeClass(selectedClass).addClass(disabledClass);
        } else {
          Util.filterError(response);
        }
      };

      var urlParams = {
        path: path
      };
      $.post(options.removeWatchedDirUrl, urlParams, onRemoveSuccess);
    };

    /**
     * A FileSearchResult data is rendered (hidden) in the row.
     */
    var getDataFromEvent = function(evt) {
      var $target = $(evt.target);
      var dataStr = $target.closest("tr").find(".data").text();
      return $.parseJSON(dataStr);
    };

    /**
     * Handles when the table is clicked.
     */
    $("#" + options.tableId).click(function(evt) {
      var $target = $(evt.target);
      if (!$target.is(".watchedDir")) {
        $target = $target.closest(".watchedDir");
      }
      if ($target.length > 0) {
        var data = getDataFromEvent(evt);
        if ($target.hasClass(selectedClass)) {
          removeDir(data.path, $target);
        } else {
          addDir(data.path, $target);
        }
      }
    });

    return {
      isDirWatched: function(path) {
        return watchedPaths[path] === true;
      },

      renderIcon: function(path) {
        var watched = this.isDirWatched(path);
        var clazz = watched ? selectedClass : disabledClass;
        return '<div class="watchedDir label ' + clazz + '"><i class="icon-white icon-star"></i></div>';
      }
    };
  };
});
