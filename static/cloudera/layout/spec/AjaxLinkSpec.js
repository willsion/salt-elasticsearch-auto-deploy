// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/layout/AjaxLink",
  // we use MegaBase to associate elements with class AjaxLink
  // to AjaxLink.
  "cloudera/MegaBase"
], function(AjaxLink, MegaBase) {

  describe("AjaxLink Tests", function() {
    var someButton = '<a id="someButton" data-method="post" class="AjaxLink" href="/dontcare">Ajax Button</a>';

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();

      $(someButton).appendTo("body");
      $.fn.AjaxLink.defaults.spinnerDisplayDurationInMS = 0;
    });

    afterEach(function() {
      $("#someButton").remove();
    });

    it("should process a response via AJAX.", function() {
      $("#someButton").trigger("click");

      runs(function() {
        var request = mostRecentAjaxRequest();
        request.response({
          status: 200,
          contentType: "text/html",
          responseText: '<div id="bar" class="modal"></div>'
        });
      });

      waits(50);

      runs(function() {
        expect($("#bar").length > 0).toBeTruthy();
        $("#bar").remove();
      });
    });

    it("should block a response via AJAX when a dialog with the same id exists.", function() {
      var $existingDialog = $('<div id="bar" class="modal in"></div>');
      $existingDialog.appendTo("body");

      runs(function() {
        $("#someButton").trigger("click");

        var request = mostRecentAjaxRequest();
        request.response({
          status: 200,
          contentType: "text/html",
          responseText: '<div id="bar"><div id="barContent"></div></div>'
        });
      });

      waits(50);

      runs(function() {
        // Don't expect the new content to be added because
        // an existing dialog is shown.
        expect($("#barContent").length === 0).toBeTruthy();

        $existingDialog.remove();
      });
    });

    it("should make sure a please wait message is visible", function() {
      runs(function() {
        $("#someButton").trigger("click");

        // Expec the global spinner backdrop to be present.
        expect($(".global-spinner-backdrop:visible").length).toEqual(1);
        expect($(".global-spinner-well:visible").length).toEqual(1);

        var request = mostRecentAjaxRequest();
        request.response({
          status: 200,
          contentType: "text/html",
          responseText: '<div id="bar" class="modal"></div>'
        });
      });

      waits(50);

      runs(function() {
        // Remove the global spinner backdrop.
        expect($(".global-spinner-backdrop:visible").length).toEqual(0);
        expect($(".global-spinner-well:visible").length).toEqual(0);

        $("#bar").remove();
      });
    });
  });
});
