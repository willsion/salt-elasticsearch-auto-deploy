// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "underscore",
  "knockout",
  "cloudera/cmf/view/ViewList"
], function (Util, _, ko, ViewList) {

  /**
   * A common method that should be called
   * when adding something to a view.
   *
   * This notifies another module on the page
   * that should handle the appropriate addToView
   * action.
   */
  function addToView(viewName, callback) {
    $.publish("addToView", [viewName, callback]);
  }

  function getViewNames(options) {
    // Sort the views by display name.
    var systemViewNames = _.chain(options.systemViewNames).map(function(v, k) {
      return {
        name: k,
        value: v
      };
    }).sortBy(function(entry) {
      return entry.value;
    }).map(function(entry) {
      return entry.name;
    }).value();

    return _.union(options.userCreatedViewNames, systemViewNames);
  }

  /**
   * options = {
   *   dialog: (required) "the selector or the DOM element of the new view dialog"
   * }
   */
  function NewViewDialog(options) {
    var self = this, $dialog = $(options.dialog);

    /**
     * Gets the input element for the view name.
     */
    self.getViewNameInput = function() {
      return $dialog.find("input[name=viewName]");
    };

    /**
     * Add the selection to a new view.
     * If the view already exists, just add the selection
     * to that view anyway.
     */
    self.createNewView = function() {
      var $input = self.getViewNameInput();
      if ($input.val() !== "") {
        $input.closest(".control-group").removeClass("error");
        addToView($input.val(), self.hide);
      } else {
        $input.closest(".control-group").addClass("error");
      }
    };

    /**
     * Shows the dialog.
     */
    self.show = function() {
      $dialog.modal("show");
      self.getViewNameInput()
        .focus().select()
        .closest(".control-group")
          .removeClass("error");
    };

    /**
     * Hides the dialog.
     */
    self.hide = function() {
      $dialog.modal("hide");
    };

    ko.applyBindings(this, $dialog[0]);
  }

  /**
   * options = {
   *   dialog:    (required) "the selector or the DOM element of the select view dialog",
   *   userCreatedViewNames: (required) the list of user created view names.
   *   systemViewNames: (required) the list of system view names.
   * }
   */
  function SelectViewDialog(options) {
    var self = this, $dialog = $(options.dialog);

    self.addToView = function() {
      addToView(self.chosenView(), self.hide);
    };

    self.show = function() {
      $dialog.modal("show");
      $dialog.find("select").focus();
    };

    self.hide = function() {
      $dialog.modal("hide");
    };

    /**
     * The selected view name.
     */
    self.chosenView = ko.observable();

    function SelectViewOption(viewName) {
      this.name = viewName;
      this.label = viewName;
      if (options.systemViewNames[viewName]) {
        this.label = options.systemViewNames[viewName];
      }
    }

    function viewFactory(viewName) {
      return new SelectViewOption(viewName);
    }

    var listOptions = {
      viewNames: getViewNames(options),
      viewFactory: viewFactory
    };
    self.list = new ViewList(listOptions);

    self.unsubscribe = function() {
      self.list.unsubscribe();
    };

    ko.applyBindings(self, $dialog[0]);
  }

  /**
   * Renders a menu for interacting with views.
   * options {
   *   userCreatedViewNames: a list of existing user created view names,
   *   systemViewNames: a list of existing system view names,
   *   newViewDialog: "selector or element of the container DOM object for the new view dialog",
   *   selectViewDialog: "selector or element of the container DOM object for the select view dialog"
   * }
   */
  function AddToViewMenu(options) {
    var self = this;

    self.options = options;

    self.newViewDialog = new NewViewDialog({
      dialog: options.newViewDialog
    });

    self.selectViewDialog = new SelectViewDialog({
      dialog: options.selectViewDialog,
      userCreatedViewNames: options.userCreatedViewNames,
      systemViewNames: options.systemViewNames
    });

    /**
     * The constructor for each view entry in the Add To View Menu.
     */
    function AddToViewMenuEntry(viewName) {
      this.name = viewName;
      this.label = viewName;
      if (options.systemViewNames[viewName]) {
        this.label = options.systemViewNames[viewName];
      }
      this.select = function() {
        // this refers to the view object.
        addToView(this.name);
      };
    }

    function viewFactory(viewName) {
      return new AddToViewMenuEntry(viewName);
    }

    /**
     * Manages the list of view entries in the menu.
     */
    var listOptions = {
      viewNames: getViewNames(options),
      viewFactory: viewFactory,
      showTopN: 10
    };
    self.list = new ViewList(listOptions);

    /**
     * Displays the select view dialog.
     */
    self.showMore = function() {
      self.selectViewDialog.show();
    };

    /**
     * Displays the new view dialog.
     */
    self.showNewView = function() {
      self.newViewDialog.show();
    };

    self.unsubscribe = function() {
      self.selectViewDialog.unsubscribe();
      self.list.unsubscribe();
    };

    self.applyBindings = function() {
      ko.applyBindings(self, $(self.options.container)[0]);
    };
  }

  return AddToViewMenu;
});
