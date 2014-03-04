// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/UserSettings"
], function(UserSettings) {

  describe("UserSettings Tests", function() {
    var testResponse;

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();

      testResponse = {
        status: 200,
        contentType: "application/json",
        responseText: '{"message":"OK", "data":null}'
      };
    });

    it("should make 'clear' AJAX call and call the callback function.", function() {

      var callback = jasmine.createSpy();
      UserSettings.clear(callback);

      testResponse.responseText = '{"message":"OK", "data":null}';
      var request = mostRecentAjaxRequest();
      request.response(testResponse);

      expect(request.url).toContain("/clear");
      expect(callback).toHaveBeenCalled();

    });

    it("should make 'update' AJAX call and call the callback function.", function() {

      var aValue, key, value;
      key = "myKey";
      value = "myValue";

      UserSettings.update(key, value, function(data) {
        aValue = data;
      });

      var request = mostRecentAjaxRequest();

      testResponse.responseText = '{"message":"OK", "data":"'+value+'"}';
      request.response(testResponse);

      expect(request.url).toContain("/put");
      expect(request.params).toContain("key=myKey");
      expect(request.params).toContain("value=myValue");
      expect(aValue).toEqual(value);
    });

    it("should make 'get' AJAX call and call the callback function.", function() {

      var callback, key, eValue, aValue;
      key = "myKey";
      eValue = "myValue";

      UserSettings.get(key, function(data) {
        aValue = data;
      });

      var request = mostRecentAjaxRequest();

      testResponse.responseText = '{"message":"OK", "data":"'+eValue+'"}';
      request.response(testResponse);

      expect(request.url).toContain("/get");
      expect(request.params).toContain("key=myKey");
      expect(aValue).toEqual(eValue);
    });

    it("should not call callback if we don't pass function", function() {
      UserSettings.clear();
      var request = mostRecentAjaxRequest();
      request.response(testResponse);
    });

    it("should handle errors", function() {

      var aValue, key, value;
      key = "myKey";
      value = "myValue";

      UserSettings.update(key, value, function(data) {
        aValue = data;
      });

      var request = mostRecentAjaxRequest();

      testResponse.status = 401;
      testResponse.responseText = '';
      request.response(testResponse);

      expect(aValue).toEqual(null);
    });

    it("should pass back null when the message response is not OK", function() {

      var aValue, key, value;
      key = "myKey";
      value = "myValue";

      UserSettings.update(key, value, function(data) {
        aValue = data;
      });

      var request = mostRecentAjaxRequest();

      testResponse.status = 200;
      testResponse.responseText = '{"message":"Failed"}';
      request.response(testResponse);

      expect(aValue).toEqual(null);
    });
  });
});
