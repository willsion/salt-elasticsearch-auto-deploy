// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "underscore"
], function(Util, _) {
  /**
   * Handles filter on the Config screen.
   */
  return function(options) {

    // we either search for pattern or configSearchvalue
    // but not both at the same time.
    // This mimics Google Chrome's Preferences UI.

    var parentPattern = "";
    var keyPattern = "";
    // These are needed in IE8 because IE8's innerHTML property
    // strips out quotes for HTML attribute.
    var parentPatternWithoutQuotes = "";
    var keyPatternWithoutQuotes = "";
    var configSearchValue = "";

    var filterEmptyConfigHeaderRows = function() {
      $("tr.toolbar").each(function(i, row) {
        var visibleCount = 0;
        $(row).nextUntil("tr.toolbar", "tr").each(function(j, configRow) {
          if (!$(configRow).is(":hidden")) {
            visibleCount += 1;
          }
        });

        if (visibleCount > 0) {
          $(row).removeClass("notSection");
        } else {
          $(row).addClass("notSection");
        }
      });
    };

    /**
     * Filter to show only those config rows that contain one of the tokens via
     * Lower case match. When multiple search terms are entered, this
     * searches each search term individually. and will only show those
     * entries that match all the terms. So 'Java Heapsize' and 'heapsize
     * Java' both match to the same entries.
     *
     * @param tokens - terms to search for.
     * @param parentPattern - string to search for when filtering on a specific group.
     * @param keyPattern - string to search for when filtering on a specific group.
     * We need both because the keyPattern is not be unique. (Multiple Advanced group for example)
     * @param source - string that identifies the event that
     * the filtering activity is initiated from.
     */
    var filterConfigRow = function(tokens, parentPattern, keyPattern, source) {
      $("tr.configRow").each(function(i, row) {
        var $row = $(row);
        var category = $row.find(".category").html().toLowerCase();
        var name = $row.find(".name").html().toLowerCase();
        var hide = false;

        // search by keyword tokens
        if (tokens.length !== 0) {
          var value = $row.find(".value").html()
              .toLowerCase();
          var desc = $row.find(".description").html()
              .toLowerCase();

          $.each(tokens, function(i, token) {
            if (category.indexOf(token) === -1 &&
              name.indexOf(token) === -1 &&
              value.indexOf(token) === -1 &&
              desc.indexOf(token) === -1) {
              hide = true;
            }
          });
        }

        // We need to differentiate two types
        // of hiding:
        // 1. because the entry didn't match any tokens.
        // 2. because the entry didn't match the keyPattern/parentPattern
        // combination that identifies the navigation tree.
        if (hide) {
          $row.addClass("notKeyword");
        } else {
          $row.removeClass("notKeyword");
        }

        // search by parent and key
        if ((category.indexOf(keyPattern) === -1 && category.indexOf(keyPatternWithoutQuotes) === -1) ||
          (category.indexOf(parentPattern) === -1 && category.indexOf(parentPatternWithoutQuotes) === -1)) {
          $row.addClass("notSection");
        } else {
          $row.removeClass("notSection");
        }

        $row = null;
      });
      filterEmptyConfigHeaderRows();
      // We need to do this because publish is
      // a synchronized event.
      // When filtering is invoked from another
      // event A, we cannot publish this event yet
      // because other modules may not have
      // received the previous event A yet.
      setTimeout(function(){
        $.publish("configFilterChanged", [source]);
      }, 0);
    };

    var filterConfig = function(source) {
      var tokens = $.trim(configSearchValue.toLowerCase()).split(" ");
      filterConfigRow(tokens, parentPattern, keyPattern, source);
    };

    var onConfigNavChanged = function(parent, key) {
      if (parent !== parentPattern || key !== keyPattern) {
        parentPattern = parent;
        parentPatternWithoutQuotes = parentPattern.replace(/\"/g, "");

        keyPattern = key;
        keyPatternWithoutQuotes = keyPattern.replace(/\"/g, "");

        configSearchValue = "";

        filterConfig("configNavChanged");
      }
    };

    var onConfigSearchChanged = function(value) {
      if (_.isEmpty(value)) {
        $(".removeFilterButton").trigger("click");
        return;
      }

      if (value !== configSearchValue) {
        configSearchValue = value;

        parentPattern = "";
        parentPatternWithoutQuotes = "";

        keyPattern = "";
        keyPatternWithoutQuotes = "";

        $('tr.configRow .category').removeClass('hidden');
        $('tr.headerRow .category').removeClass('hidden');
        $('col.category').removeClass('hidden');
        $('#cmfConfigLeftBar').addClass('hidden');

        filterConfig("configSearchChanged");
      }
    };

    $.subscribe("configNavChanged", onConfigNavChanged);
    $.subscribe("configSearchChanged", onConfigSearchChanged);

  };
});
