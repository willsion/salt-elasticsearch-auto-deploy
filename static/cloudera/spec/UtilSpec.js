// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util"
], function(Util) {

describe("Util Tests", function() {

  it("should return the first chart color.", function() {
    expect(Util.getChartColor(0)).toEqual(Util.getChartColors()[0]);
  });

  it("should return a chart color within the array range.", function() {
    var colors = Util.getChartColors();
    var index = 1000;
    var actual = Util.getChartColor(index);
    var expected = colors[index % colors.length];
    expect(actual).toEqual(expected);
  });

  it("should truncate text", function() {
    var text = "a very very long text";
    var actual = Util.truncate(text, 6);
    expect(actual).toEqual("a very...");
  });

  it("should find the right momentjs's language", function() {
    var locales = ["ko", "ja", "zh_CN", "zh_TW", "en", "en_AU", "en_US", "en_GB", "fr_FR", "fr", "it"];
    var expected = ["kr", "jp", "zh-cn", "zh-tw", "en", "en", "en", "en-gb", "fr", "fr", "it"];
    $.each(locales, function(i, locale) {
      var actual = Util.toMomentLanguage(locale);
      expect(actual).toEqual(expected[i]);
    });
  });

  it("should find the right jquery DatePicker's language", function() {
    var locales = ["ko", "ja", "zh_CN", "zh_TW", "en", "en_AU", "en_US", "en_GB", "fr_FR", "fr", "it", "pt", "pt_BR"];
    var expected = ["ko", "ja", "zh-CN", "zh-TW", "en", "en", "en", "en-GB", "fr", "fr", "it", "pt", "pt-BR"];
    $.each(locales, function(i, locale) {
      var actual = Util.toDatePickerLanguage(locale);
      expect(actual).toEqual(expected[i]);
    });
  });

  it("should set the correct momentjs's locale", function() {
    Util.setLocale("zh_CN");
    // Chinese version.
    expect("zh_CN").toEqual(Util.getLocale());
    expect("YYYY年MMMD日").toEqual(moment.longDateFormat.L);
    // UK version.
    Util.setLocale("en_GB");
    expect("en_GB").toEqual(Util.getLocale());
    expect("DD/MM/YYYY").toEqual(moment.longDateFormat.L);
    // US version.
    Util.setLocale("garbage");
    expect("MM/DD/YYYY").toEqual(moment.longDateFormat.L);
  });

  it("should be in test mode", function() {
    expect(Util.getTestMode()).toEqual(true);
  });

  it("should return true from isHttpsUrl when the url specifies the https scheme and false when it doesn't.", function() {
        expect(Util.isHttpsUrl('asdfasdfa')).toBe(false);
        expect(Util.isHttpsUrl('http://')).toBe(false);
        expect(Util.isHttpsUrl('https:fsdfsdf')).toBe(false);
        expect(Util.isHttpsUrl('https://test')).toBe(true);
  });

  function testFilterJsonResponseError(response, expectedMessage, expectedData) {
    var result = Util.filterJsonResponseError(response);
    expect(result.message).toEqual(expectedMessage);
    expect(result.data).toEqual(expectedData);
  }

  it("should handle JSON argument in filterJsonResponseError.", function() {
    var response = {
      message: "OK",
      data: "foo"
    };
    testFilterJsonResponseError(response, "OK", "foo");
  });

  it("should handle string argument in filterJsonResponseError.", function() {
    var response = JSON.stringify({
      message: "OK",
      data: "foo"
    });
    testFilterJsonResponseError(response, "OK", "foo");
  });

  it("should handle null argument in filterJsonResponseError.", function() {
    var response = null;
    testFilterJsonResponseError(response, undefined, undefined);
  });

  it("should handle undefined argument in filterJsonResponseError.", function() {
    var response;
    testFilterJsonResponseError(response, undefined, undefined);
  });

  it("should handle badly formatted JSON String in filterJsonResponseError.", function() {
    var response = "badly formatted JSON";
    testFilterJsonResponseError(response, undefined, undefined);
  });

  it("should return a valid ISO 8601 string when dateToIsoString is invoked.", function() {
    var iso = '2012-10-19T20:49:35.393Z',
      date = new Date(iso);
    expect(Util.dateToIsoString(date)).toEqual(iso);
  });

  it("should test bindContext", function() {
    var input = "$FOO $BAR $FOO";
    var context = {
      "$FOO": "foo",
      "$BAR": "bar"
    };
    var output = Util.bindContext(input, context);
    expect(output).toEqual('"foo" "bar" "foo"');
  });

  it('should bucket a list', function() {
    expect(Util.bucket([], 2).length).toEqual(0);
    var result = Util.bucket([1,2,3,4], 2);
    expect(result.length).toEqual(2);
    expect(result[0].length).toEqual(2);
    expect(result[0][0]).toEqual(1);
    expect(result[0][1]).toEqual(2);
    expect(result[1].length).toEqual(2);
    expect(result[1][0]).toEqual(3);
    expect(result[1][1]).toEqual(4);

    // Test for uneven list.
    result = Util.bucket([1,2,3], 2);
    expect(result.length).toEqual(2);
  });

  it('should have a low-level clear method', function() {
    var hasChildNodesResults = [true, true, true];
    var length = hasChildNodesResults.length;
    var mockElement = {
      hasChildNodes: jasmine.createSpy('hasChildNodes').andCallFake(function() {
        return hasChildNodesResults.shift();
      }),
      removeChild: jasmine.createSpy('removeChild'),
      firstChild: 'firstChild'
    };
    Util.clear(mockElement);
    expect(mockElement.hasChildNodes).wasCalled();
    expect(mockElement.removeChild).wasCalled();
    expect(mockElement.hasChildNodes.callCount).toEqual(length + 1);
    expect(mockElement.removeChild.callCount).toEqual(length);
  });

  it('should test removeFilteredQuery', function() {
    expect(Util.removeFilteredQuery('Hello World', 'Hello World')).toEqual("");
    expect(Util.removeFilteredQuery('Hello World', 'World Hello')).toEqual("");
    expect(Util.removeFilteredQuery('Hello World', 'World')).toEqual("");
    expect(Util.removeFilteredQuery('Hello foo', 'Hello bar')).toEqual("bar");
    expect(Util.removeFilteredQuery(null, null)).toEqual("");
    expect(Util.removeFilteredQuery(undefined, undefined)).toEqual("");
  });
});
});
