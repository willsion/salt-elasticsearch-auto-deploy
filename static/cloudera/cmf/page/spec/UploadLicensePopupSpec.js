// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/UploadLicensePopup',
  'cloudera/Util'
], function(UploadLicensePopup, Util) {
  describe("UploadLicensePopup Tests", function() {

    var module, options = {
      restartUrl: "dontcare"
    };

    beforeEach(function() {
      module = new UploadLicensePopup(options);
    });

    afterEach(function() {
      module.unsubscribe();
    });

    it("should redirect to the restartUrl", function() {
      spyOn(Util, "setWindowLocation");
      $.publish("fileUploaded", [true]);
      expect(Util.setWindowLocation).wasCalledWith(options.restartUrl);
    });
  });
});
