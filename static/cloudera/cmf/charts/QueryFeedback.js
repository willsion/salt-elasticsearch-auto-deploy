// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'underscore'
], function(_) {

  var SCOPE_KEY = 'feedback-scope';

  var createScopeMatcher = function(scopeId) {
    return function() {
      return $(this).data(SCOPE_KEY) === scopeId;
    };
  };

  // The feedback widget positioned above the results in chart search. Is used
  // to display both errors and warnings.
  //
  // Options:
  // - container: CSS selector of the alert.
  // - message: Message to subscribe to.
  return function(options) {
    var $container = $(options.container);
    var $feedbackList = $container.find('.feedback-list');
    var $collapseLink = $container.find('.collapse-link');
    var $expandLink = $container.find('.expand-link').hide();

    this.onCollapseClicked = function() {
      $feedbackList.hide();
      $collapseLink.hide();
      $expandLink.show();
      return false;
    };

    this.onExpandClicked = function() {
      $feedbackList.show();
      $collapseLink.show();
      $expandLink.hide();
      return false;
    };

    // Map of message string to a list of scopeIds. onMessageReceived uses this
    // to dedupe messages in an intelligent way.
    var messageToScopes = {};

    var addMessageWithScopeId = function(scopeId, message) {
      if (!messageToScopes.hasOwnProperty(message)) {
        messageToScopes[message] = [];
      }
      messageToScopes[message].push(scopeId);
    };

    // Remove scopeIds from the associated messages. If the message has no more
    // associated scopeIds, remove the message. Return true if messages
    // were removed.
    var removeMessagesWithScopeId = function(scopeId) {
      var removed = false;
      _.each(messageToScopes, function(scopeIds, message) {
        messageToScopes[message] = _.without(scopeIds, scopeId);
        if (messageToScopes[message].length === 0) {
          removed = true;
          delete messageToScopes[message];
        }
      });
      return removed;
    };

    // Iterate through the messageToScopes map and insert the messages into the
    // dom. The $feedbackList is emptied first.
    var insertMessages = function() {
      $feedbackList.empty();
      _.each(messageToScopes, function(notUsed, message) {
        $('<li/>').text(message).appendTo($feedbackList);
      });
    };

    this.onMessageReceived = function(messages, scopeId) {
      // First, remove any messages with this scope.
      var changed = removeMessagesWithScopeId(scopeId);
      if (messages && messages.length !== 0) {
        // Expand the list when new messages are received.
        this.onExpandClicked();
        // Add the new messages into our internal structure.
        _.each(messages, _.bind(addMessageWithScopeId, null, scopeId));
        changed = true;
      }
      if (changed) {
        insertMessages();
      }
      // Hide ourselves if there are no messages showing.
      if (!$feedbackList.children('li').length) {
        $container.hide();
      } else {
        $container.show();
      }
    };

    // Break this function out like this instead of subscribing it directly so
    // we have a chance to spy on it from tests.
    var self = this;
    var handle = $.subscribe(options.message, function(messages, scopeId) {
      self.onMessageReceived(messages, scopeId);
    });

    this.subscriptionHandles = [handle];

    // Subscribe our collapse and expand links click callbacks.
    $collapseLink.click(this.onCollapseClicked);
    $expandLink.click(this.onExpandClicked);
  };
});
