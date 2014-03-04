// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/impala/ImpalaSyntaxHighlighter'
], function(impalaSyntaxHighlighter) {
  describe('ImpalaSyntaxHighlighter', function() {
    it('formats Impala keywords correctly', function() {
      var result = impalaSyntaxHighlighter(
        'select catpants as horsepoo from doggyhat where cat > ' +
        'pants and pants in cat group by stuff order by dog limit 5 ' +
        'like foo or bar join dog on horse');
      expect(result).toEqual(
        '<span class="keyword">select</span> catpants ' +
        '<span class="keyword">as</span> horsepoo ' +
        '<span class="keyword">from</span> doggyhat ' +
        '<span class="keyword">where</span> cat > pants ' +
        '<span class="keyword">and</span> pants ' +
        '<span class="keyword">in</span> cat ' +
        '<span class="keyword">group by</span> stuff ' +
        '<span class="keyword">order by</span> dog ' +
        '<span class="keyword">limit</span> 5 ' +
        '<span class="keyword">like</span> foo ' +
        '<span class="keyword">or</span> bar ' +
        '<span class="keyword">join</span> dog ' +
        '<span class="keyword">on</span> horse');
    });

    it('formats case insensitively', function() {
      var result = impalaSyntaxHighlighter(
        'SELECT catpants aS horsepoo fROm doggyhat wHERe cat > pants AND pants > cat');
      expect(result).toEqual(
        '<span class="keyword">SELECT</span> catpants ' +
        '<span class="keyword">aS</span> horsepoo ' +
        '<span class="keyword">fROm</span> doggyhat ' +
        '<span class="keyword">wHERe</span> cat > pants ' +
        '<span class="keyword">AND</span> pants > cat');
    });

  });
});