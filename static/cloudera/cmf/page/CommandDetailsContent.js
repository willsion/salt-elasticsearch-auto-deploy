// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/common/SessionStorage",
  "underscore"
], function(SessionStorage, _) {
  /**
   * options = {
   *   commandId: the id of the command.
   *   isSummaryEmpty: true|false, if it is set, then use that value.
   *     if it is empty, then by default we should show the child commands table.
   *     if it is not, then by default we should hide the child commands table.
   * }
   */
  return function(options) {
    var $childCommandsTitle = $(".child-commands-title[data-command-id=" + options.commandId + "]");
    var $childCommandsContent = $(".child-commands-content[data-command-id=" + options.commandId + "]");

    var visibleKey = "com.cloudera.cmf.CommandDetailsContent.childCommand.visibleState." + options.commandId;
    var visibleState = SessionStorage.getItem(visibleKey);
    if (_.isNull(visibleState)) {
      visibleState = options.isSummaryEmpty;
    }

    if (visibleState) {
      // The Content is hidden by default.
      $childCommandsTitle.trigger("click");
    }
    $childCommandsTitle.show();

    $childCommandsTitle.on("click", function(evt) {
      // Clicking on the title toggles the visibility of the content.
      // Remember it in SessionStorage.
      SessionStorage.setItem(visibleKey, !$childCommandsContent.is(":visible"));
    });
  };
});
