// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.

/*global Sammy: false, undefined: true, setTimeout: false, location: false, console: false, define: false, $: false */
define([
  "knockout",
  "underscore",
  "cloudera/Util"
], function(ko, _, Util) {
  "use strict";

  return Class.extend({
    init: function (options) {
      var self = this;

      self.selectedGroupName = ko.observable("");
      self.selectedGroupDisplayName = ko.observable("");
      self.selectedGroupRoleType = ko.observable("");
      self.renameUrl = ko.observable("");
      self.deleteUrl = ko.observable("");
      self.isSelectedBase = ko.observable(false);
      self.isSelectedEmpty = ko.observable(false);
      
      var handle = $.subscribe("popupActionCompleted", _.bind(Util.reloadPage, Util));
      self.subscriptionHandles = [handle];
   
      /*
       * options:
       *    name - group name
       *    displayName - group display name
       *    roleType - group role type
       *    isBase - whether the group is a base group
       *    isEmpty - whether the group contains any roles
       *    renameUrl - the url to rename the group
       *    deleteUrl - the url to delete the group
       */
      self.showMembers = function(o, data, event) {
        self.selectedGroupRoleType(o.roleType);
        self.renameUrl(o.renameUrl);
        self.deleteUrl(o.deleteUrl);
        self.selectedGroupName(o.name);
        self.selectedGroupDisplayName(o.displayName);
        self.isSelectedBase(o.isBase);
        self.isSelectedEmpty(o.isEmpty);

        // Changes filter on instances table to show proper roles.
        $("#filterConfigGroup").val(o.displayName).trigger("change");
      };

      self.unsubscribe = function() {
        Util.unsubscribe(self);
      };

      self.applyBindings = function() {
        ko.applyBindings(self, $(options.container)[0]);
      };
    }
  });
});
