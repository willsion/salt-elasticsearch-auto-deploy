// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'knockout/ko.infinitescroll.js'
], function(ko) {
  describe('ko.infinitescroll', function() {
    var $elem, test = {test: function(data){
      data.offset += 10;
      data.complete = data.offset === 20;
    }};

    beforeEach(function() {
      $elem = $('<div style="height: 20px; overflow-y: auto;"><div id="inner" style="height: 15px;">Just a test.</div><div id="inner" style="height: 15px;">Just a test.</div></div>').appendTo('body');
    });

    afterEach(function() {
      $elem.remove();
    });

    it('fire the handler when the lower scroll bound is reached', function() {
      var inner = $elem.find('#inner');

      spyOn(test, 'test').andCallThrough();

      ko.bindingHandlers.infinitescroll.init($elem, function() {return test.test;});

      //Initial call
      expect(test.test).toHaveBeenCalled();

      expect(test.test.argsForCall[0][0].offset).toEqual(10);
      expect(test.test.argsForCall[0][0].complete).toBe(false);

      test.test.reset();

      $elem.scrollTop(5);
      $elem.scroll();

      expect(test.test).not.toHaveBeenCalled();

      $elem.scrollTop(15);
      $elem.scroll();

      expect(test.test).toHaveBeenCalled();

      expect(test.test.argsForCall[0][0].offset).toEqual(20);

      expect(test.test.argsForCall[0][0].complete).toBe(true);
    });
  });
});