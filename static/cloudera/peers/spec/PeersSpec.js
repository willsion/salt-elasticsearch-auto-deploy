// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
    'cloudera/peers/Peers',
    'cloudera/common/I18n',
    'knockout'], function(Peers, I18n, ko) {
    describe("Peers Test", function() {
         jasmine.Ajax.useMock();
         var $ui = $('<div id="addPeerDialog" class="modal hide" data-backdrop="static" data-keyboard="false">'
                 + '<div class="model-body"></div>'
                 + '</div>'
                 + '<div id="peering"></div>').appendTo("body"),
             peer;

         $ui.find('#addPeerDialog').modal();

         peer = new Peers({
             dialog: "#addPeerDialog",
             template: "#peering"
         });

         function testPeerRequest(mockPeer, response, status) {
             var request;
             jasmine.Ajax.useMock();
             peer.viewModel.testPeer.call(mockPeer);
             expect(mockPeer.status).toBeDefined();
             request = mostRecentAjaxRequest();
             expect(request.url).toEqual('/api/v3/cm/peers/' + mockPeer.name + '/commands/test');
             request.response({
                 status: status || 200,
                 responseText: response
               });
             clearAjaxRequests();
             return request;
         }

        it("should clear the form when reset is called.", function() {
            peer.viewModel.activePeer.name('testing');
            peer.viewModel.activePeer.url('testing');
            peer.viewModel.activePeer.username('testing');
            peer.viewModel.activePeer.password('testing');
            peer.viewModel.activePeer.alert('testing');
            peer.viewModel.activePeer.noSsl(true);
            peer.viewModel.activePeer.update(true);
            $('#addPeerDialog').addClass('disabled');

            peer.viewModel.activePeer.reset();

            expect(peer.viewModel.activePeer.name()).toEqual('');
            expect(peer.viewModel.activePeer.url()).toEqual('');
            expect(peer.viewModel.activePeer.username()).toEqual('');
            expect(peer.viewModel.activePeer.password()).toEqual('');
            expect(peer.viewModel.activePeer.alert()).toEqual(undefined);
            expect(peer.viewModel.activePeer.noSsl()).toBe(false);
            expect(peer.viewModel.activePeer.update()).toBe(false);
            expect($('#addPeerDialog').hasClass('disabled')).toBeFalsy();
        });

        it("should submit the form when enter is pressed.", function() {
            var which13Event = {which: 13},
                which34Event = {which: 34},
                keyCode13Event = {keyCode: 13},
                keyCode86Event = {keyCode: 86};
            spyOn($.fn, 'click').andCallThrough();
            expect(peer.viewModel.activePeer.keypressSubmit(null, which13Event)).toBe(false);
            expect($.fn.click).wasCalled();
            $.fn.click.reset();
            expect(peer.viewModel.activePeer.keypressSubmit(null, which34Event)).toBe(true);
            expect($.fn.click).wasNotCalled();
            $.fn.click.reset();
            expect(peer.viewModel.activePeer.keypressSubmit(null, keyCode13Event)).toBe(false);
            expect($.fn.click).wasCalled();
            $.fn.click.reset();
            expect(peer.viewModel.activePeer.keypressSubmit(null, keyCode86Event)).toBe(true);
            expect($.fn.click).wasNotCalled();
            $.fn.click.reset();
        });

        it("should set noSsl to true if URL isn't valid ssl url.", function() {
            var testInput = $('<input/>')[0], testEvent = $.Event('change');
            testEvent.target = testInput;
            peer.viewModel.activePeer.url('asdfasdf');
            peer.viewModel.activePeer.validateUrl.call(undefined, undefined, testEvent);
            expect(peer.viewModel.activePeer.noSsl()).toBe(true);
            peer.viewModel.activePeer.url('http://');
            peer.viewModel.activePeer.validateUrl.call(undefined, undefined, testEvent);
            expect(peer.viewModel.activePeer.noSsl()).toBe(true);
            peer.viewModel.activePeer.reset();
        });

        it("should set noSsl to false if URL is valid ssl url.", function() {
            var testInput = $('<input/>')[0], testEvent = $.Event('change');
            testEvent.target = testInput;
            peer.viewModel.activePeer.url('https://test');
            peer.viewModel.activePeer.validateUrl.call(undefined, undefined, testEvent);
            expect(peer.viewModel.activePeer.noSsl()).toBe(false);
            peer.viewModel.activePeer.reset();
        });

        it("should display the dialog in update mode if update peer is called.", function() {
            var mockPeer = {name: 'peerName', url: 'peerUrl'};
            spyOn($.fn, 'addClass').andCallThrough();
            spyOn($.fn, 'data').andCallThrough();
            spyOn($.fn, 'modal');
            spyOn($.fn, 'focus');
            peer.viewModel.updatePeer.call(mockPeer);
            expect($.fn.addClass).toHaveBeenCalledWith('update');
            expect($.fn.data).toHaveBeenCalledWith('update', mockPeer.name);
            expect($.fn.modal).toHaveBeenCalledWith('show');
            expect(peer.viewModel.activePeer.update()).toBe(true);
            expect(peer.viewModel.activePeer.name()).toEqual(mockPeer.name);
            expect(peer.viewModel.activePeer.url()).toEqual(mockPeer.url);
            expect($.fn.modal).wasCalled();
            peer.viewModel.activePeer.reset();
        });

        it("should POST the peer information to the server when persistPeer is called.", function() {
            jasmine.Ajax.useMock();
            peer.viewModel.activePeer.name('peerName');
            peer.viewModel.activePeer.url('peerUrl');
            peer.viewModel.activePeer.username('peerUsername');
            peer.viewModel.activePeer.password('peerPassword');
            peer.viewModel.activePeer.persistPeer();
            var request = mostRecentAjaxRequest(),
                params = JSON.parse(request.params);
            expect(request.method).toEqual('POST');
            expect(params.name).toEqual(peer.viewModel.activePeer.name());
            expect(params.url).toEqual(peer.viewModel.activePeer.url());
            expect(params.username).toEqual(peer.viewModel.activePeer.username());
            expect(params.password).toEqual(peer.viewModel.activePeer.password());
            request.response({status: 200, responseText: '{}'});
            request = mostRecentAjaxRequest();
            expect(request.url).toEqual('/api/v3/cm/peers');
            expect(request.method).toEqual('GET');
            peer.viewModel.activePeer.reset();
            clearAjaxRequests();
        });

        it("should set alert if persistPeer request fails.", function() {
            jasmine.Ajax.useMock();
            peer.viewModel.activePeer.persistPeer();
            var request = mostRecentAjaxRequest(),
                response = {status: 500, responseText: '{ "message" : "Blah Blah" }'};
            request.statusText = 'Status';
            request.response(response);
            expect(peer.viewModel.activePeer.alert())
                .toEqual(request.statusText + ': Blah Blah');
            peer.viewModel.activePeer.reset();
            clearAjaxRequests();
        });

        it("should send a DELETE request to the server when delete peer is called.", function() {
            jasmine.Ajax.useMock();
            var mockPeer = {name: 'testing out a funky @2344 % name'},
            request;

            peer.viewModel.deletePeer.call(mockPeer);
            request = mostRecentAjaxRequest();
            expect(request.url).toEqual('/api/v3/cm/peers/' + encodeURIComponent(mockPeer.name));
            expect(request.method).toEqual('DELETE');

            request.response({status: 200, responseText: "{}"});
            request = mostRecentAjaxRequest();
            expect(request.url).toEqual('/api/v3/cm/peers');
            expect(request.method).toEqual('GET');
            peer.viewModel.activePeer.reset();
            clearAjaxRequests();
        });

        it("should PUT the peer information to the server if update is true.", function() {
            jasmine.Ajax.useMock();
            peer.viewModel.activePeer.name('peerName');
            peer.viewModel.activePeer.url('peerUrl');
            peer.viewModel.activePeer.username('peerUsername');
            peer.viewModel.activePeer.password('peerPassword');
            peer.viewModel.activePeer.update(true);
            peer.viewModel.activePeer.persistPeer();
            var request = mostRecentAjaxRequest(),
                params = JSON.parse(request.params);
            expect(request.method).toEqual('PUT');
            expect(params.name).toEqual(peer.viewModel.activePeer.name());
            expect(params.url).toEqual(peer.viewModel.activePeer.url());
            expect(params.username).toEqual(peer.viewModel.activePeer.username());
            expect(params.password).toEqual(peer.viewModel.activePeer.password());
            peer.viewModel.activePeer.reset();
            clearAjaxRequests();
        });

        it("should retrieve the status of the peer when testStatus is called and set peer.status.state to 'state-connected' if success === true.", function () {
            var mockPeer = {name: 'peerName', url: 'peerUrl'},
                mockResponse = '{"id": 13, "active": false, "success": true}',
                request = testPeerRequest(mockPeer, mockResponse);

            expect(mockPeer.status().state).toEqual('state-connected');
            expect(mockPeer.status().message).toEqual(I18n.t('ui.status.connected'));
        });

        it("should retrieve the status of the peer when testStatus is called and set peer.status.state to 'state-error' if success === false.", function () {
            var mockPeer = {name: 'peerName', url: 'peerUrl'},
            mockResponse = {id: 13, active: false, success: false, resultMessage: "No good"},
            request = testPeerRequest(mockPeer, JSON.stringify(mockResponse));

            expect(mockPeer.status().state).toEqual('state-error');
            expect(mockPeer.status().message).toEqual(mockResponse.resultMessage);
        });

        it("should retrieve the status of the peer when testStatus is called and set peer.status.state to 'state-unknown' if an error occurs.", function () {
            // Adding status property to cover status property already existing.
            var mockPeer = {name: 'peerName', url: 'peerUrl', status: ko.observable()},
            request = testPeerRequest(mockPeer, JSON.stringify({active: false, success: true}), 500);

            expect(mockPeer.status().state).toEqual('state-unknown');
            expect(mockPeer.status().message).toEqual(I18n.t('ui.status.unknown'));
        });

        it("should retrieve the status of the peer when testStatus is called, retrying until active == false and set peer.status.state to 'state-testing' if active == true.", function () {
            var mockPeer = {name: 'peerName', url: 'peerUrl'},
                mockResponse = {id: 13, active: true},
                request;

            jasmine.Ajax.useMock();
            peer.viewModel.testPeer.call(mockPeer);
            request = mostRecentAjaxRequest();
            expect(request.url).toEqual('/api/v3/cm/peers/' + mockPeer.name + '/commands/test');
            request.response({
                status: 200,
                responseText: JSON.stringify(mockResponse)
              });
            request = mostRecentAjaxRequest();
            expect(request.url).toEqual('/api/v3/commands/' + mockResponse.id);

            jasmine.Clock.useMock();
            request.response({
                status: 200,
                responseText: JSON.stringify(mockResponse)
              });

            jasmine.Clock.tick(1500);

            request = mostRecentAjaxRequest();

            expect(mockPeer.status().state).toEqual('state-testing');
            expect(mockPeer.status().message).toEqual(I18n.t('ui.testing'));

            mockResponse.active = false;
            mockResponse.success = true;
            request.response({
                status: 200,
                responseText: JSON.stringify(mockResponse)
              });

            request = mostRecentAjaxRequest();
            expect(request.url).toEqual('/api/v3/commands/' + mockResponse.id);
            expect(mockPeer.status().state).toEqual('state-connected');
            expect(mockPeer.status().message).toEqual(I18n.t('ui.status.connected'));
            clearAjaxRequests();

        });

        $ui.remove();
    });
});
