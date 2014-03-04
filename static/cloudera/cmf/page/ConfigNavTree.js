// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
/**
 * Controls the Navigation Tree in the Config UI.
 * Responsibilities include:
 * *. Populates the tree table.
 * *. Handles tree table selection.
 */
define(["cloudera/cmf/page/ConfigFilter"], function(ConfigFilter) {

  var configNavKey = "";
  var configNavParent = "";

  var getTreeTable = function() {
    return $("#cmfConfigNavTree table");
  };

  var dotToDashes = function(str) {
    return str.replace(/\./g, "--");
  };

  var dashesToDot = function(str) {
    return str.replace(/--/g, ".");
  };

  /*
   * Unfortunatly, group keys generated on the server are
   * not guarenteed to be unique across parents/role groups.
   * Thus, we cannot simply use them as unique IDs in the UI,
   * and must prepend the parent key here if it exists.
   */
  var getId = function(key, parent) {
    if (parent) {
      return dotToDashes(parent + "." + key);
    } else {
      return dotToDashes(key);
    }
  };

  var unselectAllRows = function() {
    getTreeTable().find("tr").removeClass("selected");
  };

  var selectGroup = function(groupData) {
    if (groupData) {
      configNavKey = groupData.key;
      configNavParent = groupData.parent;
      $("input[name=groupKey]").val(configNavKey);
      $("input[name=groupParent]").val(configNavParent);
      var keyPattern = ('<span class="configGroupKey">' + configNavKey + '</span>').toLowerCase() ;
      var parentPattern = ('<span class="configGroupParent">' + configNavParent + '</span>').toLowerCase();
      $.publish("configNavChanged", [parentPattern, keyPattern]);
    }
  };

  var selectRow = function($tr) {
    unselectAllRows();
    var groupData = $.data($tr[0], "groupData");
    // This ensures that we do not select a child row with
    // a collapsed parent by expanding the parent if necessary.
    $tr.reveal();
    $tr.addClass("selected");
    selectGroup(groupData);
    return true;
  };

  /**
   * Renders a single tree row.
   */
  var renderGroup = function(groupData) {
    var $elem, $td;
    $elem = $("<a>").attr("href", "#").text(groupData.label);
    $td = $("<td>");

    $td.append($elem);

    if (groupData.selectable) {
      $td.css("font-weight", "bold");
    }

    var $tr = $("<tr>").attr("id", getId(groupData.key, groupData.parent)).append($td);
    if (groupData.parent) {
      $tr.addClass("child-of-" + dotToDashes(groupData.parent));
    }

    if (groupData.selected) {
      $tr.addClass("selected");
      selectGroup(groupData);
    }
  
    $.data($tr[0], "groupData", groupData);
    return $tr;
  };

  var updateTable = function($tbody) {
    var $treeTable = getTreeTable();
    $treeTable
      .find("tbody").remove()
      .end().append($tbody);

    $treeTable.treeTable();
  };

  /**
   * Renders all the groups.
   */
  var renderGroups = function(myGroups) {
    var $tbody = $("<tbody>");

    $.each(myGroups, function(i, groupData) {
      if (groupData.visible && groupData.label) {
        var $tr = renderGroup(groupData);
        $tbody.append($tr);
      }
    });

    updateTable($tbody);
  };

  /**
   * Selects the first selectable row.
   */
  var selectFirstSelectableRow = function() {
    var $trs = getTreeTable().find("tr");
    var i, len = $trs.length;
    for (i = 0; i < len; i += 1) {
      var $tr = $($trs[i]);
      if (selectRow($tr)) {
        break;
      }
    }
  };

  /**
   * Finds the groupData that matches the given key/parent
   * combination.
   */
  var findGroupData = function(myGroups, key, parent) {
    var i, len = myGroups.length;
    for (i = 0; i < len; i += 1) {
      var groupData = myGroups[i];
      if (groupData.key === key &&
        groupData.parent === parent) {
        return groupData;
      }
    }
    return null;
  };

  var populateNavigationTree = function(selectOneRow) {
    var myGroups = [];
    var oneVisibleRowIsSelected = false;

    $(".configGroup").each(function(i, elem) {
      var $elem = $(elem);
      var key = $elem.find(".configGroupKey").text().toLowerCase();
      var parent = $elem.find(".configGroupParent").text().toLowerCase();
      var label = $elem.find(".configGroupLabel").text();

      var $row = $elem.parents("tr");
      var visible = true;
      var selectable = true;
      var selected = false;

      if (configNavKey === key && configNavParent === parent) {
        if (selectOneRow) {
          selectOneRow = false;
        }
        selected = true;
      }

      var parentData = findGroupData(myGroups, parent, "");
      if (parentData === null && parent !== "") {
        parentData = {
          visible: visible,
          key: parent,
          parent: "",
          selectable: selectable,
          label: "",
          selected: false
        };
        myGroups.push(parentData);
      }

      var groupData = findGroupData(myGroups, key, parent);
      if (groupData === null) {
        // create a new entry.
        groupData = {
          visible: visible,
          key: key,
          parent: parent,
          selectable: selectable,
          label: label,
          selected: selected
        };
        myGroups.push(groupData);
      } else {
        groupData.label = label;
        groupData.selected = selected;
      }

    });

    renderGroups(myGroups);

    if (selectOneRow) {
      selectFirstSelectableRow();
    }
  };

  var onConfigSearchChanged = function(value) {
    if (value !== "") {
      configNavKey = "";
      configNavParent = "";
      unselectAllRows();
    }
  };

  var onConfigFilterReset = function() {
    selectFirstSelectableRow();
  };

  var selectRowWithKeyAndParent = function(key, parent) {
    var $tr = $("#" + getId(key, parent));
    selectRow($tr);
  };

  /**
   * Click handler when the Navigation Tree is clicked.
   */
  var onClickTreeTable = function(evt) {
    var $target = $(evt.target);
    var $tr = $target.closest("tr");

    if ($tr.length > 0 && !$target.is(".expander")) {
      selectRow($tr);
    }
    if (evt) {
      evt.preventDefault();
    }
  };

  return function(options) {
    $.subscribe("configSearchChanged", onConfigSearchChanged);
    $.subscribe("configFilterReset", onConfigFilterReset);
    $.subscribe("filterLinkClicked", selectRowWithKeyAndParent);
    getTreeTable().click(onClickTreeTable);

    configNavKey = options.groupKey.toLowerCase() || "";
    configNavParent = options.groupParent.toLowerCase() || "";
    populateNavigationTree(true);
    return {};
  };
});
