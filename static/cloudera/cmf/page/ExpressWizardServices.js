// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/common/I18n",
  "cloudera/Util",
  "knockout",
  "underscore"
], function(I18n, Util, ko, _) {
  /**
   * options = {
   *   customPackage: 'CUSTOM',
   *   packageServices: {
   *     "CORE_RTD":["HDFS","MAPREDUCE","ZOOKEEPER","HBASE","OOZIE","HIVE","HUE"],
   *     "FULL":["HDFS","MAPREDUCE","IMPALA","ZOOKEEPER","HBASE","HIVE","HUE","OOZIE","SQOOP"],
   *     "CUSTOM":[],
   *     "CORE":["HDFS","MAPREDUCE","OOZIE","HIVE","HUE","ZOOKEEPER"],
   *     "CORE_RTQ":["HDFS","MAPREDUCE","IMPALA","OOZIE","HIVE","HUE","ZOOKEEPER"]
   *   },
   *   cdhVersion: '4',
   *   missingServiceTypes: {
   *     "IMPALA":["impala"],
   *     "SQOOP":["sqoop2"]
   *   },
   *   container: "the selector of the containing DOM element"
   * }
   */
  return function(options) {
    var self = this;

    // None of these selections are empty by default (need to handle the back button).
    // The selected version.
    self.selectedCDHVersion = ko.observable(options.cdhVersion);

    // The selected package.
    var pkg = $("input[name=package]:checked").val() || "";
    self.selectedPackage = ko.observable(pkg);

    // The selected service types.
    var serviceTypes = [];
    $("#serviceSelector input[name=serviceType]:checked").each(function (i, elem) {
      serviceTypes.push($(elem).val());
    });
    self.selectedServiceTypes = ko.observableArray(serviceTypes);

    self.useNavigator = ko.observable(false);
    self.continueSubmitted = ko.observable(false);
    self.inspectSubmitted = ko.observable(false);

    /**
     * Returns true if the Custom package is selected.
     */
    self.customPackageSelected = ko.dependentObservable(function() {
      return self.selectedPackage() === options.customPackage;
    }, self);

    /**
     * Returns true if selection on this page is complete.
     */
    self.isSelectionComplete = ko.dependentObservable(function () {
      var cdhVersion = self.selectedCDHVersion();
      var pkg = self.selectedPackage();
      var serviceTypes = self.selectedServiceTypes();
      var result = (cdhVersion !== "") && (pkg !== "") &&
        (!self.customPackageSelected() || serviceTypes.length > 0);
      return result;
    }, self);

    /**
     * Returns true if the Continue button should be enabled.
     */
    self.isContinueEnabled = ko.dependentObservable(function () {
      return !self.continueSubmitted() && self.isSelectionComplete();
    }, self);

    /**
     * Returns true if the Inspect Role Assignments button should be enabled.
     */
    self.isInspectEnabled = ko.dependentObservable(function () {
      return !self.inspectSubmitted() && self.isSelectionComplete();
    }, self);

    /**
     * Click on the inspect button.
     */
    self.inspectClicked = function (viewModel, e) {
      e.preventDefault();
      if (this.inspectSubmitted()) {
        this.inspectSubmitted(true);
        return false;
      }
      $('#continueForm').prop('action', 'select-hosts').submit();
    };

    /**
     * Click on the Continue button.
     */
    self.continueClicked = function (viewModel, e) {
      e.preventDefault();
      if (this.continueSubmitted()) {
        this.continueSubmitted(true);
        return false;
      }
      var serviceTypes;
      if (self.customPackageSelected()) {
        serviceTypes = self.selectedServiceTypes();
      } else {
        serviceTypes = options.packageServices[self.selectedPackage()];
      }
      var missingServiceTypes = _.map(options.missingServiceTypes,
                                      function(v, k){ return k; });
      var selectedMissing = _.intersection(serviceTypes,
                                           missingServiceTypes);

      if (selectedMissing.length > 0) {
        var message = I18n.t("ui.wizard.express.missingComponents",
                             _.keys(options.missingServiceTypes).join(", "));
        $.publish("showConfirmation", [message, function() {
          self.submitForm();
        }]);
        return false;
      } else {
        self.submitForm();
      }
    };

    self.submitForm = function() {
      $('#continueForm').prop('action', 'autoconfig').submit();
    };

    /**
     * Click on a service type.
     */
    self.serviceTypeClicked = function (context, e) {
      var $checkbox = $(e.currentTarget);
      if ($checkbox.attr("disabled") !== null) {
        var serviceType = $checkbox.attr("value");
        self.toggleServiceType(serviceType);
        return true;
      }
    };

    /**
     * Toggle the selection of a service type.
     */
    self.toggleServiceType = function(serviceType) {
      var i;
      var serviceTypes = self.selectedServiceTypes();
      for (i = 0; i < serviceTypes.length; i += 1) {
        if (serviceTypes[i] === serviceType) {
          self.selectedServiceTypes.splice(i, 1);
          return;
        }
      }
      self.selectedServiceTypes.splice(0, 0, serviceType);
    };

    self.applyBindings = function() {
      ko.applyBindings(self, $(options.container)[0]);
    };
  };
});
