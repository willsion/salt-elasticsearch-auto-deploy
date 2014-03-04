// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/knockout/ko.animatedHide'
], function(ko) {
  describe('ko.animatedHide', function() {
    it('calls hide when the observable becomes true', function() {
      // Set it up.
      var $element = $('<div>Something</div>').appendTo(document.body);
      spyOn($.fn, 'hide');
      var hideIt = ko.observable(false);

      // Run the test.
      ko.bindingHandlers.animatedHide.update($element[0], function() {
        return hideIt;
      });
      expect($.fn.hide).wasNotCalled();
      hideIt(true);
      ko.bindingHandlers.animatedHide.update($element[0], function() {
        return hideIt;
      });
      expect($.fn.hide).wasCalled();

      // Tear it down.
      $element.remove();
    });
  });
});