// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/knockout/ko.formattedDate'
], function(ko) {
  describe('ko.formattedDate', function() {

    var callUpdate = function(dateValue, allBindings) {
      var valueAccessor = function() {
        return dateValue;
      };
      var allBindingsAccessor = function() {
        return allBindings || {};
      };
      ko.bindingHandlers.formattedDate.update(undefined, valueAccessor, allBindingsAccessor);
    };

    var getTextValueAccessorValue = function() {
      expect(ko.bindingHandlers.text.update).wasCalled();
      var args = ko.bindingHandlers.text.update.mostRecentCall.args;
      return args[1]();
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
    });

    it('formats a unix timestamp', function() {
      callUpdate(24 * 60 * 60 * 1000);
      expect(getTextValueAccessorValue()).toEqual('January 1 1970 4:00 PM');

      callUpdate(2 * 24 * 60 * 60 * 1000);
      expect(getTextValueAccessorValue()).toEqual('January 2 1970 4:00 PM');
    });

    it('formats a date string', function() {
      callUpdate(new Date(2 * 24 * 60 * 60 * 1000).toISOString());
      expect(getTextValueAccessorValue()).toEqual('January 2 1970 4:00 PM');
    });

    it('can use custom method on humanize to format date', function() {
      callUpdate(24 * 60 * 60 * 1000, {
        formattedDateMethod: 'humanizeTimeShortAndMS'
      });
      expect(getTextValueAccessorValue()).toEqual('4:00:00.000 PM');
    });

    it('defaults to humanizeDateTimeMedium if bad method name given', function() {
      callUpdate(24 * 60 * 60 * 1000, {
        formattedDateMethod: 'catpants'
      });
      expect(getTextValueAccessorValue()).toEqual('January 1 1970 4:00 PM');
    });
  });
});