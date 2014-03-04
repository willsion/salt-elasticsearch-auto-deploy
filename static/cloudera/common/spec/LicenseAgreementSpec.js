// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/LicenseAgreement'
], function(LicenseAgreement) {
  describe("License Agreement Test", function() {
    var mockStructure = '<input type="radio" name="KNOCKKNOCK" value="1"/>\n<div id="roleDialog"></div><form id="roleForm"><button data-disable-after-click-once="true" class="btn btn-primary" type="submit" name="submit"></button></form>',
        $elements,
        licenseAgreement;

    beforeEach(function() {
      $elements = $(mockStructure).appendTo('body');
      licenseAgreement = new LicenseAgreement({
        dialog: '#roleDialog',
        form: '#roleForm',
        radioName: 'KNOCKKNOCK'
      });
    });

    afterEach(function() {
      $elements.remove();
    });

    it('should initialize is a reasonable default state', function() {
      expect(licenseAgreement.licenseAccepted).toBe(false);
      expect(licenseAgreement.$instForm.length).toEqual(1);
      expect(licenseAgreement.$dialog.length).toEqual(1);
      expect(licenseAgreement.$radioButtons.length).toEqual(1);
    });

    it('shouldn\'t block the initial call to submit if the radio button isn\'t selected', function() {
      expect(licenseAgreement.submitHandler()).toBeTruthy();
    });

    it('should block the initial call to submit if the radio button is selected and the agreement hasn\'t been accepted', function() {
      licenseAgreement.$radioButtons.attr('checked', true);
      expect(licenseAgreement.submitHandler()).toBeFalsy();
    });

    it('should allow the call to submit if the radio button is selected and the agreement has been accepted', function() {
      licenseAgreement.$radioButtons.attr('checked', true);
      licenseAgreement.licenseAccepted = true;
      expect(licenseAgreement.submitHandler()).toBeTruthy();
    });

    it('should set licenseAccepted to true and resubmit the form when acceptHandler is called', function() {
      var $submitButton = licenseAgreement.$instForm.find('[name=submit]'),
          resubmitted = false;
      $submitButton.click(function() {
        resubmitted = true;
        return false;
      });
      $submitButton.addClass('disabled');
      licenseAgreement.acceptHandler();
      expect(licenseAgreement.licenseAccepted).toBeTruthy();
      expect($submitButton.hasClass('disabled')).toBeFalsy();
      expect(resubmitted).toBeTruthy();
    });

    it('should uncheck the radio button if the dialogHideHandler is called when the license agreement hasn\'t been accepted', function() {
      var $submitButton = licenseAgreement.$instForm.find('[name=submit]');
      licenseAgreement.$radioButtons.attr('checked', true);
      $submitButton.addClass('disabled');
      licenseAgreement.hideDialogHandler();
      expect(licenseAgreement.$radioButtons.filter(':checked').length).toEqual(0);
      expect($submitButton.hasClass('disabled')).toBeFalsy();
    });
  });
});