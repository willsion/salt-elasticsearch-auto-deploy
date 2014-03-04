// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util"
], function(Util) {

return function(options){

  var activeTooltipIndex = null;
  var containerSelector = "#" + options.containerId;

  var getSpinner = function() {
    return $("#searchFilterContainer").find(".IconSpinner16x16, .IconSpinner24x24");
  };

  var hideSpinnerIcon = function() {
    getSpinner().addClass("hidden");
  };

  var showSpinnerIcon = function() {
    getSpinner().removeClass("hidden");
  };

  var cleanupTooltips = function() {
    $(containerSelector).find(".showTooltip").each(function(index, item){
      var $item = $(item);
      // If the tooltip plugin was applied, the <tr> will now have a
      // data-original-title attribute.
      if ($item.attr("data-original-title")) {
        $item.tooltip("hide");
        $item.off("mouseenter");
        $item.off("mouseleave");
      }
    });
  };

  var setupTooltips = function() {
    $(containerSelector).find(".showTooltip").each(function(index, item){
      var $item = $(item);
      if ($item.attr("title")) {
        $item.tooltip({
          placement: "bottom"
        });
        $item.mouseenter(function(event){
          $item.tooltip("show");
          activeTooltipIndex = index;
        });
        $item.mouseleave(function(event){
          $item.tooltip("hide");
          activeTooltipIndex = null;
        });
        if (index === activeTooltipIndex) {
          $item.tooltip("show");
        }
      }
    });
  };

  /**
   * Updates the table via AJAX.
   */
  var updateTable = function(updateUserSettings) {
    options.urlParams.updateSettings = updateUserSettings;
    var url = options.url + "?" + jQuery.param(options.urlParams);
    showSpinnerIcon();

    $.post(url, function(response) {
      try {
        cleanupTooltips();
        $(containerSelector).html(Util.filterError(response));
        hideSpinnerIcon();
        setupTooltips();
      } catch (ex) {
        console.log(ex);
      }
    });
  };

  var resetPageNumber = function() {
    // go back to the first page.
    options.urlParams["pageDescriptor.pageNumber"] = 0;
  };

  /**
   * Handles time range change.
   */
  var handleTimeChange = function(range, currentMode) {

    options.urlParams.startTime = range.startDate.getTime();
    options.urlParams.endTime = range.endDate.getTime();

    if (!currentMode) {
      // Manual time range change.
      resetPageNumber();
      updateTable(true);
    } else {
      updateTable(false);
    }
  };

  /**
   * Handles row filtering.
   */
  var handleFilterChange = function(filter, selectedQueryName) {

    var name;
    // remove existing filters.
    for (name in options.urlParams) {
      if (options.urlParams.hasOwnProperty(name)) {
        if (name.indexOf("filter") === 0) {
          // OK, this is a filter.
          if (filter[name] === undefined) {
            // We don't see it in the new filter
            delete options.urlParams[name];
          }
        }
      }
    }

    // use the new filters.
    for (name in filter) {
      if (filter.hasOwnProperty(name)) {
        options.urlParams[name] = filter[name];
      }
    }

    options.urlParams.selectedQueryName = selectedQueryName;

    resetPageNumber();
    updateTable(true);
  };

  /**
   * Handles sorting.
   */
  var handleSortChange = function(columnName, direction) {
    var prefix = "";
    if (direction === "sorting_desc") {
      prefix = "-";
    }
    // the sort parameter is -columnName or columnName.
    // This is inherited from Dojo's Data Grid's convention.
    options.urlParams.sort = prefix + columnName;
    // always go back to the first page on sort change.
    
    resetPageNumber();
    updateTable(true);
  };

  /**
   * Handles pagination.
   */
  var handlePagination = function(offset, limit) {
    options.urlParams["pageDescriptor.pageNumber"] = offset/limit;
    options.urlParams["pageDescriptor.pageSize"] = limit;
    updateTable(true);
  };


  jQuery.subscribe("timeSelectionChanged", handleTimeChange);
  jQuery.subscribe("searchFilterChanged", handleFilterChange);

  /**
   * A single click handler at the container level.
   * This is important because the table gets swapped out via AJAX,
   * so we cannot place any click handlers on the table
   * or any elements within the table.
   */
  $(containerSelector).click(function(evt) {
    var $target = $(evt.target);
    var $th = $target.closest("th");

    var columnName = $th.attr("name");
    if ($th.hasClass("sorting") || $th.hasClass("sorting_desc")) {
      // Not sorted (but sortable) or sorted in descending order.
      // Now sort it in ascending order.
      evt.preventDefault();
      return handleSortChange(columnName, "sorting_asc");
    } else if ($th.hasClass("sorting_asc")) {
      // Already sorted in ascending order.
      // Now sort it in descending order.
      evt.preventDefault();
      return handleSortChange(columnName, "sorting_desc");
    }

    // Handles previous and next.
    if ($target.attr("id") === options.containerId + "_previous" ||
        $target.attr("id") === options.containerId + "_next") {
      var href = $target.attr("href");
      var params = Util.unparam(href.substring(href.indexOf("?") + 1));
      evt.preventDefault();
      return handlePagination(params.offset, params.limit);
    }
  });
};

});
