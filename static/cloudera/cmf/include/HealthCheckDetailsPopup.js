// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "knockout",
  "cloudera/common/I18n",
  "cloudera/Util"
], function(_, ko, I18n, Util) {

  var HealthCheckDetailsPopup = function(options) {
    var self = this;
    self.entities = ko.observableArray();

    self.health = ko.observable();
    self.humanizedHealth = ko.computed(function() {
      var humanizedHealth = "";
      if (self.health() === "RED") {
        return I18n.t("ui.health.bad");
      } else if (self.health() === "YELLOW") {
        return I18n.t("ui.health.concerning");
      }
    });

    self.name = ko.observable();
    self.number = ko.observable();

    self.description = ko.computed(function() {
      var description = I18n.t("ui.healthCheckDetails", 
        self.name(), self.humanizedHealth(), self.number());
      return description;
    });

    var entitySort = function(a, b) {
      return a.name.localeCompare(b.name);
    };

    /**
     * checkRow: a CheckRow object from HealthIssues.js
     */
    var showPopup = function(checkRow) {
      self.entities.removeAll();
      _.each(checkRow.entities, function(entity) {
        self.entities.push(entity);
      });
      self.entities(self.entities().sort(entitySort));

      self.health(checkRow.health);
      self.name(checkRow.name);
      self.number(checkRow.number);

      $(options.container).modal();
    };

    var handle = $.subscribe("showCheckDetailsPopup", showPopup);

    self.subscriptionHandles = [handle];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    self.applyBindings = function() {
      ko.applyBindings(self, $(options.container)[0]);
    };
  };

  return HealthCheckDetailsPopup;
});
