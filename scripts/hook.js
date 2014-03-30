var part = window.location.href.split('?code=')[1];
if(part.match('.*state=feedlycounter'))
	chrome.runtime.sendMessage({code: part.split('&state=feedlycounter')[0]});
