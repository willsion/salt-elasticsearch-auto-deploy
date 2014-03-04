// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/parcel/Parcels",
  "knockout"
], function (Parcels, ko) {

  /**
   * options {
   *   container:    (required) "selector of the container DOM object",
   *   updateUri:    (required) "the uri for fetching the JSON",
   *   updateParams: (optional) "the parameters for fetching the JSON",
   * }
   */
  var ClusterParcelUpgrade = function(options) {

    var self, $container;
    self= this;
    $container = $(options.container);

    self.parcelStatusUri = options.parcelStatusUri;

    self.parcelsUpdater = new Parcels({
      container: $(options.container)[0],
      updateUri: options.updateUri,
      updateParams: options.updateParams
    });
    self.viewModel = self.parcelsUpdater;
    self.parcelsUpdater.update();

    /**
     * Initiates the parcel install by starting the download
     * and redirecting the user to the parcel page.
     */
    self.installParcel = function(data, event) {
      var downloadUrl = data.urls.downloadUrl();
      //Wait until the call returns and then redirect
      data.state.execute(downloadUrl, function() {
        window.location = self.parcelStatusUri;
      });
    };

    ko.applyBindings(self, $(options.container)[0]);
  };

  return ClusterParcelUpgrade;
});
