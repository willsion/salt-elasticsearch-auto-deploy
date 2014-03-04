// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/Url'
], function(Url) {
  describe('Url', function() {
    it('constructs correctly', function() {
      var u = new Url('http://catpants.com/');
      expect(u.getHref()).toEqual('http://catpants.com/');
    });

    it('knows how to fetch the param string', function() {
      var u = new Url('http://catpants.com?q=1&w=2&e=3');
      expect(u.getParamsString()).toEqual('q=1&w=2&e=3');
    });

    it('knows how to fetch the param object', function() {
      var u = new Url('http://catpants.com?q=1&w=2&e=3');
      var params = u.getParamsObject();
      expect(params.q).toEqual('1');
      expect(params.w).toEqual('2');
      expect(params.e).toEqual('3');
    });

    it('knows how to set the params object', function() {
      var u = new Url('http://catpants.com');
      u.setParamsObject({
        q: 4,
        w: 5,
        e: 6
      });
      expect(u.getHref()).toEqual('http://catpants.com/?q=4&w=5&e=6');
    });
  });
});
