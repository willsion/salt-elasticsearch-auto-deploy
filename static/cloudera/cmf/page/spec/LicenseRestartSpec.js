// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/LicenseRestart'
], function(LicenseRestart) {
  describe("LicenseRestart Tests", function() {

    var options = {
      returnUrl: "dontcare"
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    it("should check the status of a server restart", function() {
      var request, module = new LicenseRestart(options);

      module.checkLoginStatus();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: "OK",
        contentType: "text/html"
      });
      expect(module.restarting()).toBeFalsy();

      module.checkLoginStatus();
      request = mostRecentAjaxRequest();
      request.response({
        status: 403
      });
      expect(module.restarting()).toBeTruthy();
    });
  });
});
