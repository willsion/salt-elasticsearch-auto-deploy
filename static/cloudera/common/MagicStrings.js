/* Copyright (c) 2012 Cloudera, Inc. All rights reserved. */

/**
 * Environmental Constants
 */
define(function() {
    return {
        compareTypes: {
            eq: 'EQ',
            // Use this comparator to compare with multiple values at once,
            // ORing them together.
            equalsMultiple: 'EQ_WITH_OR'
        },
        events: {
            attributes: {
                category: 'CATEGORY',
                eventCode: 'EVENTCODE',
                hosts: 'HOSTS',
                role: 'ROLE',
                service: 'SERVICE'
            },
            categories: {
                healthCheck: 'HEALTH_CHECK'
            }
        },
        intervalUnits: {
            minutes: 'MINUTES',
            hours: 'HOURS',
            days: 'DAYS',
            weeks: 'WEEKS',
            month: 'MONTHS',
            years: 'YEARS'
        },
        scheduleTypes: {
            immediate: 'IMMEDIATE',
            once: 'ONCE',
            recurring: 'RECURRING'
        },
        serviceTypes: {
            hdfs: 'HDFS',
            mapreduce: 'MAPREDUCE'
        }
    };
});
