// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/events/EventFilter'
], function(EventFilter) {
  describe('EventFilter', function() {
    it('defines something', function() {
      expect(EventFilter).toBeDefined();
    });

    it('has filter properties', function() {
      var ef = new EventFilter('propertyName', 'compareType', 'value');
      expect(ef.propertyName).toEqual('propertyName');
      expect(ef.compareType).toEqual('compareType');
      expect(ef.value).toEqual('value');
    });
  });
});
