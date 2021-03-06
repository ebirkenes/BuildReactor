define([
	'core/services/cctray/buildService',
	'mout/object/mixIn'
], function (CCTrayBuildService, mixIn) {

	'use strict';

	var GoBuildService = function (settings) {
		mixIn(this, new CCTrayBuildService(settings));
		this.cctrayLocation = 'cctray.xml';
	};
	
	GoBuildService.settings = function () {
		return {
			typeName: 'GoCD',
			baseUrl: 'go',
			icon: 'go/icon.png',
			logo: 'go/logo.png',
			projects: [],
			url: '',
			urlHint: 'URL, e.g. http://example-go.thoughtworks.com/',
			username: '',
			password: '',
			updateInterval: 60
		};
	};

	return GoBuildService;
});