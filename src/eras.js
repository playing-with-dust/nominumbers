const $ = require("jquery")

function treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

function daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}

function erasBetween(startDate, endDate, network) {
    let mul = 4
    if (network=="dot") mul=1
    return Math.round(daysBetween(startDate,endDate)*mul)
}

var start_date = null;

function update(updateFn,network) {
    let eras = erasBetween(start_date,new Date(),network)
    updateFn(eras)
    $('#num-eras').html("= "+eras+" eras");
}

function initDate(updateFn,network) {
    start_date = new Date();
    start_date.setDate(start_date.getDate()-7); 

    var date = start_date.getFullYear()+"-"+(start_date.getMonth() + 1).toString().padStart(2,'0')+'-'+start_date.getDate();
    $('#start-date').val(date);    
    
    update(updateFn,network)

    $('#start-date').change(() => {
	start_date = new Date($('#start-date').val()) 
	update(updateFn,network)
    })
    
}

export { initDate, update, start_date }
