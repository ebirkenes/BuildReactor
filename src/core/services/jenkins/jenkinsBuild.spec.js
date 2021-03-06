define([
	'core/services/jenkins/jenkinsBuild',
	'core/services/request',
	'rx',
	'text!core/services/jenkins/job.fixture.json',
	'text!core/services/jenkins/lastCompletedBuild.fixture.json'
], function (Build, request, Rx, jobFixture, lastCompletedBuildFixture) {
	'use strict';

	describe('core/services/jenkins/jenkinsBuild', function () {

		var build;
		var settings;
		var jobJson;
		var lastCompletedBuildJson;

		beforeEach(function () {
			settings = {
				url: 'http://example.com'
			};
			jobJson = JSON.parse(jobFixture);
			lastCompletedBuildJson = JSON.parse(lastCompletedBuildFixture);
			var callCount = 0;
			spyOn(request, 'json').andCallFake(function () {
				callCount++;
				switch (callCount) {
				case 1:
					return Rx.Observable.returnValue(jobJson);
				case 2:
					return Rx.Observable.returnValue(lastCompletedBuildJson);
				}
			});
			build = new Build('build_id', settings);
		});

		it('should make calls on update', function () {
			build.update();

			expect(request.json).toHaveBeenCalled();
			expect(request.json.calls[0].args[0].url).toBe('http://example.com/job/build_id/api/json');
			expect(request.json.calls[0].args[0].username).toBe(settings.username);
			expect(request.json.calls[0].args[0].password).toBe(settings.password);
			expect(request.json.calls[1].args[0].url).toBe('http://example.com/job/build_id/lastCompletedBuild/api/json');
		});

		it('should parse response and return current state', function () {
			build.update().subscribe(function (state) {
				expect(state.id).toBe('build_id');
				expect(state.name).toBe('config-provider-model');
				expect(state.webUrl).toBe('http://ci.jenkins-ci.org/job/config-provider-model/1354/');
				expect(state.isBroken).toBe(false);
				expect(state.isRunning).toBe(false);
				expect(state.isDisabled).toBe(false);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isBroken on FAILURE', function () {
			lastCompletedBuildJson.result = 'FAILURE';

			build.update().subscribe(function (state) {
				expect(state.isBroken).toBe(true);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isBroken on UNSTABLE', function () {
			lastCompletedBuildJson.result = 'UNSTABLE';

			build.update().subscribe(function (state) {
				expect(state.isBroken).toBe(true);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isBroken on ABORTED', function () {
			lastCompletedBuildJson.result = 'ABORTED';

			build.update().subscribe(function (state) {
				expect(state.isBroken).toBe(true);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isBroken on NOT_BUILT', function () {
			lastCompletedBuildJson.result = 'NOT_BUILT';

			build.update().subscribe(function (state) {
				expect(state.isBroken).toBe(true);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isBroken to false on successful build', function () {
			lastCompletedBuildJson.result = 'SUCCESS';

			build.update().subscribe(function (state) {
				expect(state.isBroken).toBe(false);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isBroken and Unknown tag if status unknown', function () {
			lastCompletedBuildJson.result = 'unknown_status';

			build.update().subscribe(function (state) {
				expect(state.tags).toContain({name: 'Unknown', description: 'Result [unknown_status] is unknown'});
				expect(state.isBroken).not.toBeDefined();
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isRunning', function () {
			jobJson.lastBuild.number = 100;
			jobJson.lastCompletedBuild.number = 99;

			build.update().subscribe(function (state) {
				expect(state.isRunning).toBe(true);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should not set isRunning if it is not', function () {
			jobJson.lastBuild.number = 100;
			jobJson.lastCompletedBuild.number = 100;

			build.update().subscribe(function (state) {
				expect(state.isRunning).toBe(false);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isDisabled if build disabled', function () {
			jobJson.buildable = false;

			build.update().subscribe(function (state) {
				expect(state.isDisabled).toBe(true);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set Unstable tag if build unstable', function () {
			lastCompletedBuildJson.result = 'UNSTABLE';

			build.update().subscribe(function (state) {
				expect(state.tags).toContain({ name: 'Unstable', type: 'warning' });
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set changes', function () {
			build.update().subscribe(function (state) {
				expect(state.changes[0]).toEqual({ name : 'Kohsuke Kawaguchi', message : 'the trunk is toward 1.493-SNAPSHOT' });
				expect(state.changes[1]).toEqual({ name : 'Seiji Sogabe', message : '[FIXED JENKINS-15836] Slave\'s Name should be trimmed of spaces at the beginning and end of the Name on Save' });
				expect(state.changes[2]).toEqual({ name : 'Christoph Kutzinski', message : 'Switch to ignore post-commit hook in SCM polling triggers [FIXED JENKINS-6846]' });
				expect(state.changes[3]).toEqual({ name : 'Christoph Kutzinski', message : 'disambiguate method call to make Eclipse happy' });
				expect(state.changes[4]).toEqual({ name : 'Kohsuke Kawaguchi', message: 'bundling the new versions of slave installer.' });
			});

			expect(request.json).toHaveBeenCalled();
		});

	});

});