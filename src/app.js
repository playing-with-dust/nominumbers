const bs58 = require('bs58')
const {blake2b} = require('blakejs')
const {ss58Encode, ss58Decode} = require('./address.js')
const {identicon} = require('./identicon.js')
const api = require('./api.js')
const {fromHexString, toHexString, sleep} = require('./utils.js')
const jQuery = require("jquery")

const displayAccount = async (div,raw_address,showName) => {
    div.appendChild(identicon(raw_address, false, 30));		
    let account
    let name
    if (showName) {
	account = await api.getSearch(ss58Encode(raw_address))
	name = account.data.account.account_display.display
    }
    if (!name || name=="") {
	div.innerHTML+=ss58Encode(raw_address)+"<br>";
    } else {
	div.className="short_name"
	div.innerHTML+=name+"<br>";
    }	
}

const findValidatorInParams = (params) => {
    let validator_stash
    for (const p of params) {		
	if (p.name=="validator_stash") {
	    validator_stash=fromHexString(p.value)
	}
    }
    if (validator_stash) {
	return ss58Encode(validator_stash)
    }
    return null;
}

const findNominations = async (div,address,showAccountName) => {
    console.log(["nomination search for controller: ",address])
    let targets = await api.getNomination(address)
    if (!targets) {
	console.log("searching in batch for nominations")
	await sleep(1000); 
	targets = await api.getNominationFromBatch(address)
	if (!targets) {	
	    jQuery("#status").html("status: problem loading nominations")
	    return null
	}
    }
    
    let nominations = {}
    console.log(targets)
    for (let t of targets) {
	console.log(t)
	let validator = ss58Encode(fromHexString(t))
	nominations[validator]={
	    total: 0,
	    count: 0,
	    percent: 0,
	    splits: 0,
	}
	
	let nomination_div = document.createElement('div');				
	div.appendChild(nomination_div)
	nomination_div.className="col-xs-12 col-sm-6 col-md-3 nom"

	let name_div = document.createElement('div');
	nomination_div.appendChild(name_div);
	name_div.className = "long_name"	
	await displayAccount(name_div,fromHexString(t),showAccountName)
	if (showAccountName) {
	    await sleep(1000);
	}

	let total_div = document.createElement('div');
	nomination_div.appendChild(total_div);
	total_div.id=validator+"_percent"
	total_div.className="nomination_percent col-sm-5"
	total_div.innerHTML="loading"

	let count_div = document.createElement('div');
	nomination_div.appendChild(count_div);
	count_div.id=validator+"_count"
	count_div.className="nomination_count"
	count_div.innerHTML="eras active: 0"
	let split_div = document.createElement('div');
	nomination_div.appendChild(split_div);
	split_div.id=validator+"_splits"
	split_div.className="nomination_confidence"
	split_div.innerHTML="confidence: high"
    }
    return nominations;
}

const updateNominations = (stats,nominations) => {
    let total = 0
    for (let validator in nominations) {
	total+=nominations[validator].total
    }

    var el = document.getElementById('total');
    el.innerHTML=stats.weekly_total/1e12+" KSM"

    for (let validator in nominations) {
	let n = nominations[validator]
	n.percent = (n.total/total)*100
	
	var el = document.getElementById(validator+'_percent');
	el.innerHTML=n.percent.toFixed(2)+"%"
	var el = document.getElementById(validator+'_count');
	el.innerHTML="eras active: "+n.count
	var el = document.getElementById(validator+'_splits');
	if (n.splits==0) {
	    el.innerHTML="confidence: high"
	} else {
	    if (n.splits==n.count) {
		el.innerHTML="confidence: low"
	    } else {
		el.innerHTML="confidence: medium"
	    }
	}
	
    }
}

const displayStaking = async (div,stash_address,nominations) => {
    await sleep(1000);
    var x = await api.getStaking(stash_address);
    await sleep(1000);
    const stats = { weekly_total: 0 };
    for (const r of x) {
	console.log(r.extrinsic_hash)
	//let y = await api.getSearch(r.extrinsic_hash);
	// get the transaction detail of this reward
	let y = await api.getExtrinsic(r.extrinsic_hash);
	await sleep(1000);

	stats.weekly_total += parseInt(r.amount)
	console.log(y);
	
	// events contain nominator addresses
	// params contain validator_stash addresses, but sometimes these are batched
	// - so we need to filter them to find the ones we have actually nominated
	
	// two different forms are possible
	if (y.data.call_module_function=="batch") {
	    let unique = []
	    // a list of mutltiple calls
	    for (let calls of y.data.params) {
		for (let call of calls.value) {
		    let validator=findValidatorInParams(call.params)
		    // validators can appear more than once
		    if (!unique.includes(validator)) {
			unique.push(validator)
		    }
		}
	    }

	    console.log("found: "+unique.length+" validators")
	    
	    // count number of nominations we have
	    let count=0
	    for (let validator of unique) {
		if (nominations[validator]) {
		    count+=1;
		}
	    }

	    if (count>0) {
		console.log("found nominated validator in batched payout?");
		//console.log(unique)
		//console.log(nominations)
	    }
	    
	    for (let validator of unique) {
		if (nominations[validator]) {
		    let n = nominations[validator]
		    // biggest mystery is whether we can get which validator is our one
		    // if we have nomiated multiple in this set, then split the amount
		    // between them for the moment
		    n.total+=parseInt(r.amount)/unique.length
		    if (count>1) {
			n.splits+=1
		    }
		    n.count+=1
		    updateNominations(stats,nominations)							
		}
	    }
	} else {
	    // or a single validator stash
	    let validator=findValidatorInParams(y.data.params)

	    let n = nominations[validator]
	    if (n) {
		n.total+=parseInt(r.amount)					
		n.count+=1
		updateNominations(stats,nominations)
	    }
	}
    }
}

export { displayAccount, findValidatorInParams, findNominations, displayStaking };
