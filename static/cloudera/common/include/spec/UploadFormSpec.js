// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/include/UploadForm'
], function(UploadForm) {
  describe("UploadForm Tests", function() {

    var module, dom = '<form class="form-inline upload-form" action="<% CmfPath.License.buildGetUrl(CmfPath.License.INSTALL, null) #H %>" enctype="multipart/form-data" method="POST" target="hiddenIframeForUpload">' +
    '<div style="display:none">' +
    '<label><input name="file" type="file" /></label>' +
    '</div>' +
    '<input type="text"/>' +
    '<button class="btn btn-primary btn-large upload-btn">Upload</button>' +
    '<span class="success" style="display:none">OK</span>' +
    '<span class="error" style="display:none"></span>' +
    '</form>' +
    '<div name="hiddenIframeForUpload" id="hiddenIframeForUpload" style="display: none">' +
    '<input name="error" type="hidden"/>' +
    '<input name="message" type="hidden"/>' +
    '</div>';
    var options = {
      container: ".upload-form",
      iframeElement: "#hiddenIframeForUpload"
    };

    beforeEach(function() {
      $(dom).appendTo(document.body);
    });

    afterEach(function() {
      $(options.container).remove();
      $(options.iframeElement).remove();
    });

    it("should check the output of a successful license install", function() {
      module = new UploadForm(options);
      spyOn($, "publish");
      spyOn(module, "getIFrameContent").andReturn($("#hiddenIframeForUpload"));

      module.getIFrameContent().find("input[name=error]").val("false");
      module.getIFrameContent().find("input[name=message]").val("");

      module.checkPostOutput();

      expect(module.getSuccessContainer().is(":visible")).toBeTruthy();
      expect(module.getErrorContainer().is(":visible")).toBeFalsy();

      expect($.publish).wasCalledWith("fileUploaded", [true]);
    });

    it("should check the output of a bad license install", function() {
      module = new UploadForm(options);
      spyOn($, "publish");
      spyOn(module, "getIFrameContent").andReturn($("#hiddenIframeForUpload"));

      module.getIFrameContent().find("input[name=error]").val("true");
      module.getIFrameContent().find("input[name=message]").val("Foo");

      module.checkPostOutput();

      expect(module.getSuccessContainer().is(":visible")).toBeFalsy();
      expect(module.getErrorContainer().is(":visible")).toBeTruthy();

      expect($.publish).wasNotCalled();
    });

    it("should check the output is cleared", function() {
      module = new UploadForm(options);
      spyOn($, "publish");
      spyOn(module, "getIFrameContent").andReturn($("#hiddenIframeForUpload"));

      module.clearPostOutput();

      expect(module.getSuccessContainer().is(":visible")).toBeFalsy();
      expect(module.getErrorContainer().is(":visible")).toBeFalsy();

      expect(module.getIFrameContent().find("input[name=error]").val()).toEqual("");
      expect(module.getIFrameContent().find("input[name=message]").val()).toEqual("");

      expect($.publish).wasCalledWith("fileUploaded", [false]);
    });

    it("should check the display is set correctly", function() {
      var filename = "fakeLicense.txt";
      module = new UploadForm(options);
      spyOn(module, "enableDisableUploadButton");

      module.getFileInput().trigger("change");
      expect(module.enableDisableUploadButton).wasCalled();
    });
  });
});
