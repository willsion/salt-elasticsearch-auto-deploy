// (c) Copyright 2011-2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/include/ChartControls',
  'cloudera/Util'
], function(ChartControls, Util) {
  describe("ChartControls Tests", function() {
    var id = "resetView", module, options = {
      resetButtonSelector: "#" + id,
      resetUrl: "dontcare"
    };

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should test the reset button.", function() {
      spyOn(Util, "reloadPage");
      spyOn($, "publish");

      module = new ChartControls(options);
      $("#" + id).trigger("click");

      expect($.publish).wasCalled();
      expect($.publish.mostRecentCall.args[0]).toEqual("showConfirmation");
      // execute the confirm message explicitly.
      $.publish.mostRecentCall.args[1][1]();

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: '{"message":"OK", "data":null}'
      });

      expect(Util.reloadPage).wasCalled();
    });

    it("should test the reset button and fail.", function() {
      spyOn($, "publish");

      module = new ChartControls(options);
      $("#" + id).trigger("click");

      expect($.publish.mostRecentCall.args[0]).toEqual("showConfirmation");
      // execute the confirm message explicitly.
      $.publish.mostRecentCall.args[1][1]();

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: '{"message":"Failed", "data":null}'
      });
      expect($.publish).wasCalledWith("showError", ["Failed"]);
    });
  });
});
