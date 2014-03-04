// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/common/I18n"
], function(_, I18n) {

/**
 * A generic popup that allows user to select multiple values.
 * In the future, this should become a jQuery plugin.
 */
return function (options) {
  /**
  var options = {
    'id' : the ID of the button that launches the list selector.
    'entries' : an array of {
      name: String,
      description: String,
      category: String,
      selected: true|false
    }
    'maximumCount' : (optional) the maximum number of selection allowed.

    'updateUrl' : (optional) a URL to persist the selection.

    'showOK' : (optional).
    If showOK is true, then shows an OK and a Cancel button,
    selection persistence happens only when user clicks the OK button.

    If showOK is false (default), then the OK button and the Cancel button are
    not shown. selection persistence happens only when user closes the dialog Box.

    'afterChange' : (optional) a callback function (evt, name, isSelected),
    which is called after the selection changes.

    'beforeOpen' : (optional) a callback function (evt),
    which is called before the dialog box is opened.
    If this callback function returns false, then the dialog box will not be opened.

    'afterOK' : (optional) a callback function (evt),
    which is called after the OK button is clicked.

    'dialogTitle' : (optional, default Select) the title of the dialog.
    'descriptionTitle' : (optional, default Name) the description column's header.
    'showSearch' : (optional, default false) adds a search input field.
  };
  */
  var entries = [];

  /**
   * Returns the dialog container object.
   */
  var getDialogContainer = function () {
    return $("#" + options.id + "_dialog");
  };

  /**
   * Returns the list of all the check boxes.
   */
  var getAllCheckBoxes = function () {
    return getDialogContainer().find("input[type=checkbox]");
  };

  /**
   * Returns the number of checkboxes that are selected.
   */
  var getCurrentCount = function () {
    return getAllCheckBoxes().filter(":checked").length;
  };

  /**
   * Only allow maximumCount # of entries to be selectable, and therefore
   * disable all remaining checkboxes when maximumCount # of checkboxes
   * are selected.
   */
  var checkMaximumCount = function () {
    var currentCount = getCurrentCount();
    if (options.maximumCount) {
      if (currentCount >= options.maximumCount) {
        getAllCheckBoxes().not(":checked").prop('disabled', true);
      } else {
        getAllCheckBoxes().removeAttr('disabled');
      }
      var headerText = currentCount + "/" + options.maximumCount;
      $("#" + options.id + "_header").text(headerText);
    }
  };

  /**
   * @param isSelected - the selection state.
   * @return the set of checkbox names, filtered
   * by the selection state.
   */
  var getItemsBySelection = function(isSelected) {
    var items = [];
    getAllCheckBoxes().each(function (i, checkbox) {
      var $checkbox = $(checkbox);
      if ($checkbox.prop("checked") === isSelected) {
        var name = $checkbox.attr("name");
        if (name && name.length > 0) {
          items.push(name);
        }
      }
    });
    return items;
  };

  /**
   * @return all the selected entries.
   */
  var getSelected = function() {
    return getItemsBySelection(true);
  };

  /**
   * @return all the unselected entries.
   */
  var getUnselected = function() {
    return getItemsBySelection(false);
  };

  /**
   * Persist the current selection to the server.
   * Right now, this is only persisted within a given session.
   */
  var persistSelection = function() {
    if (options.updateUrl) {
      var selected = getSelected();
      var params = {
        'selected': selected.join(",")
      };
      $.post(options.updateUrl, params);
    }
  };

  /**
   * A single click handler for all the checkboxes.
   */
  var onDialogContentClicked = function (evt) {
    checkMaximumCount();

    var isSelected = false;
    var $checkbox = $(evt.target).closest("label").find("input[type=checkbox]");
    if ($checkbox.length > 0) {
      var name = $checkbox.attr('name');
      if (name === undefined) {
        return;
      }

      if ($(evt.target).is($checkbox)) {
        // clicked on the checkbox
        isSelected = $checkbox.prop('checked');
      } else {
        // clicked on the row.
        isSelected = !$checkbox.prop('checked');
      }
      if ($.isFunction(options.afterChange)) {
        options.afterChange(evt, name, isSelected);
      }
    }
  };

  /**
   * Loop through all the parents and call func.
   */
  var parentsIterator = function(func) {
    var $parents = getDialogContainer().parents();
    _.each($parents, function(parent) {
      func($(parent));
    });
  };

  /**
   * This is kinda a necessary hack to make the dialog
   * visible. Apparently by using the layout engine,
   * each ui-pane has a z-index: 1, and the backdrop
   * will appear above the dialog, even though the
   * dialog has a much higher z-index.
   */
  var saveZIndices = function() {
    parentsIterator(function($parent) {
      var zIndex = $parent.css("z-index");
      if (zIndex) {
        $parent.data("z-index", zIndex);
        $parent.css("z-index", "inherit");
      }
    });
  };

  /**
   * Resets all the z-indices to undo the hack.
   */
  var resetZIndices = function() {
    parentsIterator(function($parent) {
      var oldIndex = $parent.data("z-index");
      if (oldIndex) {
        $parent.css("z-index", oldIndex);
      }
    });
  };

  /**
   * Closes the dialog.
   */
  var closeDialog = function() {
    resetZIndices();
    getDialogContainer().modal('hide');
  };

  /**
   * Opens the dialog.
   */
  var openDialog = function() {
    saveZIndices();
    getDialogContainer().modal('show');
  };

  /**
   * Creates a dialog instance after the button.
   */
  var initializeDialog = function () {
    // An empty template for the dialog.
    var searchRow = "";
    if (options.showSearch) {
      searchRow = "<tr><th colspan='2'><span class='searchLabel'></span>: <input type='text' class='search'></input></th></tr>";
    }

    var dialogContent = "<div><table class='DataTable'>" +
      "<thead><tr><th colspan='2'></th></tr>" +
      searchRow +
      "</thead>" +
      "<tbody></tbody></table></div>";

    var $dialogContainer = $("#" + options.id + "_dialog");

    $dialogContainer.find(".modal-body").html(dialogContent);
    $dialogContainer.find(".searchLabel").text(I18n.t("ui.search"));

    // Populate the table header,
    // By default, it shows Name.
    var $columnHeader = $dialogContainer.find("th:first");
    $columnHeader.append($("<span/>").text(options.descriptionTitle || "Name"));
    if (options.maximumCount) {
      $columnHeader.append($("<span/>").attr("id", options.id + "_header"));
    }

    $dialogContainer.click(onDialogContentClicked);

    var afterClose = function() {
      if ($.isFunction(options.afterClose)) {
        options.afterClose();
      }
    };

    var afterOK = function() {
      if (options.showOK && $.isFunction(options.afterOK)) {
        options.afterOK();
      }
    };

    /**
     * Handler when OK is clicked.
     */
    var onOKClicked = function() {
      closeDialog();
      afterOK();
      persistSelection();
      afterClose();
    };

    /**
     * Handler when Cancel is clicked.
     */
    var onCancelClicked = function() {
      closeDialog();
      afterClose();
    };

    /**
     * Handler when the X icon is clicked.
     * The dialog box is automatically closed.
     */
    var onClose = function( ){
      closeDialog();
      persistSelection();
      afterClose();
    };

    var title = options.dialogTitle || I18n.t("ui.select");
    var $dialogHeader = $dialogContainer.find(".modal-header");
    $dialogHeader.find("h3").html(title);

    var $dialogFooter = $dialogContainer.find(".modal-footer");
    if (options.showOK) {
      $("<button>")
        .addClass("btn btn-primary")
        .text(I18n.t("ui.ok"))
        .click(onOKClicked)
        .appendTo($dialogFooter);
      $("<button>")
        .addClass("btn")
        .addClass("dismissButton")
        .click(onCancelClicked)
        .text(I18n.t("ui.cancel"))
        .appendTo($dialogFooter);
    } else {
      $("<button>")
        .addClass("btn btn-primary")
        .addClass("dismissButton")
        .click(onClose)
        .text(I18n.t("ui.close"))
        .appendTo($dialogFooter);
    }
  };

  /**
   * Initializes all the entries to be shown in the dialog.
   */
  var initializeEntries = function (entries) {
    if ($.isArray(entries)) {
      var i;
      var rows = [];
      var oldCategory = "";
      for (i = 0; i < entries.length; i += 1) {
        var $row, $cell;
        // entry = {
        //    name: String,
        //    description: String,
        //    category: String,
        //    selected: true|false
        // }
        var entry = entries[i];
        var category = entry.category;
        if (oldCategory !== category) {
          $row = $("<tr/>");
          $cell = $("<td class='sectionHead'/>");
          $row.append($cell);
          $cell.append(category);
          rows.push($row);
          oldCategory = category;
        }
        var label = entry.description;
        var $text = $("<span/>").text(label);
        var $label = $("<label/>").addClass("checkbox");
        var $checkbox = $("<input type='checkbox'/>");
        if (entry.selected) {
          $checkbox.prop("checked", true);
        }
        $checkbox.attr("name", entry.name);
        $label.append($checkbox).append($text);

        $cell = $("<td/>");
        $cell.append($label);
        $row = $("<tr class='filter'/>");
        $row.append($cell);
        rows.push($row);
      }
      var $filterContainer = getDialogContainer().find("tbody").empty();
      $(rows).each(function (i, $row) {
        $filterContainer.append($row);
      });
      checkMaximumCount();
    }
  };

  /**
   * Click handler for the show list selector button.
   * This assumes the list is already generated.
   * and populates the dialog box.
   */
  var onShowDialogButtonClicked = function (evt) {
    var doOpenDialog = true;
    if ($.isFunction(options.beforeOpen)) {
      doOpenDialog = options.beforeOpen(evt);
    }

    if (doOpenDialog) {
      openDialog();
    }
  };

  /**
   * @returns a function that ensures
   * the callback function is not executed too frequently.
   */
  var delay = (function(){
    var timer = 0;
    return function(callback, ms){
      clearTimeout (timer);
      timer = setTimeout(callback, ms);
    };
  }());

  /**
   * Filter to show only those rows that contain the search string.
   * Lower case match.
   * When multiple search terms are entered,
   * this searches each search term individually.
   * and will only show those entries that match all the terms.
   */
  var filterRow = function(tokens) {
    var $container = getDialogContainer();
    $container.find("tbody tr.filter").each(function(i, row) {
      var show = true;

      if (tokens.length !== 0) {
        var data = $(row).html().toLowerCase();

        $.each(tokens, function(i, token) {
          if (data.indexOf(token) === -1) {
            show = false;
          }
        });
      }

      if (show) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  };

  var onKeyup = function(evt) {
    var $this = $(this);
    delay(function(){
      var value = $.trim($this.val().toLowerCase());
      var tokens = value.split(" ");
      filterRow(tokens);
    }, 200);
  };

  var onKeypress = function(evt) {
    var code = evt.keyCode || evt.which;
    // Prevent enter key from submitting the form.
    if (code === $.ui.keyCode.ENTER) {
      evt.preventDefault();
      return false;
    }
  };

  /**
   * The method that gets called on jQuery.ready.
   */
  var initialize = function () {
    initializeDialog();
    $("#" + options.id).click(onShowDialogButtonClicked);

    entries = options.entries;
    initializeEntries(entries);

    if (options.showSearch) {
      getDialogContainer().find(".search")
        .keyup(onKeyup)
        .change(onKeyup)
        .keypress(onKeypress);
    }
  };

  initialize();

  return {
    /**
     * Allows the client to change the content
     * of the dialog.
     */
    setEntries: function(newEntries) {
      entries = newEntries;
      initializeEntries(entries);
    },

    /**
     * @return all the selected entry names.
     */
    getSelected: getSelected,

    /**
     * @return all the unselected entry names.
     */
    getUnselected: getUnselected
  };
};
});
