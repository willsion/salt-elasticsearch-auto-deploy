// Copyright (c) 2011-2012 Cloudera, Inc. All rights reserved.
define(function() {
    var analytics = {
            trackEvent : function(category, event, label) {
                if (window._gaq) {
                  var eventInfo = [ '_trackEvent', category, event ];
                  if (label) {
                    eventInfo.push(label);
                  }
                  _gaq.push(eventInfo);
                }
            },
            setCustomVar : function(slot, name, value, scope){
                if (window._gaq) {
                    var call = [ '_setCustomVar', slot, name, value];
                    if(scope){
                        call.push(scope);
                    }
                    _gaq.push(call);
                }
            }
    };

    jQuery(function($) {
        /*
         * Adds the version as a custom variable.
         *
         * See
         * http://code.google.com/apis/analytics/docs/gaJS/gaJSApiBasicConfiguration.html#_gat.GA_Tracker_._setCustomVar
         *
         * For debugging Google Analytics,
         * http://code.google.com/apis/analytics/docs/tracking/gaTrackingTroubleshooting.html
         * is helpful. As is the Chrome extension:
         * https://chrome.google.com/webstore/detail/jnkmfdileelhofjcijamephohjechhna
         */
        if (window._gaq) {
            _gaq.push(
                    [ '_setCustomVar', 1, 'Version', clouderaManager.version, 2 ],
                    [ '_setCustomVar', 2, 'State', clouderaManager.state, 2 ],
                    [ '_setCustomVar', 3, 'License', clouderaManager.license, 2 ],
                    [ '_gat._anonymizeIp' ],
                    [ '_trackPageview' ]);

            $('[data-event]').click(
                    function(e) {
                        if (window._gaq) {
                            var $target = $(e.currentTarget);
                            analytics.trackEvent(
                                    $target.data('event-category'),
                                    $target.data('event'));
                        }
                    });
        }
    });

    return analytics;
});
