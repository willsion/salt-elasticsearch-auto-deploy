// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'underscore',
  'knockout',
  'cloudera/knockout/ko.select2'
], function(_, ko) {
  describe('ko.select2', function() {
    var fakeElement, options;

    var makeBind = function(thing) {
      return function() {
        return thing;
      };
    };

    var callInit = function() {
      ko.bindingHandlers.select2.init(fakeElement, makeBind(options));
    };

    var callUpdate = function() {
      ko.bindingHandlers.select2.update(fakeElement, makeBind(options));
    };

    beforeEach(function() {
      fakeElement = {};
      options = {};
    });

    it('initializes select2 with the given options', function() {
      spyOn($.fn, 'select2');
      callInit();
      expect($.fn.select2).wasCalledWith(options);
    });

    it('adds a dispose callback to Knockout during init', function() {
      spyOn($.fn, 'select2');
      spyOn(ko.utils.domNodeDisposal, 'addDisposeCallback');
      callInit();
      expect(ko.utils.domNodeDisposal.addDisposeCallback).wasCalled();
      var args = ko.utils.domNodeDisposal.addDisposeCallback.mostRecentCall.args;
      expect(args.length).toEqual(2);
      expect(args[0]).toEqual(fakeElement);
      // Invoke the disposal callback and verify it destroyed select2.
      args[1]();
      expect($.fn.select2).wasCalledWith('destroy');
    });

    it('triggers a change event on update', function() {
      spyOn($.fn, 'trigger');
      callUpdate();
      expect($.fn.trigger).wasCalledWith('change');
    });

    describe('I18n', function() {
      var verifyFormatter = function(name, key) {
        spyOn(jQuery.fn, 'select2');
        callInit();
        expect(jQuery.fn.select2).wasCalled();
        var args = jQuery.fn.select2.mostRecentCall.args;
        expect(args.length).toEqual(1);
        var options = args[0];
        expect(options[name]).toBeDefined();
        expect(options[name]()).toEqual('ui.select2.' + key);
      };

      it('formats no matches', function() {
        verifyFormatter('formatNoMatches', 'noMatches');
      });

      it('formats searching', function() {
        verifyFormatter('formatSearching', 'searching');
      });

      it('formats input too short', function() {
        verifyFormatter('formatInputTooShort', 'inputTooShort');
      });

      it('formats selection too big', function() {
        verifyFormatter('formatSelectionTooBig', 'selectionTooBig');
      });

      it('formats load more', function() {
        verifyFormatter('formatLoadMore', 'loadMore');
      });
    });
  });
});
