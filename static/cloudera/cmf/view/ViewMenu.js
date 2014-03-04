// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/cmf/view/ViewList",
  "underscore",
  "knockout"
], function (Util, ViewList, _, ko)  {

  /**
   * options = {
   *   container:   (required) "DOM or selector for the container",
   *   viewPageUri: (required) "base uri to a view",
   *   viewNames:   (required) a list of view names
   * };
   */
  function ViewMenu(options) {
    /**
     * Represents a view entry.
     */
    function ViewMenuEntry(viewName) {
      this.name = viewName;
      this.href = options.viewPageUri + "?viewName=" + encodeURIComponent(viewName);
    }

    function viewFactory(viewName) {
      return new ViewMenuEntry(viewName);
    }

    var listOptions = {
      viewNames: options.viewNames,
      viewFactory: viewFactory,
      showTopN: 20
    };

    this.list = new ViewList(listOptions);
    ko.applyBindings(this.list, $(options.container)[0]);

    this.unsubscribe = function() {
      this.list.unsubscribe();
    };
  }

  return ViewMenu;
});
