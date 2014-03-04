// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/events/page/ko.withHealthCheckJson'
], function(ko) {
  describe('ko.withHealthCheckJson', function() {
    var $element, value;

    var bindIt = function(thing) {
      return function() {
        return thing;
      };
    };

    var callInit = function() {
      return ko.bindingHandlers.withHealthCheckJson.init($element[0], bindIt(value));
    };

    var callUpdate = function() {
      ko.bindingHandlers.withHealthCheckJson.update($element[0], bindIt(value));
    };

    beforeEach(function() {
      $element = $('<div/>').appendTo('body');
      value = JSON.stringify({
        cat: 'pants'
      });
    });

    afterEach(function() {
      $element.remove();
    });

    it('acts like "with" on init', function() {
      spyOn(ko.bindingHandlers['with'], 'init').andReturn('foo');
      var result = callInit();
      expect(ko.bindingHandlers['with'].init).wasCalled();
      expect(result).toEqual('foo');
    });

    it('parses JSON value on update', function() {
      spyOn(ko.bindingHandlers['with'], 'update');
      callUpdate();
      expect(ko.bindingHandlers['with'].update).wasCalled();
      var args = ko.bindingHandlers['with'].update.mostRecentCall.args;
      var valueAccessor = args[1];
      var value = valueAccessor();
      expect(value).toBeDefined();
      expect(value.cat).toEqual('pants');
    });

    it('passes empty health check on JSON error', function() {
      value = 'NOT VALID JSON';
      spyOn(ko.bindingHandlers['with'], 'update');
      callUpdate();
      expect(ko.bindingHandlers['with'].update).wasCalled();
      var args = ko.bindingHandlers['with'].update.mostRecentCall.args;
      var valueAccessor = args[1];
      var updatedValue = valueAccessor();
      expect(updatedValue).toBeDefined();
      expect(updatedValue.error).toBeTruthy();
      expect(updatedValue.testName).toEqual('');
      expect(updatedValue.messageCodes).toBeDefined();
      expect(updatedValue.messageCodes.length).toEqual(0);
      expect(updatedValue.eventCode).toEqual('');
    });
  });
});