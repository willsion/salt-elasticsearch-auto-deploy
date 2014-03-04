// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/common/I18n",
  'knockout',
  "underscore"
], function(I18n, ko, _) {
  return function(options) {
    var self = this;

    // None of these selections are empty by default (need to handle the back button).
    // The selected version.
    var version = $("input[name=serviceVersion][type=radio]:checked").val() ||
      $("input[name=serviceVersion][type=hidden]").val() || "";
    self.selectedCDHVersion = ko.observable(version);

    // The selected service type.
    var serviceType = $("#serviceSelector input[name=serviceType]:checked").val() || "";
    self.selectedServiceType = ko.observable(serviceType);

    self.continueSubmitted = ko.observable(false);

    /**
     * Click on the Continue button.
     */
    self.continueClicked = function (viewModel, e) {
      if (self.continueSubmitted()) {
        self.continueSubmitted(true);
        return false;
      }
      var missingServiceTypes = _.map(options.missingServiceTypes,
                                      function(v, k){ return k; });
      var selectedMissing = _.contains(missingServiceTypes, self.selectedServiceType());

      if (selectedMissing) {
        var message = I18n.t("ui.wizard.addService.missingComponents",
                             options.missingServiceTypes[self.selectedServiceType()].join(", "));

        $.publish("showConfirmation", [message, function() {
          self.submitForm();
        }]);
        return false;
      } else {
        self.submitForm();
      }
    };

    self.submitForm = function() {
      $('#serviceSelectorForm').submit();
    };

    /**
     * Returns true if selection on this page is complete.
     */
    self.isSelectionComplete = ko.dependentObservable(function () {
      var cdhVersion = self.selectedCDHVersion();
      var serviceType = self.selectedServiceType();
      return (cdhVersion !== "") && (serviceType !== "");
    }, self);

    /**
     * Returns true if the Continue button should be enabled.
     */
    self.isContinueEnabled = ko.dependentObservable(function () {
      return !self.continueSubmitted() && self.isSelectionComplete();
    }, self);

    /**
     * Click on a service type.
     */
    self.serviceTypeClicked = function (context, e) {
      var $radio = $(e.currentTarget);
      if ($radio.attr("disabled") !== null) {
        var serviceType = $radio.attr("value");
        self.selectedServiceType(serviceType);
        return true;
      }
    };

    /**
     * When a different CDH Version is clicked,
     * remove the current service type selection.
     *
     * Note: This is an extremely unlikely case, where all
     * the existing services are removed from the cluster.
     * In this case, we would need to display the CDH Version selector.
     */
    self.cdhVersionClicked = function (context, e) {
      var $radio = $(e.currentTarget);
      var cdhVersion = $radio.attr("value");
      if (self.selectedCDHVersion() !== cdhVersion) {
        self.selectedCDHVersion(cdhVersion);
        // Remove service type selection.
        self.selectedServiceType("");
        $("#serviceSelector").find("input").removeAttr("checked");
      }
      return true;
    };

    self.applyBindings = function() {
      ko.applyBindings(self, $(options.container)[0]);
    };
  };
});
