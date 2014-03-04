// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/knockout/ko.emphasisText'
], function(ko) {
  describe('ko.emphasisText', function() {
    var $elem, text;

    var callUpdate = function(text, substring) {
      ko.bindingHandlers.emphasisText.update($elem[0], function() {
        return text;
      }, function() {
        return {
          emphasisSubstring: substring
        };
      });
    };

    beforeEach(function() {
      $elem = $('<p></p>').appendTo('body');
    });

    afterEach(function() {
      $elem.remove();
    });

    it('emphasizes text', function() {
      callUpdate('catpants', 'pants');
      expect($elem.html()).toEqual('cat<em>pants</em>');
    });

    it('matches case-insensitive', function() {
      callUpdate('CATPANTS', 'pants');
      expect($elem.html()).toEqual('CAT<em>PANTS</em>');

      callUpdate('catpants', 'PANTS');
      expect($elem.html()).toEqual('cat<em>pants</em>');
    });

    it('matches more than once', function() {
      callUpdate('catpants have dogpants', 'pants');
      expect($elem.html()).toEqual('cat<em>pants</em> have dog<em>pants</em>');
    });

    it('handles undefined substrings', function() {
      callUpdate('catpants');
      expect($elem.html()).toEqual('catpants');
    });
  });
});