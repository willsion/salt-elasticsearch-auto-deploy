// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/layout/CloseableAlert",
  "cloudera/common/UserSettings"
], function(CloseableAlert, UserSettings) {

  describe("CloseableAlert Tests", function() {
    var $alert;
    var alertId = "my-alert-id";
    var alert = '<div id="someAlert" class="CloseableAlert" data-closeable-alert-id="'+alertId+'">theMessage</div>';

    function spyOnGet(value) {
      spyOn(UserSettings, "get").andCallFake(function (key, callback) {
        expect(key).toContain(alertId);
        callback(value);
      });
    }

    function spyOnUpdate(value) {
      spyOn(UserSettings, "update").andCallFake(function (key, value, callback) {
        expect(key).toContain(alertId);
        expect(value).toEqual(value);
        callback(value);
      });
    }

    beforeEach(function() {
      $alert = $(alert);
      $alert.appendTo("body");
    });

    afterEach(function() {
     $alert.remove();
    });

    it("should show alert when no user settings found.", function() {
      spyOnGet(null);
      $alert.CloseableAlert();
      expect($alert.is(":visible")).toBeTruthy();
      expect($alert.hasClass("alert")).toBeTruthy();
      expect($alert.find(".close")).toBeDefined();
      expect(UserSettings.get).toHaveBeenCalled();
    });

    it("should show alert when explicit show in user settings found.", function() {
      spyOnGet(false);
      $alert.CloseableAlert();
      expect($alert.is(":visible")).toBeTruthy();
      expect(UserSettings.get).toHaveBeenCalled();
    });

    it("should be hidden if user setting is set", function() {
      spyOnGet(true);
      $alert.CloseableAlert();
      expect($alert.is(":visible")).toBeFalsy();
      expect(UserSettings.get).toHaveBeenCalled();
    });

    it("should close alert and save settings when close button is clicked.", function() {
      spyOnGet(false);
      $alert.CloseableAlert();
      expect($alert.is(":visible")).toBeTruthy();
      expect(UserSettings.get).toHaveBeenCalled();

      spyOnUpdate(true);
      $alert.find('.close').trigger('click');
      expect($alert.is(":visible")).toBeFalsy();
      expect(UserSettings.update).toHaveBeenCalled();
    });

    it("should throw if alert is missing id", function() {
      var badAlert = '<div id="someAlert" class="CloseableAlert">theMessage</div>';
      var constructAlert = function() {
        $(badAlert).CloseableAlert();
      };
      expect(constructAlert).toThrow();
    });

  });
});
