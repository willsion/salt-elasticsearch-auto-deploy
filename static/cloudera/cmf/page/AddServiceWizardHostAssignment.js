// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/form/Form",
  "cloudera/form/ShiftClickSelector",
  "cloudera/Util"
], function(Form, ShiftClickSelector, Util) {

return function (options) {

  var $dependenciesTable = $('.DependenciesTable');

  // Scrapes assignment grid and populates hidden
  // assignments input that actuall get's submitted
  var populateAssignments = function() {
    var assignments = [];
    $(".selector:checked").each(function(i, el) {
      assignments.push($(el).val());
    });
    $('[name=assignments]').val(assignments.join(','));
  };

  // returns true if there is an error in user input
  var continueNotValid = function() {

    // skip the following check that table
    // cols are empty.  this flag is only
    // used here.
    if (!options.useJSValidation) {
      return false;
    }

    // iterate over table cols and make sure cols that require it
    // have checked checkboxes
    var i;
    for (i = 0; i < options.numCols; i += 1) {
      var $header = $dependenciesTable.find('thead > tr > th:nth-child(' + (i + 1) + ')');
      var $checkboxes = $dependenciesTable.find('tbody > tr > td:nth-child(' + (i + 1) + ') input[type=checkbox]');

      // skip cols that are not required or that have no checkboxes
      if ($header.hasClass('required') && $checkboxes.length !== 0) {
        
        // if a col does not contain at least one checked checkbox, return true
        var areNoChecks = true;
        var j;
        for (j = 0; j < $checkboxes.length; j += 1) {
          if ($($checkboxes.get(j)).is(':checked')) {
            areNoChecks = false;
            break;
          }
        }

        if (areNoChecks) {
          return areNoChecks;
        }

      }
    }
    return false;
  };

  // add listeners to expand/collapse dependency
  // listeners
  var addAccordianListeners = function(header, body) {
    $(header).click(function(e) {
      $(e.target)
        .find(".Icon")
          .toggleClass("icon-chevron-right")
          .toggleClass("icon-chevron-down")
        .end()
        .siblings(body)
          .toggleClass("hidden");
    });
  };

  // add listeners for 'all' and 'none' links that only
  // ever apply to a single column
  var addCheckAllNoneListeners = function (query, isChecked) {
    var childQuery;
    if (isChecked) {
      childQuery = '.all';
    } else {
      childQuery = '.none';
    }

    var form = new Form();

    $(query).find(childQuery).click(function(e) {
      e.preventDefault();
      var col = $(e.target).siblings('.col').html();
      form.setCheckedStateForTableColumn($dependenciesTable.find('input[type=checkbox]:first').get(0), col, isChecked);
    });
  };  

  var addShiftClickListeners = function (query) {
    // For each column that supports multiple checkboxes,
    // use the ShiftClickSelector plugin.
    $(query).each(function(index, match) {
      var col = $(match).find('.col').html();
      var columnIndex = parseInt(col, 10);
      if (Util.isNumber(columnIndex)) {
        $dependenciesTable.ShiftClickSelector({
          triggerClick: true,
          columnIndex: columnIndex
        });
      }
    });
  };

    var lastHeaderRow = $dependenciesTable.find('thead tr').length - 1;

    addAccordianListeners('.dependenciesHeader', '.dependencyRoles');
    addAccordianListeners('.otherHeader', '.otherRoles');
    addCheckAllNoneListeners('.multipleHosts', true);
    addCheckAllNoneListeners('.multipleHosts', false);
    //addShiftClickListeners('.multiSelectableColumn');
    // add listeners for 'all' and 'none' links that
    // affect all slave type roles
    $('.allSlaves').click(function(e) {
      Util.setCheckboxState($dependenciesTable.find('.slaveRole'), true);
    });

    $('.noneSlaves').click(function(e) {
      Util.setCheckboxState($dependenciesTable.find('.slaveRole'), false);
    });
 
    // slave roles must all be on the same host, so
    // when a checkbox is clicked for a single slave
    // role, we must check/uncheck all slave roles for
    // that host.
    $dependenciesTable.delegate('.slaveRole', 'click', function(e) {
      var $target = $(e.target);
      var $boxes = $target.parents('tr').find('.slaveRole');
      Util.setCheckboxState($boxes, $target.is(':checked'));
    });

    // perform validation and prevent continue
    // if it fails. if validation succeeds, populate
    // assignments input field.
    $('[value=Continue]').click(function(e) {
      if (continueNotValid()) {
        e.preventDefault();
        $(this).removeClass("disabled");
        $.publish("showError",[$("#continueDialog").html()]);
      } else {
        populateAssignments();
      }
    });
};

});
