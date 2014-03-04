// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/search/ko.onEnter'
], function(ko) {
  describe('ko.onEnter', function() {
    it('calls callback on enter', function() {
      var callback = jasmine.createSpy('callback');
      var $element = $('<div/>').appendTo(document.body);
      ko.bindingHandlers.onEnter.init($element[0], function() { return callback; });

      var keypressEvent = $.Event('keypress', {
        which: 65 // A
      });
      $element.trigger(keypressEvent);
      expect(callback).wasNotCalled();

      keypressEvent = $.Event('keypress', {
        which: 13 // Enter
      });
      $element.trigger(keypressEvent);
      expect(callback).wasCalled();
    });
  });
});