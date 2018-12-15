
//UNCOMMENT when add month selector to DOM
document.querySelector('#monthform select').addEventListener('change', function(event){
	// Find days in month to pass to avg calculation 
	var monthVal = parseInt(document.getElementById("selectmonth").value)
	var daysInMonth = new Date(2017, monthVal+1, 0).getDate();
	// Calculate monthly total 
	calcTotalMonth(daysInMonth)
	// most productive date of the month
	findProductiveDate()
	// most productive day of the week for that month

})

//This is the only event listener for viewStatsLink
// document.querySelector("#viewStatsLink").addEventListener('click',function(event){
// 	event.preventDefault()
// 	var dateObj = new Date();
// 	console.log(dateObj)
// 	var monthVal = dateObj.getUTCMonth()
// 	var monthVal = parseInt(document.getElementById("selectmonth").value)
// 	var daysInMonth = new Date(2017, monthVal+1, 0).getDate();
// 	// Calculate monthly total 
// 	calcTotalMonth(daysInMonth)
// 	// most productive date of the month
// 	findProductiveDate()
// })


