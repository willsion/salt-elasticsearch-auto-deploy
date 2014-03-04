// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/hosts/HostInspectorStep'
], function(HostInspectorStep) {
  describe("HostInspectorStep Tests", function() {
    var id = "hostInspectorStep", module;

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should initialize a HostInspectorStep", function() {
      module = new HostInspectorStep({
        id: id,
        url: "dontcare"
      });
      expect(module.running()).toBeFalsy();
      var callback = function() {};
      module.beforeEnter(callback);

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: JSON.stringify({
          message: "OK",
          data: {
            "commandId": 123,
            "dataUrl": "someDataUrl",
            "progressUrl": "someProgressUrl"
          }
        })
      });
    });

    it("should test skip", function() {
      module = new HostInspectorStep({
        id: id,
        url: "dontcare"
      });

      module.running(true);
      expect(module.enableContinue()).toBeFalsy();
      expect(module.running()).toBeTruthy();
      module.skip();
      expect(module.running()).toBeFalsy();
      expect(module.enableContinue()).toBeTruthy();
    });

    it("should update the page with data", function() {
      $("#" + id).append("<div class='inspectorData'></div>");
      module = new HostInspectorStep({
        id: id,
        url: "dontcare"
      });
      module.running(true);
      module.dataCallback("Some HTML");
      expect($(module.dataContainer).html()).toEqual("Some HTML");
    });

    it("should inspect the progress and call dataCallback", function() {
      $("#" + id).append("<div class='inspectorData'></div>");

      module = new HostInspectorStep({
        id: id,
        url: "dontcare"
      });
      spyOn(module, "scheduleNextUpdate");
      module.running(true);
      module.progressCallback({
        isRunning: true
      });
      expect(module.scheduleNextUpdate).wasCalled();

      module.progressCallback({
        isRunning: false
      });
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "text/html",
        responseText: "Some HTML Fragment"
      });
      expect($(module.dataContainer).html()).toEqual("Some HTML Fragment");
      expect(module.running()).toBeFalsy();
    });
  });
});
