// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout: false, location: false, console: false, define: false, ko: false, $: false */
define([
  "cloudera/Util",
  "cloudera/cmf/page/PopupWithGroupNameViewModelBase",
  "knockout"
], function(Util, PopupWithGroupNameViewModelBase, ko) {
  "use strict";

  return PopupWithGroupNameViewModelBase.extend({
    init: function (options) {
      this._super.apply(this, arguments);
      var self = this;

      self.roleType = ko.observable();
      self.cloneGroupName = ko.observable();

      var baseGroupNamesMap = options.baseGroupNamesMap;
      var otherGroupNamesMap = options.otherGroupNamesMap;
      var nameToDisplayNameMap = options.nameToDisplayNameMap;

      var getGroupNamesWithRoleType = function(roleType, groupNamesMap) {
        var groups = [];
        var groupName;

        for (groupName in groupNamesMap) {
          if(self.roleType() === groupNamesMap[groupName]) {
            groups.push(groupName);
          }
        }

        return groups;
      };

      self.relevantGroups = ko.computed(function() {
        var groups = [];
        var roleType = self.roleType();

        // We make two calls to do this so that base group names
        // always come first;
        groups = groups.concat(getGroupNamesWithRoleType(roleType, baseGroupNamesMap));
        groups = groups.concat(getGroupNamesWithRoleType(roleType, otherGroupNamesMap));

        return groups;
      });

      self.getDisplayName = function(name) {
        return nameToDisplayNameMap[name];
      };

      self.createButtonClick = function (e) {
        self.isSubmitted(true);
        var urlParams = {
          groupName : self.groupName(),
          roleType : self.roleType(),
          cloneGroupName : self.cloneGroupName()
        };

        $.post(options.addUrl, urlParams, self.handleErrors, "json");
      };

      self.applyBindings = function() {
        ko.applyBindings(self, $(options.container)[0]);
      };
    }
  });
});
