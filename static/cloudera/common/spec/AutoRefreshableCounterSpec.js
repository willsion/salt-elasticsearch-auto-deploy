// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/AutoRefreshableCounter"
], function(AutoRefreshableCounter) {

  describe("AutoRefreshableCounter Tests", function() {
    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    it("should auto refresh the counter", function() {

      var $elem = $("<div>")
        .attr("data-update-delay", 100)
        .attr("data-update-href", "dontcareUrl");

      $elem.AutoRefreshableCounter('update');

      var request = mostRecentAjaxRequest();
      var value = 100;
      request.response({
        status: 200,
        responseText: JSON.stringify({
          data: value
        })
      });

      expect($elem.html()).toEqual('<span class="label label-info">' + value + '</span>');
    });

    it("should hide when the counter is zero.", function() {

      var $elem = $("<div>")
        .attr("data-update-delay", 100)
        .attr("data-update-href", "dontcareUrl");
      $elem.AutoRefreshableCounter('update');

      var value = 0;
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          data: value
        })
      });
      expect($elem.html()).toEqual('');
    });
  });
});
