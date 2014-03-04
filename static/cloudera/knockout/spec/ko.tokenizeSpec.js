// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/I18n',
  'knockout',
  'underscore',
  'cloudera/knockout/ko.tokenize'
], function(I18n, ko, _) {
  describe('ko.tokenize', function() {
    var $element, tokenInputOptions, options, value;

    var callInit = function() {
      ko.bindingHandlers.tokenize.init($element[0], function() {
        return options;
      });
    };

    var callUpdate = function() {
      ko.bindingHandlers.tokenize.update($element[0], function() {
        return options;
      }, function() {
        return {
          value: value
        };
      });
    };

    beforeEach(function() {
      $element = $('<div/>').appendTo('body');
      tokenInputOptions = {
        cat: 'pants',
        doggy: 'hat'
      };
      options = {
        source: '/some/random/url',
        convertServerResponse: jasmine.createSpy('convertServerResponse'),
        convertValue: jasmine.createSpy('convertValue'),
        tokenInputOptions: tokenInputOptions
      };
      value = {};
      $.fn.tokenInput = jasmine.createSpy('tokenInput');
    });

    afterEach(function() {
      $element.remove();
    });

    it('calls the tokenInput plugin correctly during init', function() {
      callInit();
      expect($.fn.tokenInput).wasCalled();
      var args = $.fn.tokenInput.mostRecentCall.args;
      expect(args[0]).toEqual(options.source);
      // Verify the options the binding passes.
      var passedOptions = args[1];
      expect(passedOptions.theme).toEqual('bootstrap');
      expect(_.isFunction(passedOptions.onResult)).toBeTruthy();
      passedOptions.onResult('catpants');
      expect(options.convertServerResponse).wasCalledWith('catpants');
      // I18n messages.
      expect(passedOptions.hintText).toEqual(I18n.t('ui.tokenInput.hintText'));
      expect(passedOptions.noResultsText).toEqual(I18n.t('ui.tokenInput.noResultsText'));
      expect(passedOptions.searchingText).toEqual(I18n.t('ui.tokenInput.searchingText'));
      // Now verify the options we stirred in.
      expect(passedOptions.cat).toEqual('pants');
      expect(passedOptions.doggy).toEqual('hat');
    });

    it('adds a dispose callback to Knockout to cleanup itself', function() {
      spyOn(ko.utils.domNodeDisposal, 'addDisposeCallback');
      callInit();
      expect(ko.utils.domNodeDisposal.addDisposeCallback).wasCalled();
      var args = ko.utils.domNodeDisposal.addDisposeCallback.mostRecentCall.args;
      expect(args.length).toEqual(2);
      expect(args[0]).toEqual($element[0]);
      // Invoke the disposal callback and verify it cleaned up tokenInput.
      args[1]();
      expect($.fn.tokenInput).wasCalledWith('cleanup');
    });

    it('clears on update when value is empty', function() {
      value = undefined;
      callUpdate();
      expect($.fn.tokenInput).wasCalledWith('clear');
      expect($.fn.tokenInput).wasNotCalledWith('add');
    });

    it('adds model values correctly on update', function() {
      value = 'catpants,doggyhat,horsepoo';
      options.convertValue.andCallFake(function(value) {
        return value;
      });
      callUpdate();
      expect(options.convertValue).wasCalled();
      expect($.fn.tokenInput.callCount).toEqual(4);
      expect($.fn.tokenInput.argsForCall[0]).toEqual(['clear']);
      expect($.fn.tokenInput.argsForCall[1]).toEqual(['add', 'catpants']);
      expect($.fn.tokenInput.argsForCall[2]).toEqual(['add', 'doggyhat']);
      expect($.fn.tokenInput.argsForCall[3]).toEqual(['add', 'horsepoo']);
    });
  });
});