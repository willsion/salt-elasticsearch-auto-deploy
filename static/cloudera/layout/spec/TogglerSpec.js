// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/layout/Toggler'
], function(Toggler) {
  describe('Toggler', function() {
    var $element, $toggled;

    beforeEach(function() {
      $element = $('<a href="#" class="Toggler" data-element-selector="div" data-element-direction="next"></a>').appendTo(document.body);
      $toggled = $('<div></div>').insertAfter($element);
      $element.Toggler();
    });

    afterEach(function() {
      $element.remove();
      $toggled.remove();
    });

    it('is defined on the jQuery object', function() {
      expect($.fn.Toggler).toBeDefined();
    });

    it('fires DOM event when toggled', function() {
      var listener = jasmine.createSpy('listener');
      $element.on('toggled', listener);
      $element.trigger('click');
      expect(listener).wasCalled();
    });

    it('can hide the thing it is toggling', function() {
      expect($toggled.is(':visible')).toBeTruthy();
      $element.Toggler('hide');
      expect($toggled.is(':visible')).toBeFalsy();
    });

    it('can show the thing it is toggling', function() {
      $toggled.hide();
      expect($toggled.is(':visible')).toBeFalsy();
      $element.Toggler('show');
      expect($toggled.is(':visible')).toBeTruthy();
    });
  });
});
