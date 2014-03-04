// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/UrlParams',
  'underscore'
], function(UrlParams, _) {
  describe('UrlParams', function() {
    var oldHash;

    beforeEach(function() {
      // Clear before every test.
      UrlParams.params = {};
      // Save the current hash for restoring later.
      oldHash = window.location.hash;
    });

    afterEach(function() {
      window.location.hash = oldHash;
    });

    it('is a singleton off the window object', function() {
      expect(window._urlParams).toBeDefined();
    });

    it('stuffs params from hash into params field', function() {
      spyOn($, 'publish');
      window.location.hash = 'a=1&b=2&c=3&d=catpants';

      waitsFor(function() {
        return UrlParams.params.a === '1';
      }, "The value a should be set to 1", 100);

      runs(function() {
        expect(UrlParams.params.a).toEqual('1');
        expect(UrlParams.params.b).toEqual('2');
        expect(UrlParams.params.c).toEqual('3');
        expect(UrlParams.params.d).toEqual('catpants');
        expect($.publish).wasCalledWith("urlHashChanged", [UrlParams.params]);
      });
    });

    it('unescapes params when adding them to params field', function() {
      window.location.hash = 'thing=%5B%7B%22propertyName%22%3A%22CATEGORY%22%2C%22compareType%22%3A%22EQ%22%2C%22value%22%3A%22catpants%22%7D%5D';

      waitsFor(function() {
        return UrlParams.params.thing !== undefined;
      }, "The UrlParams.params.thing should be set", 100);

      runs(function() {
        var expected = JSON.stringify([{
          propertyName: 'CATEGORY',
          compareType: 'EQ',
          value: 'catpants'
        }]);
        expect(UrlParams.params.thing).toEqual(expected);
      });
    });

    it('handles the case where the hash is empty', function() {
      window.location.hash = null;
      // If this test doesn't throw an error, this worked just fine.
      UrlParams.onHashChange();
      expect(_.size(UrlParams.params)).toEqual(0);
    });

    it('allows getting', function() {
      UrlParams.params.cat = 'pants';
      expect(UrlParams.get('cat')).toEqual('pants');
    });

    it('allows getting with default values', function() {
      expect(UrlParams.params.cat).not.toBeDefined();
      expect(UrlParams.get('cat')).toEqual(undefined);
      expect(UrlParams.get('cat', 'pants')).toEqual('pants');
    });

    it('allows getting int values', function() {
      UrlParams.params.cat = '3';
      expect(UrlParams.getInt('cat')).toEqual(3);
    });

    it('allows getting ints with default values', function() {
      expect(UrlParams.params.cat).not.toBeDefined();
      expect(UrlParams.getInt('cat')).toEqual(0);
      expect(UrlParams.getInt('cat', 42)).toEqual(42);
    });

    it('allows getting ints with non-string values', function() {
      UrlParams.params.cat = 'pants';
      expect(UrlParams.getInt('cat')).toEqual(0);
    });

    it('allows params to be set', function() {
      window.location.hash = 'cat=pants';
      spyOn($, 'publish');
      UrlParams.set('dog', 'hat');

      waitsFor(function() {
        return $.publish.calls.length > 0;
      }, "$.publish should have been called.", 200);

      runs(function() {
        expect(window.location.hash).toEqual('#cat=pants&dog=hat');
        expect($.publish).wasCalledWith("urlHashChanged", [UrlParams.params]);
      });
    });

    it('allows multiple params to be set at once', function() {
      window.location.hash = 'cat=pants';
      spyOn($, 'publish');
      UrlParams.set({
        dog: 'hat',
        horse: 'poo'
      });

      waitsFor(function() {
        return $.publish.calls.length > 0;
      }, "$.publish should have been called.", 200);

      runs(function() {
        expect(window.location.hash).toEqual('#cat=pants&dog=hat&horse=poo');
        expect($.publish).wasCalledWith("urlHashChanged", [UrlParams.params]);
      });
    });

    it('allows multiple params to be set and deleted at once', function() {
      window.location.hash = 'cat=pants&pig=tail';
      spyOn($, 'publish');
      UrlParams.set({
        dog: 'hat',
        horse: 'poo',
        pig: undefined
      });

      waitsFor(function() {
        return $.publish.calls.length > 0;
      }, "$.publish should have been called.", 200);

      runs(function() {
        expect(window.location.hash).toEqual('#cat=pants&dog=hat&horse=poo');
        expect($.publish).wasCalledWith("urlHashChanged", [UrlParams.params]);
      });
    });

    it('allows params to be deleted', function() {
      window.location.hash = 'cat=pants';
      spyOn($, 'publish');
      UrlParams.remove('cat');

      waitsFor(function() {
        return $.publish.calls.length > 0;
      }, "$.publish should have been called.", 200);

      runs(function() {
        expect(window.location.hash).toEqual('');
        expect($.publish).wasCalledWith("urlHashChanged", [UrlParams.params]);
      });
    });

    it('allows multiple params to be deleted at once', function() {
      window.location.hash = 'cat=pants&dog=hat';
      spyOn($, 'publish');
      UrlParams.remove(['cat', 'dog']);

      waitsFor(function() {
        return $.publish.calls.length > 0;
      }, "$.publish should have been called.", 200);

      runs(function() {
        expect(window.location.hash).toEqual('');
        expect($.publish).wasCalledWith("urlHashChanged", [UrlParams.params]);
      });
    });
  });
});
