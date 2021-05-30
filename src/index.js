const api = require('./api.js')
const $ = require("jquery")
const id = require('./identicon.js')
const addr = require('./address.js')
const utils = require('./utils.js')
const search = require('./search.js')
const sort = require('./sort.js')

var balance = 0

const getControllers = async (stash_address) => {
    let results = await search.searchAddress(
	0,stash_address,
	{
	    call_function: ["bond","set_controller"],
	    // can have multiple controllers (over time)
	    param: ["controller"]
	});
    let ret=[]
    if (results.length>0) {
	for (let r of results) {
	    if (r.value.Id) {
		ret.push(addr.ss58Encode(utils.fromHexString(r.value.Id)))
	    } else {
		ret.push(addr.ss58Encode(utils.fromHexString(r.value)))
	    }
	}
    }
    return ret
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

const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

const displayAccount = async (icondiv,namediv,address,showName) => {
    icondiv.append(id.identicon(addr.ss58Decode(address), false, 30))	
    icondiv.click(() => { copyToClipboard(address) })

    let account
    let name
    if (showName) {
	account = await api.getSearch(address)
	name = account.data.account.account_display.display
    }
    if (!name || name=="") {
	namediv.attr("class","long_name")
	namediv.html(address);
    } else {
	namediv.html(name);
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

	$("#nominations")
	    .append($('<tr>')
		    .append($('<td>').attr('id',validator+'_icon'))
		    .append($('<td>').attr('id',validator+'_id'))
		    .append($('<td>').attr('id',validator+'_percent')
			    .html("..."))
		    .append($('<td>').attr('id',validator+'_count')
			    .html("0"))
		    .append($('<td>').attr('id',validator+'_splits')
			    .html("high"))
		   );
	
	await displayAccount(
	    $('#'+validator+'_icon'),
	    $('#'+validator+'_id'),
	    validator,showAccountName)
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

const update_apy = (total_payout,num_eras) => {
    if (balance && balance>0) {
	// balance is (bonded) amount we have *now*
	// get the percentage of this that we know comes from payouts
	let payout_percent=(total_payout/balance)*100
	// get this as average per era
	payout_percent/=num_eras
	// multiply up to number of eras in a year
	let eras_per_day = 4
	let apy = payout_percent*eras_per_day*365    
	$("#apy").html(apy.toFixed(2)+"%")
    }
}


const updateNominations = (stats,nominations) => {
    let total = 0
    for (let validator in nominations) {
	total+=nominations[validator].total
    }

    var el = document.getElementById('total');
    el.innerHTML=stats.weekly_total/1e12+" KSM"

    update_apy(stats.weekly_total,stats.num_eras)

    for (let validator in nominations) {
	let n = nominations[validator]
	n.percent = (n.total/total)*100
	
	$('#'+validator+'_percent').html(n.percent.toFixed(2)+"%")
	$('#'+validator+'_count').html(n.count)
	if (n.splits==0) {
	    $('#'+validator+'_splits').html("high")
	} else {
	    if (n.splits==n.count) {
		$('#'+validator+'_splits').html("low")
	    } else {
		$('#'+validator+'_splits').html("medium")
	    }
	}	
    }

    sort.sortTable("nominations",2)
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
		    let args = call.call_args
		    if (!args) args = call.params
		    let validator=findValidatorInParams(args)
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
    let stash_address = $("#stash_address").val()
    $("#nominations tbody").empty();
    $("#start").prop('disabled', true);
    $("#status").html("status: searching for controller")

    let a = addr.ss58Decode(stash_address)

    if (!a) {
	$("#status").html("status: address error")
    } else {
	$("#stash_icon").empty();
	$("#stash_icon").append(id.identicon(a, false, 50))

	let account = await api.getSearch(stash_address)
	balance = parseFloat(account.data.account.bonded)    
	
	let controller_addresses = await getControllers(stash_address)

	if (controller_addresses.length==0) {
	    $("#status").html("status: couldn't find controller")
	    return
	}

	$("#nominations tbody").empty();
	$("#status").html("status: loading nominations")
	var el = document.getElementById('nominations');
	let n = []
	for (let c of controller_addresses) {
	    n=n.concat(await getNominations(c))
	}
	
	if (n.length==0) {
	    $("#status").html("status: no nominations found")
	    return
	}
	
	nominations = await renderNominations(el, n, true);	
	$("#status").html("status: loading rewards")
	var el = document.getElementById('reward-slash');
	await displayStaking(el,stash_address,nominations)
	$("#status").html("status: finished")
    }
}
    
// connect up the things
$("#stash_address").change(stashAddr);
