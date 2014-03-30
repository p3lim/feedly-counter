var inputChange = function(){
	localStorage.addItem(this.id, this.checked);
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

		if(event.wheelDelta > 0)
			value += 1;
		else
			value -= 1;

		if(value < 1)
			value = 1;
		else if(value > 1440)
			value = 1440;

		if(value != +this.innerText){
			this.innerText = value;

			localStorage.addItem('interval', value);
		};
	});
});
