document.addEventListener('DOMContentLoaded', function(){
	var interval = document.getElementById('interval');
	interval.value = localStorage.getItem('interval');

	var beta = document.getElementById('beta');
	beta.checked = localStorage.getItem('beta') === 'true';

	var notifications = document.getElementById('notifications');
	notifications.checked = localStorage.getItem('notifications') === 'true';
});

var interval;
document.querySelector('#interval').addEventListener('input', function(x){
	if(this.value < 1) this.value = 1;
	if(this.value > 1440) this.value = 1440;

	localStorage.setItem('interval', this.value);

	var status = document.getElementsByTagName('span')[0];
	status.innerHTML = 'Saved!';

	clearTimeout(interval);
	interval = setTimeout(function(){
		status.innerHTML = '';
	}, 750);
});

var beta;
document.querySelector('#beta').addEventListener('change', function(){
	localStorage.setItem('beta', this.checked);

	var status = document.getElementsByTagName('span')[2];
	status.innerHTML = 'Saved!';

	clearTimeout(beta);
	beta = setTimeout(function(){
		status.innerHTML = '';
	}, 750);
});

var notifications;
document.querySelector('#notifications').addEventListener('change', function(){
	localStorage.setItem('notifications', this.checked);

	var status = document.getElementsByTagName('span')[3];
	status.innerHTML = 'Saved!';

	clearTimeout(notifications);
	notifications = setTimeout(function(){
		status.innerHTML = '';
	}, 750);
});
