// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/include/RoleInstancesTable",
  "cloudera/Util"
], function(RoleInstancesTable, Util) {

return function(options){
  var roleInstancesTable = new RoleInstancesTable(options);

  // listener on filter outdated listeners link
  function addOutdatedInstancesFilter() {
    var apply = $('#outdatedInstancesFilter').children('.apply');
    var remove = $('#outdatedInstancesFilter').children('.remove');
    apply.click(function(e) {
      e.preventDefault();
      $('#filterRoleState').val($('#outdatedOption').val());
      apply.addClass('hidden');
      remove.removeClass('hidden');
      roleInstancesTable.redrawTable();
    });
    remove.click(function(e) {
      e.preventDefault();
      $('#filterRoleState').val('');
      remove.addClass('hidden');
      apply.removeClass('hidden');
      roleInstancesTable.redrawTable();
    });
  }

  // applies filters passed in url params
  function applyDefaultFilters() {
    var href = window.location.href;
    var vars = Util.unparam(href.slice(href.indexOf('?') + 1));
    roleInstancesTable.applyFilters(vars);
  }

  addOutdatedInstancesFilter();
  applyDefaultFilters();
};
});
