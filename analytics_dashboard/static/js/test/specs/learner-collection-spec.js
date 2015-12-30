require(['URI', 'collections/learner-collection'], function (URI, LearnerCollection) {
    'use strict';

    describe('LearnerCollection', function () {
        var course_id = 'org/course/run',
            learners, server, url, lastRequest, getUriForLastRequest;

        lastRequest = function  () {
            return server.requests[server.requests.length - 1];
        };

        getUriForLastRequest = function () {
            return new URI(lastRequest().url);
        };

        beforeEach(function () {
            server = sinon.fakeServer.create(); // jshint ignore:line
            learners = new LearnerCollection(null, {url: '/endpoint/', course_id: course_id});
        });

        afterEach(function () {
            server.restore();
        });

        it('passes the required course_id querystring parameter', function () {
            learners.fetch();
            url = getUriForLastRequest(server);
            expect(url.path()).toEqual('/endpoint/');
            expect(url.query(true)).toEqual(jasmine.objectContaining({course_id: course_id}));
        });

        it('passes the expected pagination querystring parameters', function () {
            learners.setPage(1);
            url = getUriForLastRequest(server);
            expect(url.path()).toEqual('/endpoint/');
            expect(url.query(true)).toEqual({page: '1', page_size: '25', course_id: course_id});
        });

        it('can add and remove filters', function () {
            learners.setFilterField('segments', ['inactive', 'unenrolled']);
            learners.setFilterField('cohort', 'Cool Cohort');
            learners.refresh();
            url = getUriForLastRequest(server);
            expect(url.path()).toEqual('/endpoint/');
            expect(url.query(true)).toEqual({
                page: '1',
                page_size: '25',
                course_id: course_id,
                segments: 'inactive,unenrolled',
                cohort: 'Cool Cohort'
            });
            learners.unsetAllFilterFields();
            learners.refresh();
            url = getUriForLastRequest(server);
            expect(url.path()).toEqual('/endpoint/');
            expect(url.query(true)).toEqual({
                page: '1',
                page_size: '25',
                course_id: course_id
            });
        });

        describe('Sorting', function () {
            var testSorting = function (sortField) {
                learners.setSortField(sortField);
                learners.refresh();
                url = getUriForLastRequest(server);
                expect(url.path()).toEqual('/endpoint/');
                expect(url.query(true)).toEqual({
                    page: '1',
                    page_size: '25',
                    course_id: course_id,
                    order_by: sortField,
                    sort_order: 'asc'
                });
                learners.flipSortDirection();
                learners.refresh();
                url = getUriForLastRequest(server);
                expect(url.query(true)).toEqual({
                    page: '1',
                    page_size: '25',
                    course_id: course_id,
                    order_by: sortField,
                    sort_order: 'desc'
                });
            };

            it('can sort by username', function () {
                testSorting('username');
            });

            it('can sort by problems_attempted', function () {
                testSorting('problems_attempted');
            });

            it('can sort by problems_completed', function () {
                testSorting('problems_completed');
            });

            it('can sort by videos_viewed', function () {
                testSorting('videos_viewed');
            });

            it('can sort by problems_attempted_per_completed', function () {
                testSorting('problems_attempted_per_completed');
            });

            it('can sort by discussion_contributions', function () {
                testSorting('discussion_contributions');
            });
        });

        it('can do a full text search', function () {
            learners.setSearchString('search example');
            learners.refresh();
            url = getUriForLastRequest(server);
            expect(url.path()).toEqual('/endpoint/');
            expect(url.query(true)).toEqual({
                page: '1',
                page_size: '25',
                course_id: course_id,
                text_search: 'search example'
            });
            learners.unsetSearchString();
            learners.refresh();
            url = getUriForLastRequest(server);
            expect(url.query(true)).toEqual({
                page: '1',
                page_size: '25',
                course_id: course_id
            });
        });

        it('can filter, sort, and search all at once', function () {
            learners.setFilterField('ignore_segments', ['highly_engaged', 'unenrolled']);
            learners.setSortField('videos_viewed');
            learners.setSearchString('search example');
            learners.refresh();
            url = getUriForLastRequest(server);
            expect(url.path()).toEqual('/endpoint/');
            expect(url.query(true)).toEqual({
                page: '1',
                page_size: '25',
                course_id: course_id,
                text_search: 'search example',
                ignore_segments: 'highly_engaged,unenrolled',
                order_by: 'videos_viewed',
                sort_order: 'asc'
            });
        });

        it('triggers an event when server gateway timeouts occur', function () {
            var spy = {eventCallback: function () {}};
            spyOn(spy, 'eventCallback');
            learners.on('gatewayTimeout', spy.eventCallback);
            learners.fetch();
            lastRequest().respond(504, {}, '');
            expect(spy.eventCallback).toHaveBeenCalled();
        });
    });
});
