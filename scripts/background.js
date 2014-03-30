var rotation, context, image, lastCount;

var animateIcon = function(){
	rotation++;

	context.save();
	context.clearRect(0, 0, 32, 32);
	context.translate(16, 16);
	context.rotate(rotation * Math.PI / 32);
	context.translate(-16, -16);
	context.drawImage(image, 0, 0);
	context.restore();

	chrome.browserAction.setIcon({
		imageData: context.getImageData(0, 0, 19, 19)
	});

	if(rotation <= 63){
		setTimeout(animateIcon, 10);
	} else {
		rotation = 0;
	};
};

var updateNotifications = function(count){
	if(localStorage.getItem('feedly-counter') === 'true'){
		chrome.tabs.query({
			currentWindow: true,
			active: true,
			url: 'http*://feedly.com/*'
		}, function(tabs){
			if(tabs.length == 0){
				chrome.notifications.clear('feedly-counter', function(){
					chrome.notifications.create('feedly-counter', {
						type: 'basic',
						iconUrl: 'images/icon128.png',
						title: 'Feedly Counter',
						message: count + ' unread feed' + (count > 1 ? 's' : '')
					}, function(){});
				});
			};
		});
	};
};

var updateBadge = function(count){
	if(typeof(count) == 'number'){
		chrome.browserAction.setIcon({path: 'images/icon_enabled.png'});

		if(count > 0){
			chrome.browserAction.setBadgeBackgroundColor({color: '#D00018'});
			chrome.browserAction.setBadgeText({text: count.toString()});
		} else
			chrome.browserAction.setBadgeText({text: ''});

		if(lastCount != count){
			animateIcon();

			if(count > 0)
				updateNotifications(count);

			lastCount = count;
		};
	} else {
		chrome.browserAction.setIcon({path: 'images/icon_disabled.png'});
		chrome.browserAction.setBadgeBackgroundColor({color: '#BBB'});
		chrome.browserAction.setBadgeText({text: '?'});
	};
};

var parseCount = function(details){
	for(var index = 0; index < details.length; index++){
		var item = details[index];

		if(item.id.match(/^user\/[\da-f-]+?\/category\/global\.all$/))
			updateBadge(item.count);
	};
};

var onReadyState = function(){
	if(this.readyState === 4){
		if(this.status === 200){
			var response = JSON.parse(this.response);
			parseCount(response.unreadcounts);
		} else {
			localStorage.removeItem('oauth');
			updateBadge();
		}
	}
}

var requestCount = function(){
	if(localStorage.getItem('oauth')){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', localStorage.getItem('scheme') + '://feedly.com/v3/markers/counts');
		xhr.onreadystatechange = onReadyState;
		xhr.setRequestHeader('Authorization', localStorage.getItem('oauth'));
		xhr.send();
	} else
		updateBadge();
};

var authCallback = function(details){
	var headers = details.requestHeaders;
	for(var index = 0; index < headers.length; index++){
		var header = headers[index];
		if(header.name === 'X-Feedly-Access-Token'){
			localStorage.setItem('oauth', header.value);
			requestCount();
		};
	};

	chrome.webRequest.onBeforeSendHeaders.removeListener(authCallback);
};

var markCallback = function(details){
	if(details.hasOwnProperty('requestBody') || details.requestBody.hasOwnProperty('raw')){
		var bytes = new Uint8Array(details.requestBody.raw[0].bytes);
		var data = JSON.parse(String.fromCharCode.apply(null, bytes));

		if(data.action === 'markAsRead')
			setTimeout(requestCount, 2000);
	};
};

var onStorageChanged = function(event){
	if(event.key === 'scheme'){
		chrome.webRequest.onBeforeRequest.removeListener(markCallback);
		chrome.webRequest.onBeforeRequest.addListener(markCallback, {
				urls: [event.newValue + '://feedly.com/v3/markers?*'],
				types: ['xmlhttprequest']
		}, ['requestBody']);
	};
};

var onInitialize = function(){
	if(!localStorage.getItem('interval'))
		localStorage.setItem('interval', '15');

	if(!localStorage.getItem('scheme'))
		localStorage.setItem('scheme', 'https');

	if(!localStorage.getItem('notifications'))
		localStorage.setItem('notifications', false);

	if(!localStorage.getItem('change3')){
		localStorage.removeItem('oauth');
		chrome.tabs.create({url: 'options.html'});
	};

	rotation = 0;

	var canvas = document.createElement('canvas');
	canvas.height = 19;
	canvas.width = 19;

	context = canvas.getContext('2d');
	context.scale(0.6, 0.6)

	image = new Image();
	image.src = 'images/icon_enabled.png';

	requestCount();

	window.addEventListener('storage', onStorageChanged, false);
	chrome.alarms.create('feedly-counter', {periodInMinutes: +localStorage.getItem('interval')});
	chrome.webRequest.onBeforeRequest.addListener(markCallback, {
		urls: [localStorage.getItem('scheme') + '://feedly.com/v3/markers?*'],
		types: ['xmlhttprequest']
	}, ['requestBody']);
};

chrome.runtime.onStartup.addListener(onInitialize);
chrome.runtime.onInstalled.addListener(onInitialize);

chrome.browserAction.onClicked.addListener(function(){
	var scheme = localStorage.getItem('scheme');
	if(localStorage.getItem('oauth'))
		requestCount();
	else {
		chrome.webRequest.onBeforeSendHeaders.addListener(authCallback, {
			urls: [scheme + '://feedly.com/v3/subscriptions*']
		}, ['requestHeaders']);
	};

	chrome.tabs.query({
		url: scheme + '://feedly.com/' + (localStorage.getItem('beta') === 'true' ? 'beta' : '')
	}, function(tabs){
		var tab = tabs[0];
		if(tab){
			chrome.tabs.update(tab.id, {active: true});
			chrome.tabs.reload(tab.id);
		} else
			chrome.tabs.create({url: scheme + '://feedly.com/' + (localStorage.getItem('beta') === 'true' ? 'beta' : '')});
	});
});

chrome.alarms.onAlarm.addListener(function(alarm){
	if(alarm.name === 'feedly-counter')
		requestCount();
});
