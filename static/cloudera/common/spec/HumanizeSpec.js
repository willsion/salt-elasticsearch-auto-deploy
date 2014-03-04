// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/Humanize",
  "cloudera/common/TimeUtil"
], function(Util, Humanize, TimeUtil) {

describe("Humanize", function() {

  it("should test humanizeBytes.", function() {
    expect(Humanize.humanizeBytes(13)).toEqual("13 B");
    expect(Humanize.humanizeBytes(1024)).toEqual("1.0 KiB");
    expect(Humanize.humanizeBytes(1024 + 512)).toEqual("1.5 KiB");
    expect(Humanize.humanizeBytes(5 * 1024 * 1024 * 1024 * 1024 * 1024))
        .toEqual("5.0 PiB");
    expect(Humanize.humanizeBytes(2000 * 1024 * 1024 * 1024 * 1024 * 1024))
        .toEqual("2.0 EiB");
    expect(
        Humanize.humanizeBytes(-1 * 2000 * 1024 * 1024 * 1024 * 1024
            * 1024)).toEqual("-2.0 EiB");
  });

  it("should test humanizeSeconds.", function() {
    expect(Humanize.humanizeSeconds(13)).toEqual("13.00s");
    expect(Humanize.humanizeSeconds(120)).toEqual("2.0m");
    expect(Humanize.humanizeSeconds(60 * 60 * 2)).toEqual("2.0h");
    expect(Humanize.humanizeSeconds(60 * 60 * 24 * 2)).toEqual("2.0d");
  });

  it("should test humanizeTimeShortAndMS", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeTimeShortAndMS(d)).toEqual("4:01:40.101 PM");
  });

  it("should test humanizeMilliSeconds.", function() {
    expect(Humanize.humanizeMilliseconds(13)).toEqual("13ms");
    expect(Humanize.humanizeMilliseconds(279)).toEqual("279ms");
    expect(Humanize.humanizeMilliseconds(989)).toEqual("989ms");
    expect(Humanize.humanizeMilliseconds(1234)).toEqual("1.23s");
    expect(Humanize.humanizeMilliseconds(79.123456153432)).toEqual("79ms");
    expect(Humanize.humanizeMilliseconds(1500)).toEqual("1.50s");
    expect(Humanize.humanizeMilliseconds(55000)).toEqual("55.00s");
    expect(Humanize.humanizeMilliseconds(90000)).toEqual("90.00s");
    expect(Humanize.humanizeMilliseconds(120000)).toEqual("2.0m");
    expect(Humanize.humanizeMilliseconds(3600000)).toEqual("60.0m");
    expect(Humanize.humanizeMilliseconds(7200000)).toEqual("2.0h");
  });

  it("should humanize nanoseconds correctly", function() {
    expect(Humanize.humanizeNanoseconds(50)).toEqual("50ns");
    expect(Humanize.humanizeNanoseconds(123456)).toEqual("123.46\u00B5s");
    expect(Humanize.humanizeNanoseconds(850000)).toEqual("850.00\u00B5s");
    expect(Humanize.humanizeNanoseconds(1000000)).toEqual("1ms");
    expect(Humanize.humanizeNanoseconds(1900000)).toEqual("2ms");
  });

  it("should test humanizeDateTimeMedium", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeDateTimeMedium(d)).toEqual("December 31 1969 4:01 PM");
  });

  it("should test humanizeDateLong", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeDateLong(d)).toEqual("December 31 1969");
  });

  it("should test humanizeDateTimeLong", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeDateTimeLong(d)).toEqual("Wednesday, December 31 1969 4:01 PM");
  });

  it("should test humanizeDateShort.", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeDateShort(d)).toEqual("12/31/1969");
  });

  it("should test humanizeTimeShort", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeTimeShort(d)).toEqual("4:01 PM");
  });

  it("should test humanizeTimeShortAndMS", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeTimeShortAndMS(d)).toEqual("4:01:40.101 PM");
  });

  it("should test humanizeTimeMedium", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeTimeMedium(d)).toEqual("4:01:40 PM");
  });

  it("should test humanizeTimeLong", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeTimeLong(d)).toEqual("16:01:40.101 -0800");
  });

  it("should test humanizeDateNoYear", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeDateNoYear(d)).toEqual("Dec 31");
  });

  it("should test humanizeDateJustMonth", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeDateJustMonth(d)).toEqual("Dec");
  });

  it("should test humanizeDateJustYear", function() {
    var d = new Date(100101);
    expect(Humanize.humanizeDateJustYear(d)).toEqual("1969");
  });

  describe('adaptable', function() {
    var today;
    var oldLanguage;

    beforeEach(function() {
      oldLanguage = moment.lang();
      today = new Date(2012, 10, 14, 11, 45);
      spyOn(TimeUtil, 'getServerNow').andReturn(today);
    });

    afterEach(function() {
      moment.lang(oldLanguage);
    });

    it('should pad minutes with two digits', function() {
      var earlier = new Date(2012, 10, 14, 11, 0);
      var humanized = Humanize.humanizeDateTimeAdaptable(earlier);
      expect(humanized).toEqual('11:00 AM');
    });

    it('should show earlier today correctly', function() {
      var earlier = new Date(2012, 10, 14, 11, 30);
      var humanized = Humanize.humanizeDateTimeAdaptable(earlier);
      expect(humanized).toEqual('11:30 AM');
    });

    it('should show yesterday correctly', function() {
      var yesterday = new Date(2012, 10, 13, 11, 0);
      var humanized = Humanize.humanizeDateTimeAdaptable(yesterday);
      expect(humanized).toEqual('Nov 13 11:00 AM');
    });
  });

  describe('adaptable with seconds', function() {
    var today;
    var oldLanguage;

    beforeEach(function() {
      oldLanguage = moment.lang();
      today = new Date(2012, 10, 14, 11, 45);
      spyOn(TimeUtil, 'getServerNow').andReturn(today);
    });

    afterEach(function() {
      moment.lang(oldLanguage);
    });

    it('should pad minutes with two digits', function() {
      var earlier = new Date(2012, 10, 14, 11, 0, 32);
      var humanized = Humanize.humanizeDateTimeAdaptable(earlier, true);
      expect(humanized).toEqual('11:00:32 AM');
    });

    it('should show earlier today correctly', function() {
      var earlier = new Date(2012, 10, 14, 11, 30, 14);
      var humanized = Humanize.humanizeDateTimeAdaptable(earlier, true);
      expect(humanized).toEqual('11:30:14 AM');
    });

    it('should show yesterday correctly', function() {
      var yesterday = new Date(2012, 10, 13, 11, 0, 53);
      var humanized = Humanize.humanizeDateTimeAdaptable(yesterday, true);
      expect(humanized).toEqual('Nov 13 11:00:53 AM');
    });
  });
});
});
