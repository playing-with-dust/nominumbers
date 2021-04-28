const api = require('./api.js')
const jQuery = require("jquery")
const id = require('./identicon.js')
const addr = require('./address.js')
const utils = require('./utils.js')
const search = require('./search.js')

var stash_address = ""
var controller_address = ""
var balance = 0

const getController = async (stash_address) => {
    let results = await search.searchAddress(
	0,stash_address,
	{
	    call_function: ["bond"],
	    param: ["controller"]
	});

    if (results.length>0) {
	let value = results[0].value
	if (value.Id) {
	    return addr.ss58Encode(utils.fromHexString(value.Id))
	} else {
	    return addr.ss58Encode(utils.fromHexString(value))
	}
    }
    return null
}

const getNominations = async (controller_address) => {
    let results = await search.searchAddress(
	0,controller_address,
	{
	    call_function: ["nominate"],
	    param: ["targets"]
	});

    let ret = []
    if (results.length>0) {
	for (let r of results) {
	// the first one should be the most recent
	    let value = r.value
	    for (let v of value) {
		let a
		if (v.Id) {
		    a = addr.ss58Encode(utils.fromHexString(v.Id))
		} else {
		    a = addr.ss58Encode(utils.fromHexString(v))
		}
		// the same validator can be in multiple nomination calls
		// (I guess each nomination resets the previous ones but
		// we need to collect em all, just in case we get some
		// payouts from them in our sample)
		if (!ret.includes(a)) {
		    ret.push(a)
		}
	    }
	}
    }
    return ret
}

const displayAccount = async (div,address,showName) => {
    div.appendChild(id.identicon(addr.ss58Decode(address), false, 30));	
    let account
    let name
    if (showName) {
	account = await api.getSearch(address)
	name = account.data.account.account_display.display
    }
    if (!name || name=="") {
	div.innerHTML+=address+"<br>";
    } else {
	div.className="short_name"
	div.innerHTML+=name+"<br>";
    }
}

const renderNominations = async (div,n,showAccountName) => {
    let nominations = {}
    for (let validator of n) {
	
	nominations[validator]={
	    total: 0,
	    count: 0,
	    percent: 0,
	    splits: 0,
	}
	
	let nomination_div = document.createElement('div');				
	div.appendChild(nomination_div)
	nomination_div.className="col-xs-12 col-sm-6 col-md-4 col-lg-3 nom"

	let name_div = document.createElement('div');
	nomination_div.appendChild(name_div);
	name_div.className = "long_name"	
	await displayAccount(name_div,validator,showAccountName)
	
	let total_div = document.createElement('div');
	nomination_div.appendChild(total_div);
	total_div.id=validator+"_percent"
	total_div.className="nomination_percent col-sm-5"
	total_div.innerHTML="..."

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

const findValidatorInParams = (params) => {
    let validator_stash
    for (const p of params) {		
	if (p.name=="validator_stash") {
	    validator_stash=utils.fromHexString(p.value)
	}
    }
    if (validator_stash) {
	return addr.ss58Encode(validator_stash)
    }
    return null;
}

// calculation in KSM
const update_apy = (total_payout,num_eras) => {
    let d=(total_payout/balance)*100
    console.log([total_payout,balance,d])
    let eras_per_day = 4
    let apy = (d*eras_per_day*365)/num_eras    
    jQuery("#apy").html(apy.toFixed(2)+"% APY")
}


const updateNominations = (stats,nominations) => {
    let total = 0
    for (let validator in nominations) {
	total+=nominations[validator].total
    }

    var el = document.getElementById('total');
    el.innerHTML=stats.weekly_total/1e12+" KSM"

    update_apy(stats.weekly_total/1e12,stats.num_eras)

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
    var x = await api.getStaking(stash_address);
    const stats = { weekly_total: 0, num_eras: 0 };
    for (const r of x) {
	// get the transaction detail of this reward
	let y = await api.getExtrinsic(r.extrinsic_hash);

	stats.weekly_total += parseInt(r.amount)
	stats.num_eras += 1
	
	// payout extrinsics contain nominator addresses in their params
	// (validator_stash), we need to deal with batched payouts too
	if (y.data.call_module_function=="batch") {
	    // we need to filter the validators to find the ones we
	    // have actually nominated previously
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

	    // count the number of nominations we have
	    let count=0
	    for (let validator of unique) {
		if (nominations[validator]) {
		    count+=1;
		}
	    }
	    
	    for (let validator of unique) {
		if (nominations[validator]) {
		    let n = nominations[validator]
		    // biggest mystery is whether we can get which validator is our one
		    // if we have nomiated multiple in this set, then split the amount
		    // between them equally (for the moment)
		    n.total+=parseInt(r.amount)/unique.length
		    if (count>1) {
			n.splits+=1
		    }
		    n.count+=1
		    updateNominations(stats,nominations)							
		}
	    }
	} else {
	    // or a single validator stash - easy!
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

const stashAddr = async () => {
    stash_address = jQuery("#stash_address").val()
    jQuery("#nominations").empty();
    jQuery("#start").prop('disabled', true);

    let account = await api.getSearch(stash_address)
    console.log(account.data)
    balance = parseFloat(account.data.account.balance)
    
    jQuery("#status").html("status: searching for controller")
    let a = addr.ss58Decode(stash_address)	
    if (!a) {
	jQuery("#status").html("status: address error")
    } else {
	jQuery("#stash_icon").empty();
	jQuery("#stash_icon").append(id.identicon(a, false, 50))
	controller_address = await getController(stash_address)

	if (!controller_address) {
	    jQuery("#status").html("status: couldn't find controller")
	    return
	}

	jQuery("#nominations").empty();
	jQuery("#status").html("status: loading nominations")
	var el = document.getElementById('nominations');
	let n = await getNominations(controller_address)

	if (n.length==0) {
	    jQuery("#status").html("status: no nominations found")
	    return
	}

	nominations = await renderNominations(el, n, true);	
	jQuery("#status").html("status: loading rewards")
	var el = document.getElementById('reward-slash');
	await displayStaking(el,stash_address,nominations)
	jQuery("#status").html("status: finished")
    }
}

const run = async () => {
}

// connect up the things
jQuery("#stash_address").change(stashAddr);
//jQuery("#start").click(run);

