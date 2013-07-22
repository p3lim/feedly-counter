var rotation, context, image;

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
	}
}

var updateBadge = function(text){
	if(text !== undefined){
		chrome.browserAction.setIcon({path: '/icons/icon_enabled.png'});
		chrome.browserAction.setBadgeBackgroundColor({color: '#D00018'});
		chrome.browserAction.setBadgeText({text: text.toString()});

		if(+localStorage.getItem('unread') !== +text){
			animateIcon();
		}

		localStorage.setItem('unread', text);
	} else {
		chrome.browserAction.setIcon({path: '/icons/icon_disabled.png'});
		chrome.browserAction.setBadgeText({text: ''});
	}
}

var parseCount = function(details){
	for(var index = 0; index < details.length; index++){
		var item = details[index];

		if(item.id.match(/^user\/[\da-f-]+?\/category\/global\.all$/)){
			updateBadge(item.count > 0 ? item.count : '');
		}
	}
}

var onReadyState = function(){
	if(this.readyState === 4){
		if(this.status === 200){
			var response = JSON.parse(this.response);
			parseCount(response.unreadcounts);
		} else if(status === 401){
			localStorage.removeItem('oauth');
			updateBadge();
		}
	}
}

var requestCount = function(bypass){
	if(localStorage.getItem('oauth')){
		var currentTime = Date.now();
		var lastRequest = +localStorage.getItem('lastRequest');
		if((!lastRequest || (currentTime - lastRequest) > 5000) || bypass){
			localStorage.setItem('lastRequest', currentTime);

			var xhr = new XMLHttpRequest();
			xhr.open('GET', 'http://cloud.feedly.com/v3/markers/counts');
			xhr.onreadystatechange = onReadyState;
			xhr.setRequestHeader('Authorization', localStorage.getItem('oauth'));
			xhr.send();
		}
	} else {
		updateBadge();
	}
}

var authCallback = function(details){
	var headers = details.requestHeaders;
	for(var index = 0; index < headers.length; index++){
		var header = headers[index];
		if(header.name === 'X-Feedly-Access-Token'){
			localStorage.setItem('oauth', header.value);
			requestCount();
		}
	}

	chrome.webRequest.onBeforeSendHeaders.removeListener(authCallback);
}

var markCallback = function(details){
	if(details.hasOwnProperty('requestBody') || details.requestBody.hasOwnProperty('raw')){
		var bytes = new Uint8Array(details.requestBody.raw[0].bytes);
		var data = JSON.parse(String.fromCharCode.apply(null, bytes));

		if(data.action === 'markAsRead'){
			requestCount(true);
		}
	}
}

var onInitialize = function(){
	if(!localStorage.getItem('interval')){
		localStorage.setItem('interval', '15');
	}

	rotation = 0;

	var canvas = document.createElement('canvas');
	canvas.height = 19;
	canvas.width = 19;

	context = canvas.getContext('2d');
	context.scale(0.6, 0.6)

	image = new Image();
	image.src = '/icons/icon_enabled.png';

	requestCount();

	chrome.alarms.create('feedly-counter', {periodInMinutes: +localStorage.getItem('interval')});
	chrome.webRequest.onBeforeRequest.addListener(markCallback, {
		urls: ['http://cloud.feedly.com/v3/markers?*'],
		types: ['xmlhttprequest']
	}, ['requestBody']);
}

chrome.runtime.onStartup.addListener(onInitialize);
chrome.runtime.onInstalled.addListener(onInitialize);

chrome.browserAction.onClicked.addListener(function(){
	if(localStorage.getItem('oauth')){
		requestCount();
	} else {
		chrome.webRequest.onBeforeSendHeaders.addListener(authCallback, {
			urls: ['http://cloud.feedly.com/v3/subscriptions*']
		}, ['requestHeaders']);
	}

	chrome.tabs.query({
		url: 'http://cloud.feedly.com/'
	}, function(tabs){
		var tab = tabs[0];
		if(tab){
			chrome.tabs.update(tab.id, {active: true});
			chrome.tabs.reload(tab.id);
		} else {
			chrome.tabs.create({url: 'http://cloud.feedly.com/'});
		}
	});
});

chrome.alarms.onAlarm.addListener(function(alarm){
	if(alarm.name === 'feedly-counter'){
		requestCount();
	}
})
