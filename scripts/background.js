var context, lastCount;
var defaults = {
	'interval': 15,
	'beta': false,
	'notifications': false,
	'upgrade': 1,
}

var rotation = 0;
var animateIcon = function(){
	rotation++;

	context.save();
	context.clearRect(0, 0, 32, 32);
	context.translate(16, 16);
	context.rotate(rotation * Math.PI / 32);
	context.translate(-16, -16);
	context.drawImage(context.image, 0, 0);
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
			url: 'https://feedly.com/*'
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
		xhr.open('GET', 'https://feedly.com/v3/markers/counts');
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

var onInitialize = function(){
	if(!localStorage.getItem('upgrade')){
		localStorage.clear();

		for(var key in defaults){
			if(key !== null)
				localStorage.addItem(key, defaults[key]);
		}
	} else if(localStorage.getItem('upgrade') < defaults.upgrade){
		for(var index = 0; index < localStorage.length; index++){
			var key = localStorage.key(index);
			if(defaults[key] === undefined)
				localStorage.removeItem(key);
		}

		for(var key in defaults){
			if(localStorage.getItem(key) === null)
				localStorage.addItem(key, defaults[key]);
		}

		localStorage.setItem('upgrade', defaults.upgrade);
	}

	rotation = 0;

	var canvas = document.createElement('canvas');
	canvas.height = 19;
	canvas.width = 19;

	context = canvas.getContext('2d');
	context.scale(0.6, 0.6)

	context.image = new Image();
	context.image.src = 'images/icon_enabled.png';

	requestCount();

	chrome.alarms.create('feedly-counter', {periodInMinutes: +localStorage.getItem('interval')});
	chrome.webRequest.onBeforeRequest.addListener(markCallback, {
		urls: 'https://feedly.com/v3/markers?*'],
		types: ['xmlhttprequest']
	}, ['requestBody']);
};

chrome.runtime.onStartup.addListener(onInitialize);
chrome.runtime.onInstalled.addListener(onInitialize);

chrome.browserAction.onClicked.addListener(function(){
	if(localStorage.getItem('oauth'))
		requestCount();
	else {
		chrome.webRequest.onBeforeSendHeaders.addListener(authCallback, {
			urls: ['https://feedly.com/v3/subscriptions*']
		}, ['requestHeaders']);
	};

	chrome.tabs.query({
		url: 'https://feedly.com/' + (localStorage.getItem('beta') === 'true' ? 'beta' : '')
	}, function(tabs){
		var tab = tabs[0];
		if(tab){
			chrome.tabs.update(tab.id, {active: true});
			chrome.tabs.reload(tab.id);
		} else
			chrome.tabs.create({url: 'https://feedly.com/' + (localStorage.getItem('beta') === 'true' ? 'beta' : '')});
	});
});

chrome.alarms.onAlarm.addListener(function(alarm){
	if(alarm.name === 'feedly-counter')
		requestCount();
});
