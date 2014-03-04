// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/events/page/ko.substituteText'
], function(ko) {
  describe('ko.substituteText', function() {
    var $element, content, allBindings;

    var makeBind = function(thing) {
      return function() {
        return thing;
      };
    };

    var callInit = function() {
      ko.bindingHandlers.substituteText.init(
        $element[0], makeBind(content), makeBind(allBindings));
    };

    beforeEach(function() {
      $element = $('<div>I get <b>substituted</b> in and {{ value }} goes here. Nothing</div>').appendTo($('body'));
      content = 'Here is some content. catpants goes here.';
      allBindings = {
        substituteTextValue: 'catpants'
      };
    });

    afterEach(function() {
      $element.remove();
    });

    it('substitues the value correctly', function() {
      callInit();
      var html = $element.html();
      var expected = 'Here is some content. ' +
        'I get <b>substituted</b> in and catpants goes here. ' +
        'Nothing goes here.';
      expect(html).toEqual(expected);
    });
  });
});
