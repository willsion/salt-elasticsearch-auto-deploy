// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/include/InstallDetailsDialog'
], function(InstallDetailsDialog) {
  describe("InstallDetailsDialog Tests", function() {
    var id = "installDetailsDialog", module;

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      $("#" + id).append('<div class="modal-header">' +
                         '<span class="failedState error"></span>' +
                         '<span class="currentState"></span>' +
                         '</div>')
        .append('<div class="modal-body"><div class="detailsContent"></div></div>')
        .append('<div class="modal-footer">' +
                '<button class="playUpdateDetails"></button>' +
                '<button class="pauseUpdateDetails"></button>' +
                '</div>');
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    afterEach(function() {
      module.unsubscribe();
      $("#" + id).remove();
    });

    it("should listen for a showInstallDetails event", function() {
      module = new InstallDetailsDialog({
        detailsDialogSelector: "#" + id
      });

      $.publish("showInstallDetails", ["someUrl"]);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "text/html",
        responseText: "<div class='currentState'><span>Current</span></div>" +
          "<h3>Hello</h3><h3>World</h3>"
      });

      expect($(".detailsContent").html()).toEqual("<h3>Hello</h3><h3>World</h3>");
    });

    it("should listen for a showInstallDetails event and see some failures", function() {
      module = new InstallDetailsDialog({
        detailsDialogSelector: "#" + id
      });

      $.publish("showInstallDetails", ["someUrl"]);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "text/html",
        responseText: "<div class='failedState'><span>Failure</span></div>" +
          "<div class='currentState'><span>Current</span></div>" +
          "<h3><span>First Failure</span></h3>" +
          "<h3 class='node-progress-WAITING_FOR_ROLLBACK'></h3>" +
          "<h3><span>Hello</span></h3><h3><span>World</span></h3>"
      });

      var content = '<h3 class="error"><span>First Failure</span></h3>'+
        '<h3 class="node-progress-WAITING_FOR_ROLLBACK"></h3>' +
        '<h3><span>Hello</span></h3>' +
        '<h3><span>World</span></h3>';
      expect($(".detailsContent").html()).toEqual(content);
    });

    it("should trigger the pause button", function() {
      module = new InstallDetailsDialog({
        detailsDialogSelector: "#" + id
      });

      spyOn(module.detailsAutoUpdater, "stop");
      $(".pauseUpdateDetails").trigger("click");
      expect(module.detailsAutoUpdater.stop).wasCalled();
    });
  });
});
