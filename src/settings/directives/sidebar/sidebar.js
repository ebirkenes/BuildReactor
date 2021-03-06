define([
	'settings/app',
	'common-ui/core',
	'htmlSortable'
], function (app, core) {
	'use strict';

	app.directive('sidebar', function ($location) {
		return {
			scope: {
				selected: '=',
				view: '='
			},
			templateUrl: 'src/settings/directives/sidebar/sidebar.html',
			controller: function ($scope, $element, $attrs, $transclude) {

				$scope.sortableCallback = function (startModel, destModel, start, end) {
					var items = destModel.map(function (service) {
						return service.name;
					});
					core.setOrder(items);
				};

				core.configurations.subscribe(function (configs) {
					$scope.$evalAsync(function () {
						$scope.services = configs;
					});
				});

			}
		};
	});
});
