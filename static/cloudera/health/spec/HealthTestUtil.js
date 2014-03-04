// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define(function() {

  // Define some utility functions that are useful for testing health code.
  var HealthTestUtil = {
    startingTimestamp: new Date().getTime(),

    // Make something that looks like a CM event.
    makeFakeServerEvent: function(i) {
      return {
        content: 'content ' + i,
        timestamp: HealthTestUtil.startingTimestamp - (i * 100000),
        attributes: {
          '__uuid': ['guid-guid-' + i]
        }
      };
    },

    makeFakeHealthEvent: function(i) {
      var event = HealthTestUtil.makeFakeServerEvent(i);
      event.attributes.CATEGORY = ['HEALTH_CHECK'];
      event.attributes.HEALTH_TEST_RESULTS = ['{"content":"The health test result for DATA_NODE_HOST_HEALTH has become concerning: The health of this role\'s host is concerning.  The following health checks are concerning: agent status.","testName":"DATA_NODE_HOST_HEALTH","messageCodes":["HEALTH_TEST_CONCERNING","HEALTH_TEST_HOST_HEALTH_CONCERNING_RESULT","HEALTH_CHECKS_CONCERNING"],"eventCode":"EV_ROLE_HEALTH_CHECK_CONCERNING","severity":"IMPORTANT"}'];
      return event;
    }
  };

  return HealthTestUtil;
});
