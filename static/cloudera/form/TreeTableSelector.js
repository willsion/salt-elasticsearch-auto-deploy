//(c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util"
], function(Util) {
// Options:
// rootID : the ID of the HTML table that the treeTable plugin was applied to.
//
// noParentFoundCallback : If you want to have an element that is the logical parent of the top
// level rows, but not a part of the treeTable (as is the case on the Events page), you can
// provide a callback that is called when the top-level rows are updated so that the
// logical parent can also update itself as appropriate.
//
// negativeSelector : If you don't want the standard callback for treeTable checkboxes to apply to 
// any checkboxes within the treeTable, you can exclude them using the negativeSelector.
return function(options) {
  var $root = null;
  var noParentFoundCallback = null;

  function recursivelyCheckTreeTableChildren(id, isChildrenChecked) {
    var ids = [];
    $root.find(".child-of-" + id).each(function(index, item) {
      var $item = jQuery(item);
      Util.setCheckboxState($item.find("input[type='checkbox']"), isChildrenChecked);
      var id = $item.attr("id");
      if (id) {
        ids.push(id);
      }
      $item = null;
    });

    var i;
    for (i = 0; i < ids.length; i+=1) {
      recursivelyCheckTreeTableChildren(ids[i], isChildrenChecked);
    }
  }

  // The ID passed in is the ID of a <tr> in the treeTable. This function checks
  // recursively if any of the descendants in the treeTable of the given <tr>
  // have checked checkboxes.
  function hasCheckedDescendants(id) {
    var $directChildren = $root.find(".child-of-" + id);
    if ($directChildren.find("input[type='checkbox']").filter(":checked").length > 0) {
      return true;
    }
    var ids = [];
    $directChildren.each(function(index, item) {
      var $item = jQuery(item);
      if ($item.attr("id")) {
        ids.push($item.attr("id"));
      }
      $item = null;
    });
    var i;
    var result = false;
    for (i = 0; i < ids.length; i+=1) {
      if (hasCheckedDescendants(ids[i])) {
        result = true;
        break;
      }
    }
    $directChildren = null;
    return result;
  }

  function parentRowShouldBeChecked (id) {
    return $root.find(".child-of-" + id + " input[type='checkbox']").not(":checked").length === 0;
  }

  function getTreeTableParentID(klass) {
    var classes = jQuery.trim(klass).split(/\s+/);
    var i;
    for (i = 0; i < classes.length; i+=1) {
      if (classes[i]) {
        var matchIndex = classes[i].search(/^child-of-/);
        if (matchIndex === 0) {
          return classes[i].replace(/^child-of-/, "");
        }
      }
    }
    return null;
  }

  // Called when a checkbox which is a child of another checkbox is clicked.
  // If the child was unchecked, we need to uncheck the parent.
  // Otherwise, if the child was checked, then we might have to update the parent
  // and check it, if all the children are now checked.
  function recursivelyCheckParent (id, childIsChecked) {
    var $targetRow = jQuery("#" + id);
    if ($targetRow.length === 0) {
      return;
    }
    var $checkbox = $targetRow.find("input[type='checkbox']");
    var targetRowIsChecked = childIsChecked && parentRowShouldBeChecked(id);
    Util.setCheckboxState($checkbox, targetRowIsChecked);

    var parentID = getTreeTableParentID($targetRow.attr("class"));
    if (parentID) {
      recursivelyCheckParent(parentID, targetRowIsChecked);
    } else if (noParentFoundCallback) {
      noParentFoundCallback({
        target : $checkbox
      });
    }

    $targetRow = null;
    $checkbox = null;
  }

  // Whenever a checkbox in a treeTable is (un)checked, we want to update its descendants appropriately
  // as well as its ancestors.
  function checkboxInTreeTableClicked (event) {
    var $target = jQuery(event.target);
    var $targetRow = $target.closest("tr");

    var targetIsChecked = false;
    if ($target.attr("checked")) {
      targetIsChecked = true;
    }

    var id = $targetRow.attr("id");
    if (id) {
      recursivelyCheckTreeTableChildren(id, targetIsChecked);
    }

    var parentID = getTreeTableParentID($targetRow.attr("class"));
    if (parentID) {
      recursivelyCheckParent(parentID, targetIsChecked);
    }
  }

    $root = jQuery(options.rootID);
    noParentFoundCallback = options.noParentFoundCallback;
    $root
      .find("input[type='checkbox']")
        .not(options.negativeSelector)
          .click(checkboxInTreeTableClicked);

  return {
    recursivelyCheckTreeTableChildren : recursivelyCheckTreeTableChildren,
    hasCheckedDescendants : hasCheckedDescendants,
    getTreeTableParentID: getTreeTableParentID
  };
};

});
