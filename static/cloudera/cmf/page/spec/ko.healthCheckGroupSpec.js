// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/cmf/page/ServiceHealthCheckTable',
  'cloudera/cmf/page/ko.healthCheckGroup'
], function(ko, ServiceHealthCheckTable) {

  var HealthCheckGroup = ServiceHealthCheckTable.HealthCheckGroup,
    HealthCheck = ServiceHealthCheckTable.HealthCheck;

  describe('ko.healthCheckGroup', function() {

    var $elem;

    var doInit = function(group) {
      ko.bindingHandlers.healthCheckGroup.init($elem[0], function() { return group; });
    };

    var doUpdate = function(group) {
      ko.bindingHandlers.healthCheckGroup.update($elem[0], function() { return group; });
    };

    beforeEach(function() {
      $elem = $('<div></div>').appendTo($('body'));
    });

    it('is defined on the ko object', function() {
      expect(ko.bindingHandlers.healthCheckGroup).toBeDefined();
    });

    it('defines correct initial values per bad HealthCheckGroup', function() {
      var group = new HealthCheckGroup('bad');
      group.checks([new HealthCheck({})]);
      expect(group.expanded()).toBeTruthy();

      doInit(group);
      expect($elem.hasClass('badHealth')).toBeTruthy();
      expect($elem.hasClass('checksExpanded')).toBeTruthy();
      expect($elem.css('display')).toEqual('block');
    });

    it('defines correct initial values per good HealthCheckGroup', function() {
      var group = new HealthCheckGroup('good');
      group.checks([new HealthCheck({}), new HealthCheck({})]);
      expect(group.expanded()).toBeFalsy();

      doInit(group);
      expect($elem.hasClass('goodHealth')).toBeTruthy();
      expect($elem.hasClass('checksExpanded')).toBeFalsy();
      expect($elem.css('display')).toEqual('block');
    });

    it('defines correct initial values per no checks in a group', function() {
      var group = new HealthCheckGroup('concerning');
      doInit(group);
      expect($elem.css('display')).toEqual('none');
    });

    it('updates the element\'s display when number of checks changes', function() {
      var group = new HealthCheckGroup('bad');
      expect(group.checks().length).toEqual(0);
      doInit(group);
      expect($elem.css('display')).toEqual('none');
      group.checks([new HealthCheck({})]);
      doUpdate(group);
      expect($elem.css('display')).toEqual('block');
    });

    it('updates the element\'s classes when expanded', function() {
      var group = new HealthCheckGroup('bad');
      group.checks([new HealthCheck({}), new HealthCheck({})]);
      doInit(group);
      expect($elem.hasClass('checksExpanded')).toBeTruthy();
      group.toggleExpansion();
      doUpdate(group);
      expect($elem.hasClass('checksExpanded')).toBeFalsy();
    });
  });
});
