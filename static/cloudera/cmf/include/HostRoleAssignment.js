// (c) Copyright 2012 Cloudera, Inc. All rights reserved.

/*global define: false, $: false */
define([
  "cloudera/Util",
  "knockout"
], function (Util, ko) {
  "use strict";

  return function (host, roles, parent) {
    var self = this;
    self.host = host;
    self.roles = roles;
    self.parent = parent;

    self.hasRole = function (roleType) {
      var i, role;
      for (i = 0; i < self.roles.length; i += 1) {
        role = self.roles[i];
        if (role.roleType === roleType) {
          return true;
        }
      }
      return false;
    };

    self.hasNameNode = self.hasRole("NAMENODE");
    self.hasSecondaryNameNode = self.hasRole("SECONDARYNAMENODE");
    self.hasDataNode = self.hasRole("DATANODE");
    self.hasNameservice = function (nameservice) {
      var i, role;
      for (i = 0; i < self.roles.length; i += 1) {
        role = self.roles[i];
        if (role.nameservice === nameservice) {
          return true;
        }
      }
      return false;
    };

    self.getRoles = function (roleType) {
      var i, role, result = [];
      for (i = 0; i < self.roles.length; i += 1) {
        role = self.roles[i];
        if (role.roleType === roleType) {
          result.push(role);
        }
      }
      return result;
    };

    self.clickANN = function (context, evt) {
      if (self.allowANN()) {
        self.parent.chosenANN(self.host.hostId);
        self.clickRadio(evt);
        return true;
      }
    };

    self.clickSBN = function (context, evt) {
      if (self.allowSBN()) {
        self.parent.chosenSBN(self.host.hostId);
        self.clickRadio(evt);
        return true;
      }
    };

    self.clickSNN = function (context, evt) {
      if (self.allowSNN()) {
        self.parent.chosenSNN(self.host.hostId);
        self.clickRadio(evt);
        return true;
      }
    };

    self.clickRadio = function (evt) {
      var $target = $(evt.target), $checkbox;
      if (!$target.is("input[type=radio]")) {
        var $radio = $target.find("input[type=radio]");
        $radio.attr("checked", "checked");
      }
    };

    self.allowANN = ko.dependentObservable(function () {
      var allowed =
        !self.hasNameNode &&
        !self.hasSecondaryNameNode &&
        self.parent.chosenSBN() !== self.host.hostId &&
        self.parent.chosenSNN() !== self.host.hostId &&
        self.parent.allowANN();
      return allowed;
    }, self);

    self.allowSBN = ko.dependentObservable(function () {
      var allowed =
        !self.hasNameNode &&
        !self.hasSecondaryNameNode &&
        self.parent.chosenANN() !== self.host.hostId &&
        self.parent.chosenSNN() !== self.host.hostId &&
        self.parent.allowSBN();
      return allowed;
    }, self);

    self.allowSNN = ko.dependentObservable(function () {
      var allowed =
        !self.hasNameNode &&
        !self.hasSecondaryNameNode &&
        self.parent.chosenANN() !== self.host.hostId &&
        self.parent.chosenSBN() !== self.host.hostId &&
        self.parent.allowSNN();
      return allowed;
    }, self);

    self.otherRoleCount = function () {
      var i, role, count = 0, len = self.roles.length;
      for (i = 0; i < len; i += 1) {
        role = self.roles[i];
        if (role.roleType !== "NAMENODE" &&
            role.roleType !== "SECONDARYNAMENODE") {
          count += 1;
        }
      }
      return count;
    };

    self.otherRolesHeader = function () {
      // I18n TODO:
      return self.otherRoleCount() + " other role(s)";
    };

    self.otherRoles = function () {
      var i, role, len = self.roles.length, result = [];
      for (i = 0; i < len; i += 1) {
        role = self.roles[i];
        if (role.roleType !== "NAMENODE" &&
            role.roleType !== "SECONDARYNAMENODE") {
          result.push(role);
        }
      }
      return result;
    };

    self.nameservices = function () {
      var i, role, len = self.roles.length, result = [];
      for (i = 0; i < len; i += 1) {
        role = self.roles[i];
        if (role.nameservice !== null) {
          result.push(role.nameservice);
        }
      }
      return result;
    };
  };
});
