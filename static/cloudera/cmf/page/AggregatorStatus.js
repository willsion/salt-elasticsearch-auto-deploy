// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define(['knockout', 
    'komapping',
    'underscore', 
    'cloudera/common/repeat'], function(ko, komapping, _) {
  var ViewModel = function() {
    var self = this;
    self.statuses = ko.observableArray();
  },
  /**
   * @param {options} An object containing display options for the aggregated UI.
   *   dataSource: The URL of the aggregated UI data service.
   *   container: A selector or element that contains the aggregated UI templates.
   */
  AggregatorStatus = function(options) {
    var self = this,
      $container = $(options.container);
    
    this.viewModel = new ViewModel();
    
    ko.applyBindings(this.viewModel, $container[0]);
    
    $.getJSON(options.dataSource, function(data){
      var statuses = [];
      _.each(data, function(value) {
        statuses.push(komapping.fromJS(value));
      });
      self.viewModel.statuses(statuses);
      
      //Update services.
    }).repeat(15 * 1000).start();
  };
  
  return AggregatorStatus;
});
