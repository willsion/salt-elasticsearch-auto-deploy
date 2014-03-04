// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/common/repeat",
  "cloudera/common/I18n"
], function(_, repeat, I18n) {

  /**
   * @param {Object} options e.g. {
   *   container:          (required) the containing element,
   *   topLevelSummaryUrl: (required) "URL",
   *   updateIntervalInMS: (optional) to fetch the top level summary
   *   or 0, undefined means we should only fetch once.
   * }
   */
  return function(options) {
    var self = this;
    var $container = $(options.container);
    var label;

    self.applyTab = function($tab, clazz, text, title) {
      if (text === 0) {
        $tab.find(".label").remove();
      } else if ($tab.find(".label").length !== 0) {
        label = $tab.find(".label")
          .removeClass()
          .addClass("label")
          .text(text);
        if (clazz !== undefined) {
          label.addClass(clazz);
        }
        if (title !== undefined) {
          label.attr('title', title);
        }
      } else {
        label = $("<span>")
          .addClass("label")
          .text(text);
        if (clazz !== undefined) {
          label.addClass(clazz);
        }
        if (title !== undefined) {
          label.attr('title', title);
        }
        label.appendTo($tab);
      }
    };

    self.responseHandler = function(response) {
      var $healthTab = $container.find(".home-health");
      var $configTab = $container.find(".home-configuration");
      var $commandsTab = $container.find(".home-commands");

      var healthClass, healthCount, configClass, configText, configTitle;

      if (response.health.critical > 0) {
        healthClass = "label-important";
        healthCount = response.health.critical;
      } else {
        healthClass = "label-warning";
        healthCount = response.health.warning;
      }

      if (response.actionables.timedOut) {
        configText = '...';
        configTitle = I18n.t("ui.computingActionables");
      } else if (response.actionables.critical > 0) {
        configClass = "label-important";
        configText = response.actionables.critical;
      } else {
        configClass = "label-warning";
        configText = response.actionables.warning;
      }
      var commandsClass = "label-info";
      var commandsCount = response.commands.running;

      self.applyTab($healthTab, healthClass, healthCount, undefined);
      self.applyTab($configTab, configClass, configText, configTitle);
      self.applyTab($commandsTab, commandsClass, commandsCount, undefined);
    };

    var xhr = $.get(options.topLevelSummaryUrl, self.responseHandler);

    if (_.isNumber(options.updateIntervalInMS) && options.updateIntervalInMS > 0) {
      xhr.repeat(options.updateIntervalInMS).start();
    }
  };
});
