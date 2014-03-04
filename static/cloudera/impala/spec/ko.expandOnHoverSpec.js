// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/impala/ko.expandOnHover'
], function(ko) {
  describe('ko.expandOnHover', function() {
    var $element, options;

    var callInit = function() {
      ko.bindingHandlers.expandOnHover.init($element[0], function() {
        return options;
      });
    };

    beforeEach(function() {
      $element = $('<div/>').appendTo(document.body);
      options = {};
      // Spy on jQuery so we can pick up the event delegation.
      spyOn($.fn, 'on').andCallFake(function() {
        // Do this of chaining is broken.
        return this;
      });
    });

    afterEach(function() {
      $element.remove();
    });

    it('binds to mouseenter and mouseleave', function() {
      callInit();
      expect($.fn.on.callCount).toEqual(2);
      var args = $.fn.on.argsForCall[0];
      expect(args[0]).toEqual('mouseenter');
      args = $.fn.on.argsForCall[1];
      expect(args[0]).toEqual('mouseleave');
    });

    it('filters according to options', function() {
      options.hoverSelector = '.catpants';
      callInit();
      var args = $.fn.on.argsForCall[0];
      expect(args[1]).toEqual(options.hoverSelector);
      args = $.fn.on.argsForCall[1];
      expect(args[1]).toEqual(options.hoverSelector);
    });

    describe('mouseenter', function() {
      var mouseEnterHandler, measurementHeight;

      beforeEach(function() {
        options.hoverClass = 'hoverpants';
        options.measurementSelector = '.measure-me';
        // Add the measurement child.
        measurementHeight = 456;
        $('<div class="measure-me"></div>')
          .height(measurementHeight)
          .appendTo($element);
        callInit();
        var args = $.fn.on.argsForCall[0];
        mouseEnterHandler = args[2];
      });

      it('stores setTimeout handle as data in element', function() {
        // Don't let the setTimeout call go through.
        spyOn(window, 'setTimeout').andReturn(42);
        mouseEnterHandler.call($element[0]);
        expect($element.data('timeout-handle')).toEqual(42);
      });

      it('hover handler stores height, adds hover class, and calls animate', function() {
        spyOn(window, 'setTimeout').andReturn(34);
        mouseEnterHandler.call($element[0]);
        var callback = window.setTimeout.mostRecentCall.args[0];
        // Set an explicit height on our $element.
        var preHoverHeight = 123;
        $element.height(preHoverHeight);
        // Spy on animate.
        spyOn($.fn, 'animate');

        callback();
        expect($element.data('pre-hover-height')).toEqual(preHoverHeight);
        expect($element.hasClass(options.hoverClass)).toBeTruthy();
        expect($.fn.animate).wasCalled();
        var args = $.fn.animate.mostRecentCall.args;
        expect(args[0].height).toEqual(measurementHeight + 'px');
      });
    });

    describe('mouseleave', function() {
      var mouseLeaveHandler;

      beforeEach(function() {
        options.hoverClass = 'hovercat';
        callInit();
        var args = $.fn.on.argsForCall[1];
        mouseLeaveHandler = args[2];
      });

      it('clears timeout on element', function() {
        spyOn(window, 'clearTimeout');
        $element.data('timeout-handle', 867);
        mouseLeaveHandler.call($element[0]);
        expect(window.clearTimeout).wasCalledWith(867);
      });

      it('unhovers and animates height change', function() {
        $element.addClass(options.hoverClass);
        $element.data('pre-hover-height', '10px');
        spyOn($.fn, 'animate');
        mouseLeaveHandler.call($element[0]);
        expect($element.hasClass(options.hoverClass)).toBeFalsy();
        expect($.fn.animate).wasCalled();
        var args = $.fn.animate.mostRecentCall.args;
        expect(args[0].height).toEqual('10px');
      });
    });
  });
});