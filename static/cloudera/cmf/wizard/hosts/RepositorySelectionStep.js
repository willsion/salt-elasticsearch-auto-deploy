// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/common/I18n",
  "cloudera/common/UrlParams",
  'cloudera/Analytics',
  "cloudera/cmf/include/RepositoryValidator",
  "cloudera/cmf/include/CDHSelectionPage",
  "cloudera/cmf/wizard/WizardStepBase",
  "knockout",
  "underscore"
], function (I18n, UrlParams, analytics, RepositoryValidator, CDHSelectionPage, WizardStepBase, ko, _) {
  "use strict";

  return WizardStepBase.extend({
    /**
     * options: {
     *   id:                        (required) "the id of the step",
     *   enableFormatSelection:     (required) true to show the parcel/package selection.
     *   enableParcelSelection:     (required) true to show the parcel selection when useParcel is selected.
     *   enablePackageSelection:    (required) true to show the CDH/Impala/Search package selection when usePackage is selected.
     *   enableCDHVersionSelection: (required) true to show the CDH version selection when usePackage is selected.
     *   enableCM:                  (required) true to show the CM section,
     *   listUrl:                   (optional) "the URL to get a list of parcels, required only when enableParcelSelection is true",
     *   addCustomRepoUrl:          (optional) "the URL to add a custom repository, required when enableParcelSelection is true",
     *   installMethod:             (optional) "usePackage" or "useParcel" (default)
     * }
     */
    init: function(options) {
      var self = this;
      self.options = options;

      self.enableFormatSelection = ko.observable(options.enableFormatSelection);
      self.enableParcelSelection = ko.observable(options.enableParcelSelection);
      self.enablePackageSelection = ko.observable(options.enablePackageSelection);
      self.enableCDHVersionSelection = ko.observable(options.enableCDHVersionSelection);
      self.enableCM = ko.observable(options.enableCM);
      self.showCustomParcelRepo = ko.observable(false);

      self.installMethod = ko.observable(options.installMethod || "useParcel");
      self.customRepoUrl = ko.observable("");
      self.availableProductVersions = ko.observableArray();
      self.chosenParcels = ko.computed(function() {
        var parcels = [];
        _.each(self.availableProductVersions(), function(pv) {
          // Only add those products that have a chosen version.
          if (pv.chosenVersion()) {
            parcels.push({
              product: pv.product(),
              version: pv.chosenVersion()
            });
          }
        });
        return parcels;
      });

      // Hardcode to CDH4 for now since we only offer parcels for 4.1.2.
      self.cdhVersionInParcel = ko.observable(4);

      self.getParcelVersion = function(product) {
        var result;
        var chosenParcels = self.chosenParcels();
        _.each(chosenParcels, function(chosenParcel) {
          if (chosenParcel.product === product) {
            result = chosenParcel.version;
          }
        });
        return result;
      };

      self.isImpalaVersionOK = ko.computed(function() {
        var version = self.getParcelVersion("IMPALA");
        if (version !== undefined) {
          var versionArr = version.split("."), major = 0, minor = 0;
          if (versionArr.length > 0) {
            major = parseInt(versionArr[0], 10);
          }
          if (versionArr.length > 1) {
            minor = parseInt(versionArr[1], 10);
          }
          // Support anything 2.x, 3.x or 1.2+.
          return major > 1 || (major === 1 && minor >= 2);
        } else {
          return true;
        }
      });


      // It is OK to do this at the wizard initialization
      // instead of beforeEnter.
      //
      // This is because in case user has selected a Custom Repository,
      // and moved on, coming back to this step should not reinitialize
      // the parcel list.
      if (self.enableParcelSelection()) {
        self.initializeParcels();
      }

      self.$form = $("#" + options.id).closest("form");
      self.$form.validate({
        rules: {
          cdhCustomUrl: "repository",
          impalaCustomUrl: "repository",
          solrCustomUrl: "repository",
          cmCustomUrl: "repository"
        }
      });

      // Reuse the existing binding.
      CDHSelectionPage.initializeKnockout(self);

      self._super.apply(self, arguments);
    },

    beforeLeave: function(callback) {
      var self = this;
      if (self.$form.valid()) {
        analytics.trackEvent('installMethod', self.installMethod());
        callback();
      } else {
        var $firstWizardStepWithError = self.$form.find(".error:first:visible").closest(".wizard-step").parent();
        if ($firstWizardStepWithError.length > 0) {
          var id = $firstWizardStepWithError.attr("id");
          UrlParams.set("step", id);
        }
      }
    },

    enableContinue: function() {
      var self = this;
      if (self.enableParcelSelection() && self.installMethod() === "useParcel") {
        return !_.isEmpty(self.chosenParcels()) && self.isImpalaVersionOK();
      } else {
        return true;
      }
    },

    toggleAddRepository: function() {
      this.showCustomParcelRepo(!this.showCustomParcelRepo());
    },

    /**
     * Initializes the set of parcels.
     */
    initializeParcels: function() {
      var self = this;
      if (!_.isEmpty(self.options.listUrl)) {
        $.post(self.options.listUrl,
               _.bind(self.handleUpdateParcelsResponse, self), "json");
      }
    },

    /**
     * Expects a spinner icon some where on the page.
     */
    getParcelSpinner: function() {
      return $(".parcel-refresh-spinner");
    },

    /**
     * Refresh the parcel list using a new custom repository.
     */
    refreshCustomRepo : function() {
      var self = this;
      var customRepoUrl = self.customRepoUrl();
      if (!_.isEmpty(customRepoUrl)) {
        var params = {
          repoUrl: customRepoUrl
        };
        self.getParcelSpinner().show();
        $.get(self.options.addCustomRepoUrl, params, _.bind(self.handleUpdateParcelsResponse, self), "json").complete(function() {
          self.getParcelSpinner().hide();
        });
      }
    },

    /**
     * Handles the update parcels JsonResponse.
     */
    handleUpdateParcelsResponse: function(jsonResponse) {
      var self = this;
      if (jsonResponse.message === "OK") {
        var parcels = jsonResponse.data;
        self.updateAvailableParcels(parcels);
      } else {
        $.publish("showError", [jsonResponse.message]);
      }
    },

    /**
     * Updates the list of available parcels.
     */
    updateAvailableParcels: function(parcels) {
      var self = this;

      // Clear out existing data.
      self.availableProductVersions.removeAll();

      // Regroup the parcels by product.
      var parcelsByProduct = _.groupBy(parcels, "product");
      _.each(parcelsByProduct, function(parcels, product) {
        parcels = _.sortBy(parcels, function(parcel) {
          return parcel.version;
        });
        // Sort in reverse order.
        parcels.reverse();
        var versions = _.map(parcels, function(parcel) {
          return {
            label: product + "-" + parcel.version,
            value: parcel.version
          };
        });
        if (product !== 'CDH') {
          versions.push({
            label: I18n.t("ui.none"),
            value: ""
          });
        }
        self.availableProductVersions.push({
          product: ko.observable(product),
          availableVersions: ko.observableArray(versions),
          chosenVersion: ko.observable(versions[0].value)
        });
      });
    }
  });
});
