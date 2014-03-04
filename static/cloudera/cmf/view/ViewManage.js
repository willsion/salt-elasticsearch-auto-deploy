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
   *   viewPageUri: (required) "uri to a view",
   *   renameUri:   (required) "uri to rename a view",
   *   removeUri:   (required) "uri to remove a view",
   *   importDialog:(required) "DOM or selector for the import dialog",
   *   viewsByName: (required) a map of { name -> view }.
   * };
   */
  function ViewManage(options) {
    /**
     * Represents a view entry.
     */
    function ViewEntry(viewName) {
      this.name = viewName;
      this.view = options.viewsByName[viewName];
      this.href = options.viewPageUri + "?viewName=" + encodeURIComponent(viewName);
      this.owner = this.view ? this.view.owner : "";
      this.confirmMode = ko.observable(false);
      this.showConfirm = function() {
        this.confirmMode(true);
      };
      this.hideConfirm = function() {
        this.confirmMode(false);
      };
      this.remove = function() {
        var urlParams = {
          viewName: viewName
        };
        $.post(options.removeUri, urlParams, function(response) {
          if (response.message === "OK") {
            $.publish("viewRemoved", [viewName]);
          } else {
            $.publish("showError", [response.message]);
          }
        });
      };
    }

    function viewFactory(viewName) {
      return new ViewEntry(viewName);
    }

    var self = this;

    var listOptions = {
      viewNames: _.keys(options.viewsByName),
      viewFactory: viewFactory
    };

    self.list = new ViewList(listOptions);

    var $importDialog = $(options.importDialog);

    self.showImportDialog = function() {
      $importDialog.modal("show").find("input[type=text]").focus();
    };

    self.hideImportDialog = function() {
      $importDialog.modal("hide");
    };

    self.viewName = ko.observable("");
    self.viewData = ko.observable("");

    self.submitButtonEnabled = ko.computed(function() {
      return self.viewName() !== '' && self.viewData() !== '';
    });

    this.unsubscribe = function() {
      this.list.unsubscribe();
    };

    ko.applyBindings(self, $(options.container)[0]);
  }

  return ViewManage;
});
