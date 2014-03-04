// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/chart/TimeControlledContent",
  "cloudera/chart/TimeRange"
], function(Util, TimeControlledContent, TimeRange) {

  return function(options) {
    var self = this;
    var $container = $(options.containerSelector);
    var MENU_ITEM_HEIGHT = 26;
    var DIVIDER_ITEM_HEIGHT = 20;

    var getSpinner = function() {
      return $container.find(".status-result-spinner");
    };

    self.subscriptionHandles = [];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    $("#healthIssuesPopup, #configIssuesPopup, #configStalePopup").on("hidden", function() {
      $.publish("unpauseAutoRefresh");
    });

    $container.on("click", ".config-issues-link", function(e) {
      var $link = $(e.target).closest(".config-issues-link");
      $.publish("configIssuesFilterChanged", [$link.data("serviceName"),
        $link.data("clusterName")]);
      $.publish("pauseAutoRefresh");
      $("#configIssuesPopup").modal("show");
    });

    $container.on("click", ".health-issues-link", function(e) {
      var $link = $(e.target).closest(".health-issues-link");
      $.publish("healthIssuesFilterChanged", [$link.data("serviceName"),
        $link.data("clusterName")]);
      $.publish("pauseAutoRefresh");
      $("#healthIssuesPopup").modal("show");
    });

    $container.on("click", ".config-stale-link", function(e) {
      var $link = $(e.target).closest(".config-stale-link");
      $.publish("pauseAutoRefresh");
      $("#configStalePopup").modal("show");
    });

    var updateDropdownOrientation = function() {
      var $table = $(options.containerSelector).find(".status-table");
      var maxHeight = $(document).height();
      $.each($table.find(".serviceCommands"), function(i, elem) {
        var $elem = $(elem);
        var $menuEntries = $elem.find(".dropdown-menu li");
        var $dividers = $elem.find(".dropdown-menu li.divider");
        var menuHeight = ($menuEntries.length - $dividers.length) * MENU_ITEM_HEIGHT
          + $dividers.length * DIVIDER_ITEM_HEIGHT;
        if ($elem.offset().top + $elem.height() + menuHeight > maxHeight) {
          $elem.addClass("dropup");
        } else {
          $elem.removeClass("dropup");
        }
      });
    };

    $(window).resize(Util.throttle(updateDropdownOrientation, 500));

    var beforeFetch = function() {
      getSpinner().show();
    };

    var beforeUpdate = function($filteredResponse) {
      var $resultContainer = $("<div>").html($filteredResponse);
      $resultContainer.find(".status-table").each(function(i, resultTable) {
        var $resultTable = $(resultTable);
        var idSelector = "#" + $resultTable.attr("id");
        var $currentTable = $container.find(idSelector);
        if ($currentTable.is(":hidden")) {
          $resultTable.hide();
          $resultTable.prev("div").find(".toggle-icon")
            .removeClass("icon-chevron-down")
            .addClass("icon-chevron-right");
        }
      });
      return $resultContainer.html();
    };

    var afterUpdate = function() {
      updateDropdownOrientation();
      getSpinner().hide();
      var getTimedOut = $container.find(".smon-timed-out-state").text();
      if (getTimedOut === "true") {
        $(options.smonTimedOutSelector).show();
      } else {
        $(options.smonTimedOutSelector).hide();
      }
    };

    var opts = {
      urlParams: {
        timestamp: options.timestamp,
        currentMode: options.currentMode
      },
      isCurrentMode: options.currentMode,
      beforeFetch: beforeFetch,
      beforeUpdate: beforeUpdate,
      afterUpdate: afterUpdate,
      updateOnPageLoad: true,
      url: options.ajaxURL,
      containerSelector: options.contentSelector
    };

    var timeControlledContent = new TimeControlledContent(opts);
  };
});
