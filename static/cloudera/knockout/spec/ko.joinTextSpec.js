// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/knockout/ko.joinText'
], function(ko) {
  describe('ko.joinText', function() {
    var $elem;

    var invoke = function(values) {
      ko.bindingHandlers.joinText.init($elem[0]);
      ko.bindingHandlers.joinText.update($elem[0], function() {
        return values;
      }, function() {
        return {};
      });
    };

    var validate = function(expected) {
      expect(ko.bindingHandlers.text.update).wasCalled();
      var args = ko.bindingHandlers.text.update.mostRecentCall.args;
      // Invoke the value accessor.
      var value = ko.utils.unwrapObservable(args[1]());
      expect(value).toEqual(expected);
    };

    beforeEach(function() {
      // It turns out that Jasmine doesn't always remove its spies when running
      // test fixtures. This is terrible. This means that here we have to check
      // if the text.update method is already a spy and, if so, reset it.
      if (ko.bindingHandlers.text.update.andCallThrough) {
        ko.bindingHandlers.text.update.reset();
      } else {
        spyOn(ko.bindingHandlers.text, 'update');
      }
      $elem = $('<p></p>').appendTo('body');
    });

    afterEach(function() {
      $elem.remove();
    });

    it('handles single values just fine', function() {
      invoke('catpants');
      validate('catpants');
    });

    it('handles single observables just fine', function() {
      invoke(ko.observable('doggyhat'));
      validate('doggyhat');
    });

    it('joins together arrays', function() {
      $elem.html(' OR ');
      invoke(['catpants', 'doggyhat', 'horsepoo']);
      validate('catpants OR doggyhat OR horsepoo');
    });

    it('uses html if the template says to', function() {
      $elem.html(' <strong>AND</strong> ');
      invoke(['doggyhat', 'horsepoo']);
      validate('doggyhat <strong>AND</strong> horsepoo');
    });

    it('works with observable arrays, too', function() {
      $elem.html(' AND ');
      invoke(ko.observableArray(['catpants', 'horsepoo']));
      validate('catpants AND horsepoo');
    });
  });
});