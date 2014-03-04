// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
      'cloudera/cmf/charts/QueryFeedback',
      'cloudera/Util'
], function(QueryFeedback, Util) {

  var isVisible = function($thing) {
    // Can't use is(':visible') here because my elements take up no space.
    // jQuery uses taking up space as a prereq for visibility.
    return $thing.css('display') !== 'none';
  };

  describe('QueryFeedback', function() {
    var $container, feedback;

    var getMessages = function() {
      var messages = [];
      $container.find('li').each(function() {
        messages.push($(this).text());
      });
      return messages;
    };

    beforeEach(function() {
      // Construct a feedback container and append it to the body.
      $container = $('<div id="feedbackTest"><a class="collapse-link"></a><a class="expand-link"></a><ul class="feedback-list"></ul></div>').appendTo('body');
      feedback = new QueryFeedback({
        'container': '#feedbackTest',
        'message': 'feedbackTestMessages'
      });
    });

    afterEach(function() {
      $container.remove();
      Util.unsubscribe(feedback);
    });

    it('collapses and expands feedback list when links are clicked', function() {
      var $feedbackList = $container.find('.feedback-list');
      var $collapseLink = $container.find('.collapse-link');
      var $expandLink = $container.find('.expand-link');

      $collapseLink.click();
      expect(isVisible($feedbackList)).toBeFalsy();
      expect(isVisible($collapseLink)).toBeFalsy();
      expect(isVisible($expandLink)).toBeTruthy();

      $expandLink.click();
      expect(isVisible($feedbackList)).toBeTruthy();
      expect(isVisible($collapseLink)).toBeTruthy();
      expect(isVisible($expandLink)).toBeFalsy();
    });

    it('can show messages from multiple subscribed sources', function() {
      var messages1 = ['catpants', 'doggyhat'];
      var messages2 = ['horsepoo'];
      feedback.onMessageReceived(messages1, 'messages1');
      feedback.onMessageReceived(messages2, 'messages2');

      var messages = getMessages();
      expect(messages.length).toEqual(3);
      expect(messages[0]).toEqual(messages1[0]);
      expect(messages[1]).toEqual(messages1[1]);
      expect(messages[2]).toEqual(messages2[0]);
    });

    it('can clear messages when existing sources are updated', function() {
      var messages1 = ['catpants', 'doggyhat'];
      var messages2 = ['horsepoo'];
      feedback.onMessageReceived(messages1, 'messages1');
      feedback.onMessageReceived(messages2, 'messages2');
      var messages = getMessages();
      expect(messages.length).toEqual(3);
      
      feedback.onMessageReceived([], 'messages1');
      messages = getMessages();
      expect(messages.length).toEqual(1);
      expect(messages[0]).toEqual(messages2[0]);
    });

    it('expands automatically when adding feedback', function() {
      spyOn(feedback, 'onExpandClicked');
      feedback.onMessageReceived(['catpants'], 'scope1');
      expect(feedback.onExpandClicked).wasCalled();
      
      feedback.onExpandClicked.reset();
      feedback.onMessageReceived([], 'scope1');
      expect(feedback.onExpandClicked).wasNotCalled();
    });

    it('hides and shows itself if based on having feedback to display', function() {
      feedback.onMessageReceived(['catpants'], 'scope1');
      expect(isVisible($container)).toBeTruthy();

      feedback.onMessageReceived([], 'scope1');
      expect(isVisible($container)).toBeFalsy();

      feedback.onMessageReceived(['doggyhat'], 'scope2');
      expect(isVisible($container)).toBeTruthy();
    });

    it('dedupes messages from separate scopes', function() {
      feedback.onMessageReceived(['catpants'], 'scope1');
      feedback.onMessageReceived(['catpants'], 'scope2');
      var messages = getMessages();
      expect(messages.length).toEqual(1);

      // Now remove one of the scopes.
      feedback.onMessageReceived([], 'scope1');
      messages = getMessages();
      expect(messages.length).toEqual(1);

      // Now remove the other.
      feedback.onMessageReceived([], 'scope2');
      messages = getMessages();
      expect(messages.length).toEqual(0);
    });

    it('properly escapes messages when displaying', function() {
      feedback.onMessageReceived(['<EOF> reached'], 'scope1');
      expect(isVisible($container)).toBeTruthy();
      expect($('.feedback-list').find('li').html()).toEqual('&lt;EOF&gt; reached');
    });
  });
});
