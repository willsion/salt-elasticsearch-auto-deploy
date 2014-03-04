// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/ConfigDiff',
  'knockout'
], function(ConfigDiff, ko) {

  describe("ConfigDiff Tests", function() {

    it("should update selected tab", function() {
      var viewModel = new ConfigDiff();
      expect(viewModel.selectedTab()).toBe("popupConfigPane");
      viewModel.updateSelectedTab("foo-tab", /*data=*/null, /*event=*/null);
      expect(viewModel.selectedTab()).toBe("foo-tab");
    });
  
  });
});
