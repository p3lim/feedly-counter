var inputChange = function(){
	localStorage.setItem(this.id, this.checked);
};

document.addEventListener('DOMContentLoaded', function(){
	[].forEach.call(this.querySelectorAll('input'), function(input){
		input.addEventListener('change', inputChange);
		input.checked = localStorage.getItem(input.id) === 'true';
	});

	var interval = this.querySelector('span');
	interval.innerText = localStorage.getItem('interval');
	interval.addEventListener('mousewheel', function(event){
		var value = +this.innerText;
		var multiplier = event.shiftKey ? 25 : 1;

		if(event.wheelDelta > 0)
			value += 1 * multiplier;
		else
			value -= 1 * multiplier;

		if(value < 1)
			value = 1;
		else if(value > 1440)
			value = 1440;

		if(value != +this.innerText){
			this.innerText = value;

			chrome.runtime.sendMessage({
				key: 'interval',
				value: value
			});
		};
	});
});
