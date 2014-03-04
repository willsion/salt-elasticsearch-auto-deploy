// Copyright (c) 2011 Cloudera, Inc. All rights reserved.
define(['cloudera/common/I18n',
        'cloudera/Analytics',
        'cloudera/Util',
        'knockout',
        'cloudera/common/repeat',
        'cloudera/form/DisableAfterClickOnce'], function(I18n, analytics, Util, ko) {
    var linkBaseUri = '/api/v3/cm/peers',
        defaultState = {
            state : 'state-testing',
            message : I18n.t('ui.testing')
        },
    ViewModel = function($dialog) {
        var self = this;

        /**
         * Boolean variable to identify that the list of peers has been set.
         *
         * This allows the UI to differentiate between no peers stored and delayed load of the results from the server.
         */
        self.contentLoaded = ko.observable(false);

        /**
         * The list of peers to be displayed.
         */
        self.peers = ko.observableArray();

        self.activePeer = {
            /**
             * The display name of the peer.
             */
            name: ko.observable(),

            /**
             * The URL of the peer to which a connection should be established.
             */
            url: ko.observable(),

            /**
             * The username for the remote CM.
             */
            username: ko.observable(),

            /**
             * The password for the remote CM.
             */
            password: ko.observable(),

            /**
             * A boolean value indicating that the URL specified isn't an SSL URL.
             */
            noSsl: ko.observable(false),

            /**
             * A boolean value indicating whether or not the dialog should be displayed in update mode.
             */
            update: ko.observable(false),

            /**
             * An alter message to be displayed to the user.
             */
            alert: ko.observable(),

            /**
             * Submits the form when the enter key is pressed.
             */
            keypressSubmit: function(data, event) {
                if ((event.which && event.which === 13)
                        || (event.keyCode && event.keyCode === 13)) {
                    $(this).blur();
                    $dialog.find('#persistPeer').click();
                    return false;
                }
                return true;
            },

            /**
             * Validates the URL field on the dialog and display a warning if the URL isn't HTTPS.
             */
            validateUrl: function(data, event) {
                // If form validation is unsupported or the element
                // is valid.
                if (!event.target.validity || event.target.validity.valid) {
                    var val = self.activePeer.url();
                    self.activePeer.noSsl(!Util.isHttpsUrl(val));
                }
            },

          /**
           * Initiates a request to add the peer specified in the dialog.
           */
          persistPeer: function() {
            var uri, method;
            if (self.activePeer.update()) {
              uri = linkBaseUri + '/'
                + encodeURIComponent($dialog.data('update'));
              method = 'PUT';
            } else {
              uri = linkBaseUri;
              method = 'POST';
              analytics.trackEvent('Peers', 'Created');
            }
            $.ajax(uri, {
              data: JSON.stringify({
                name : self.activePeer.name(),
                url : self.activePeer.url(),
                username : self.activePeer.username(),
                password : self.activePeer.password()
              }),
              type: method,
              dataType : 'json',
              contentType : 'application/json',
              success : function() {
                self.loadPeers();
                $dialog.modal('hide');
              },
              error: function(xhr, statusCode,
                  statusMessage) {
                var alertMessage, errorMessage;
                if (xhr.status === 403) {
                  alertMessage = I18n.t('ui.peerAuthFailed');
                } else {
                  try {
                    errorMessage = $.parseJSON(xhr.responseText).message;
                  } catch (x) {
                    // Probably malformed JSON, just ignore.
                  }
                  alertMessage = statusMessage +
                      (errorMessage ? (': ' + errorMessage) : '');
                }
                self.activePeer.alert(alertMessage);
                $dialog.find('#persistPeer').removeClass('disabled');
              }
            });
          },

          /**
           * Resets the active peer to it's initial state.
           */
          reset: function() {
            self.activePeer.name('');
            self.activePeer.url('');
            self.activePeer.username('');
            self.activePeer.password('');
            self.activePeer.alert(undefined);
            self.activePeer.noSsl(false);
            self.activePeer.update(false);
            $dialog.find('#persistPeer').removeClass('disabled');
            $dialog.removeClass('update').removeData('update');
          }
        };

        /**
         * Deletes the entry for the given peer.
         */
        self.deletePeer = function() {
            $.ajax(linkBaseUri + '/' + encodeURIComponent(this.name), {
                type : 'DELETE',
                dataType : 'json',
                success : function() {
                    self.loadPeers();
                }
            });
        };

        /**
         * Displays the peer editing dialog in an update state for the give peer.
         */
        self.updatePeer = function() {
            $dialog.addClass('update').data('update', this.name).modal(
                    'show');
            self.activePeer.update(true);
            self.activePeer.name(this.name);
            self.activePeer.url(this.url);
            $('#peerUsername').focus();
        };

        /**
         * Initiates a connection test for the given peer.
         */
        self.testPeer = function() {
            retrievePeerStatus(this);
        };

        /**
         * Requests the list of peers and applies the knockout bindings on the first response.
         */
        self.loadPeers = function() {
            $.getJSON(linkBaseUri, function(data) {
                var peers = data.items, i = 0, len = peers.length;
                while (i < len) {
                    retrievePeerStatus(peers[i]);
                    i += 1;
                }
                self.peers(peers);
                self.contentLoaded(true);
            });
        };
    },
  Peers = function(dialog, form, template) {
    var $dialog = $(dialog),
      self = this;

    self.viewModel = new ViewModel($dialog);
    self.viewModel.loadPeers();
    ko.applyBindings(self.viewModel.activePeer, $dialog.find('.modal-body')[0]);
    $dialog.on('hidden', self.viewModel.activePeer.reset);
    $dialog.on('shown', function () {
      if(!$dialog.data('update')) {
        $('input:text:visible:first', this).focus();
      }
    });
    // This needs to be called before attaching the #persistPeer click handler.
    $('[data-disable-after-click-once=true]').DisableAfterClickOnce();

    $dialog.find('#persistPeer').click(function(event) {
      if ($(event.currentTarget).hasClass('disabled')) {
        return;
      }

      if (form.checkValidity && !form.checkValidity()) {
        _.defer(function() {
          $dialog.find('#persistPeer').removeClass('disabled');
        });
        return;
      }
      self.viewModel.activePeer.persistPeer();
    });
    ko.applyBindings(self.viewModel, template);

  };

    /**
     * Monitors the status of a peer status command and applies the result through setPeerStatus when complete.
     * @param peer The peer to which the status command applies.
     */
    function monitorPeerTestStatus(peer) {
        $.getJSON('/api/v3/commands/' + peer.commandId, function(data) {
            if (data.active) {
                setTimeout(function() {
                    monitorPeerTestStatus(peer);
                }, 1000);
            } else {
                setPeerStatus(peer, data);
            }
        });
    }

    /**
     * Sets the status of the peer based on the response of the ../commands/test request.
     * @param peer The peer to which the status applies.
     * @param data The status data to apply.
     */
    function setPeerStatus(peer, data) {
        var state, message;
        if (data.success) {
            state = 'state-connected';
            message = I18n.t('ui.status.connected');
        } else {
            state = 'state-error';
            message = data.resultMessage;
        }
        peer.status({
            state : state,
            message : message
        });
    }

    /**
     * Retrieves to connection status of the given peer.
     * @param peer The peer for which the status should be retrieved.
     */
    function retrievePeerStatus(peer) {
        if (!peer.status) {
            peer.status = ko.observable(defaultState);
        } else {
            peer.status(defaultState);
        }

        $.ajax(linkBaseUri + '/' + encodeURIComponent(peer.name)
                + '/commands/test', {
            type : 'POST',
            dataType : 'json',
            success : function(data) {
                if (!data.active) {
                    setPeerStatus(peer, data);
                } else {
                    peer.commandId = data.id;
                    monitorPeerTestStatus(peer);
                }
            },
            error : function() {
                peer.status({
                    state : 'state-unknown',
                    message : I18n.t('ui.status.unknown')
                });
            }
        });
    }

    return Peers;
});
