// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/MegaBase',
  'cloudera/Util'
], function(MegaBase, Util) {
  describe("MegaBase Tests", function() {

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    it("should make an ajax call and when a HTML is returned instead of JSON, call Util.filterError", function() {
      spyOn($, "publish");

      $.post("dontCare", function(response){}, "json");
      var request = mostRecentAjaxRequest();
      var text = '<div><div class="ExceptionReport">My Error</div></div>';

      request.response({
        status: 200,
        contentType: 'text/html',
        responseText: text
      });

      expect($.publish).wasCalledWith("showError", ["My Error"]);
    });

    it("should make an ajax call and when the status is not 200, display the status code and the error message", function() {
      spyOn(console, "error");

      $.post("dontCare", function(response){}, "json");
      var request = mostRecentAjaxRequest();

      request.response({
        status: 403,
        responseText: "Some Error"
      });

      expect(console.error).wasCalledWith("status: 403, responseText: Some Error");
    });
  });
});
