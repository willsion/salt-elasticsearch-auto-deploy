// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/Humanize',
  'knockout',
  'cloudera/knockout/ko.formattedDuration'
], function(Humanize, ko) {
  describe('ko.formattedDuration', function() {
    it('uses Humanize to format a duration', function() {
      spyOn(Humanize, 'humanizeMilliseconds').andCallThrough();
      ko.bindingHandlers.text.update = jasmine.createSpy('text.update').andReturn('sentinel');
      var result = ko.bindingHandlers.formattedDuration.update(null, function() { return 3204; });
      // We should be returning the text binding's update result.
      expect(result).toEqual('sentinel');
      var valueAccessor = ko.bindingHandlers.text.update.mostRecentCall.args[1];
      result = valueAccessor();
      expect(result).toEqual('3.20s');
      expect(Humanize.humanizeMilliseconds).wasCalledWith(3204);
    });

    it('returns blank when given null', function() {
      spyOn(Humanize, 'humanizeMilliseconds');
      ko.bindingHandlers.text.update = jasmine.createSpy('text.update').andReturn('sentinel');
      var result = ko.bindingHandlers.formattedDuration.update(null, function() { return null; });
      // We should be returning the text binding's update result.
      expect(result).toEqual('sentinel');
      var valueAccessor = ko.bindingHandlers.text.update.mostRecentCall.args[1];
      result = valueAccessor();
      expect(result).toEqual('');
    });
  });
});