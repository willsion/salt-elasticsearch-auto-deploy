// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/I18n",
  "cloudera/common/SessionStorage",
  "underscore"
], function(I18n, SessionStorage, _) {
  /**
   * Manages the flag that determines the show/hide state
   * of the log content.
   *
   * options = {
   *   container: "DOM or selector element of the parent",
   *   id: "identifier for this instance",
   *   url: "URL to fetch the latest tail"
   * }
   */
  return function ProcessLogDisplay(options) {
    var $container = $(options.container),
      url = options.url,
      prefix = "com.cloudera.cmf.include.ProcessLogDisplay.";

    function toggleLogDisplay() {
      $container.find(".expandLogTails").toggleClass("hidden");
      $container.find(".collapseLogTails").toggleClass("hidden");
      return $container.find(".LogTails").toggleClass("hidden").is(":visible");
    }

    // options.id contains role id and process id.
    var showHideKey = prefix + "show." + options.id;
    var currentShowValue = SessionStorage.getItem(showHideKey);
    if (currentShowValue) {
      toggleLogDisplay();
    }

    // Set up the toggling of the "show/hide" recent logs.
    $container.find(".toggleLink").click(function(evt) {
      evt.preventDefault();
      var isVisible = toggleLogDisplay();
      SessionStorage.setItem(showHideKey, isVisible);
    });

    var tabIndexKey = prefix + "tab." + options.id;

    var $tabs = $container.find("a[data-toggle=tab]");
    $tabs.on("shown", function(e) {
      var index = 0, $target = $(e.target);
      _.each($tabs, function(tab, i) {
        if ($target.is($(tab))) {
          index = i;
        }
      });
      SessionStorage.setItem(tabIndexKey, index);
    });

    // When we click on the role tab, we fetch the latest tail from the server.
    // This is done by listening on the shown event from the tab.
    $container.find(".cmfRoleTab").on("shown", function (e) {
      jQuery.ajax({
        url: url,
        dataType: "text",
        cache: false,
        success: function(data) {
          $container.find(".cmfRoleTail pre").html(data);
        },
        error: function(data) {
          $container.find(".cmfRoleTail pre").html(I18n.t("ui.sorryAnError"));
        }
      });
    });

    var currentShownTab = SessionStorage.getItem(tabIndexKey);
    if (_.isNumber(currentShownTab)) {
      $container.find(".nav-tabs a:eq(" + (currentShownTab) + ")").tab('show');
    } else {
      // This selects the first tab to be the active one. We do this once since,
      // we don't want to reset the active tab when we again show the tab.
      $container.find(".nav-tabs a:first").tab('show');
    }
  };
});
