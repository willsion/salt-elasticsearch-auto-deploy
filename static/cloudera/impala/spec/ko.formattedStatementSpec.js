// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/impala/ko.formattedStatement'
], function(ko) {
  describe('ko.formattedStatement', function() {
    var callUpdate = function(statement) {
      var valueAccessor = function() {
        return statement;
      };
      ko.bindingHandlers.formattedStatement.update(undefined, valueAccessor);
    };

    var getHtmlValueAccessorValue = function() {
      expect(ko.bindingHandlers.html.update).wasCalled();
      var args = ko.bindingHandlers.html.update.mostRecentCall.args;
      return args[1]();
    };

    beforeEach(function() {
      spyOn(ko.bindingHandlers.html, 'update');
    });

    it('formats Impala keywords correctly', function() {
      callUpdate('select catpants as horsepoo from doggyhat where cat > ' +
        'pants and pants in cat group by stuff order by dog limit 5');
      var formattedStatement = getHtmlValueAccessorValue();
      expect(formattedStatement).toEqual(
        '<span class="keyword">select</span> catpants ' +
        '<span class="keyword">as</span> horsepoo ' +
        '<span class="keyword">from</span> doggyhat ' +
        '<span class="keyword">where</span> cat > pants ' +
        '<span class="keyword">and</span> pants ' +
        '<span class="keyword">in</span> cat ' +
        '<span class="keyword">group by</span> stuff ' +
        '<span class="keyword">order by</span> dog ' +
        '<span class="keyword">limit</span> 5');
    });

    it('formats case insensitively', function() {
      callUpdate('SELECT catpants aS horsepoo fROm doggyhat wHERe cat > pants AND pants > cat');
      var formattedStatement = getHtmlValueAccessorValue();
      expect(formattedStatement).toEqual(
        '<span class="keyword">SELECT</span> catpants ' +
        '<span class="keyword">aS</span> horsepoo ' +
        '<span class="keyword">fROm</span> doggyhat ' +
        '<span class="keyword">wHERe</span> cat > pants ' +
        '<span class="keyword">AND</span> pants > cat');
    });
  });
});