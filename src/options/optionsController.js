define([
	'signals',
	'jquery',
	'options/serviceSettings',
	'options/serviceOptions',
	'options/addService',
	'options/serviceList',
	'options/savePrompt',
	'options/removePrompt',
	'options/alert'
], function (signals, $, serviceSettings, serviceOptions, addService, serviceList, savePrompt, removePrompt, alert) {

	'use strict';
	
	var isSaveNeeded = false;
	var serviceNameElement;
	var currentSettings;

	function setSaveNeeded(isNeeded) {
		isSaveNeeded = isNeeded;
		$('#service-add-button').toggleClass('disabled', isSaveNeeded);
	}

	function initialize(serviceTypes) {
		savePrompt.removeSelected.add(function () {
			removeCurrentService();
			savePrompt.hide();
		});
		addService.on.selected.add(function (serviceInfo) {
			serviceSettings.add(serviceInfo);
			serviceList.update(serviceSettings.getAll());
			serviceList.selectLast();
			setSaveNeeded(true);
		});
		removePrompt.removeSelected.add(function () {
			removeCurrentService();
		});
		serviceSettings.cleared.add(function () {
			serviceNameElement.text('');
			serviceOptions.show(null);
		});
		serviceList.itemClicked.add(function (item) {
			if (isSaveNeeded) {
				savePrompt.show(serviceList.getSelectedName());
			} else {
				serviceList.selectItem(item);
			}
		});
		serviceList.itemSelected.add(function (item) {
			var link = $(item);
			serviceNameElement.text(link.text());
			var index = link.data('service-index');
			var serviceInfo = serviceSettings.getByIndex(index);
			showServicePage(serviceInfo);
		});
		serviceOptions.on.updated.add(serviceSettingsChanged);
		reset(serviceTypes);
	}

	function reset(serviceTypes) {
		savePrompt.initialize();
		addService.initialize('.service-add-container', serviceTypes);
		removePrompt.initialize();
		serviceOptions.initialize();
		setSaveNeeded(false);
		serviceSettings.clear();
		serviceNameElement = $('.service-name');
		$('#service-add-button').click(function () {
			if (!$('#service-add-button').hasClass('disabled')) {
				serviceOptions.show(null);
				addService.show();
				serviceList.selectItem(null);
				$('.service-name').text('Add new service');
				$('#service-add-button').addClass('btn-primary');
			}
		});
		$('#service-remove-button').click(function () {
			removePrompt.show(serviceList.getSelectedName());
		});
	}

	function removeCurrentService() {
		setSaveNeeded(false);
		serviceSettings.remove(currentSettings);
		serviceList.update(serviceSettings.getAll());
		chrome.extension.sendMessage({name: "updateSettings", settings: serviceSettings.getAll()});
	}

	function load(newSettings) {
		serviceSettings.load(newSettings);
		serviceList.load(newSettings);
	}

	function showServicePage(serviceInfo) {
		if (serviceInfo === undefined) {
			throw { name: 'showServicePage', message: 'serviceInfo is undefined' };
		}
		currentSettings = serviceInfo;
		$('#service-add-button').removeClass('btn-primary');
		addService.hide();
		serviceOptions.show(serviceInfo);
	}

	function serviceSettingsChanged(updatedSettings) {
		serviceSettings.update(currentSettings, updatedSettings);
		chrome.extension.sendMessage({name: "updateSettings", settings: serviceSettings.getAll()});
		alert.show();
		setSaveNeeded(false);
		currentSettings = updatedSettings;
	}

	return {
		initialize: initialize,
		load: load
	};
});