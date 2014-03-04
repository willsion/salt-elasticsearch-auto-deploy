// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/search/FilterModel'
], function(FilterModel) {

  describe('FilterModel', function() {

    var fakeFilterViewModel, filterModel;

    beforeEach(function() {
      fakeFilterViewModel = {
        filters: jasmine.createSpy()
      };
      filterModel = new FilterModel(fakeFilterViewModel);
    });
    
    it('defines some attributes', function() {
      expect(filterModel.filter).toBeDefined();
      expect(filterModel.compareType).toBeDefined();
      expect(filterModel.value).toBeDefined();
      expect(filterModel.values).toBeDefined();
      // Computed values.
      expect(filterModel.filterName).toBeDefined();
      expect(filterModel.compareTypeName).toBeDefined();
    });

    it('blanks the values property when the filter property changes', function() {
      filterModel.filter('filter1');
      filterModel.compareType('==');
      filterModel.values(['catpants']);
      expect(filterModel.values().length).toEqual(1);
      filterModel.filter('filter2');
      expect(filterModel.values().length).toEqual(0);
    });

    it('is complete when all values are satisfied for single value case', function() {
      filterModel.filter('filter');
      expect(filterModel.complete()).toBeFalsy();
      filterModel.compareType('==');
      expect(filterModel.complete()).toBeFalsy();
      filterModel.value('value');
      expect(filterModel.complete()).toBeTruthy();
    });

    it('is complete when all values are satisfied for multi-value case', function() {
      filterModel.filter('filter');
      expect(filterModel.complete()).toBeFalsy();
      filterModel.compareType('==');
      expect(filterModel.complete()).toBeFalsy();
      filterModel.values(['value1', 'value2']);
      expect(filterModel.complete()).toBeTruthy();
    });

    it('knows how to compare against others of its type in single value case', function() {
      var otherFilterModel = new FilterModel();
      otherFilterModel.filter('filter');
      otherFilterModel.compareType('==');
      otherFilterModel.value('value');
      filterModel.filter('filter');
      filterModel.compareType('==');
      filterModel.value('value');

      expect(filterModel.compareTo(otherFilterModel)).toBeTruthy();
      otherFilterModel.filter('bad');
      expect(filterModel.compareTo(otherFilterModel)).toBeFalsy();
      otherFilterModel.filter(filterModel.filter());
      otherFilterModel.compareType('bad');
      expect(filterModel.compareTo(otherFilterModel)).toBeFalsy();
      otherFilterModel.compareType(filterModel.compareType());
      otherFilterModel.value('bad');
      expect(filterModel.compareTo(otherFilterModel)).toBeFalsy();
      otherFilterModel.value(filterModel.value());
      expect(filterModel.compareTo(otherFilterModel)).toBeTruthy();
    });

    it('knows how to compare against others of its type in multi-value case with different order', function() {
      var otherFilterModel = new FilterModel();
      otherFilterModel.filter('filter');
      otherFilterModel.compareType('==');
      otherFilterModel.values(['value1', 'value2']);
      filterModel.filter('filter');
      filterModel.compareType('==');
      // Note that the above was ['value1', 'value2'].
      filterModel.values(['value2', 'value1']);
      expect(filterModel.compareTo(otherFilterModel)).toBeTruthy();
    });

    it('can compare to falsy correctly', function() {
      expect(filterModel.compareTo(null)).toBeFalsy();
      expect(filterModel.compareTo(undefined)).toBeFalsy();
    });

    it('sets filter properly by name', function() {
      var fakeFilter1 = { propertyName: 'catpants' };
      var fakeFilter2 = { propertyName: 'doggiehat' };
      fakeFilterViewModel.filters.andReturn([fakeFilter1, fakeFilter2]);
      filterModel.filterName('doggiehat');
      expect(filterModel.filter()).toEqual(fakeFilter2);
      filterModel.filterName('horsepoo');
      expect(filterModel.filter()).toEqual(null);
    });

    it('tracks filter name as a property', function() {
      filterModel.filter({ propertyName: 'catpants' });
      expect(filterModel.filterName()).toEqual('catpants');
      filterModel.filter({ propertyName: 'doggiehat' });
      expect(filterModel.filterName()).toEqual('doggiehat');
    });

    it('is careful about setting compareType by name when filter is null', function() {
      filterModel.filter(null);
      // If this line doesn't blow up, this test is successful.
      filterModel.compareTypeName('catpants');
      expect(filterModel.compareTypeName()).toBeFalsy();
    });

    it('sets compareType by name', function() {
      var fakeCompareType1 = { name: 'catpants' };
      var fakeCompareType2 = { name: 'doggiehat' };
      filterModel.filter({
        compareTypes: [fakeCompareType1, fakeCompareType2]
      });
      filterModel.compareTypeName('doggiehat');
      expect(filterModel.compareType()).toEqual(fakeCompareType2);
      filterModel.compareTypeName('horsepoo');
      expect(filterModel.compareType()).toEqual(null);
    });

    it('provides values as comma-delimited string', function() {
      expect(filterModel.value()).toEqual('');
      filterModel.values(['catpants', 'doggiehat']);
      expect(filterModel.value()).toEqual('catpants,doggiehat');
    });

    it('allows values to be set as comma-delimited string', function() {
      expect(filterModel.values().length).toEqual(0);
      filterModel.value('catpants,doggiehat');
      expect(filterModel.values().length).toEqual(2);
      var values = filterModel.values();
      expect(values[0]).toEqual('catpants');
      expect(values[1]).toEqual('doggiehat');
    });
  });
});