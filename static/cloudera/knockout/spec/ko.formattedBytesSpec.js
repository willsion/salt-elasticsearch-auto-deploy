// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/knockout/ko.formattedBytes'
], function(ko) {
  describe('ko.formattedBytes', function() {
    it('formats bytes', function() {
      var update = ko.bindingHandlers.text.update,
        valueAccessor;
      ko.bindingHandlers.text.update = function(blah, va) {
        valueAccessor = va;
      };
      ko.bindingHandlers.formattedBytes.update(undefined, function() { });

      expect(valueAccessor()).toEqual('0 B');

      ko.bindingHandlers.formattedBytes.update(undefined, function() { return 37;});

      expect(valueAccessor()).toEqual('37 B');

      ko.bindingHandlers.formattedBytes.update(undefined, function() { return 900;});

      expect(valueAccessor()).toEqual('900 B');

      ko.bindingHandlers.text.update = update;
    });

    it('formats mebibytes', function() {
      var update = ko.bindingHandlers.text.update,
        valueAccessor;
      ko.bindingHandlers.text.update = function(blah, va) {
        valueAccessor = va;
      };
      ko.bindingHandlers.formattedBytes.update(undefined, function() { return 55 * 1024 * 1024;});

      expect(valueAccessor()).toEqual('55.0 MiB');

      ko.bindingHandlers.text.update = update;
    });
  });
});