const api = require('./api.js')
const $ = require("jquery")
const id = require('./identicon.js')
const addr = require('./address.js')
const utils = require('./utils.js')
const search = require('./search.js')
const sort = require('./sort.js')
const prices = require('./prices.js')
const csv = require('./table-export.js')
const eras = require('./eras.js')

var balance = 0
var balance_currency = 0
var token="KSM"
var num_eras=28
var list_of_eras = []

const zeroPad = (num, places) => String(num).padStart(places, '0')

const timeStampToString = (unix_timestamp) => {
    let a = new Date(unix_timestamp * 1000);    
    let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let year = a.getFullYear();
    let month = months[a.getMonth()];
    let date = a.getDate();
    let hour = zeroPad(a.getHours(),2);
    let min = zeroPad(a.getMinutes(),2);
    let sec = zeroPad(a.getSeconds(),2);
    return [date + ' ' + month + ' ' + year,
	    hour + ':' + min + ':' + sec]
}

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

	    // we can stop collecting nominations once we find
	    // one before the start era we are collecting rewards for
	    let nomination_time = new Date(r.time * 1000);
	    console.log(nomination_time)
	    if (nomination_time<eras.start_date) {		
		return ret;
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

// store these so we can avoid looking them up all the time
const validatorIdentities = {}

const getValidatorIdentity = (address) => {
    let name = validatorIdentities[address];
    if (name==undefined) {
	return "<span class='long_name'>"+address+"</span>"
    } else {
	return name
    }
}

const displayAccount = async (icondiv,namediv,address,showName) => {
    icondiv.append(id.identicon(addr.ss58Decode(address), false, 30))	
    icondiv.click(() => { copyToClipboard(address) })

    let account
    let name
    if (showName) {
	account = await api.getSearch(address)
	name = account.data.account.account_display.display
	if (name=="") {
	    name = account.data.account.account_display.account_index
	}
    }
    if (!name || name=="") {
	namediv.attr("class","long_name")
	namediv.html(address);
    } else {
	validatorIdentities[address]=name
	namediv.html(name);
    }
}

const renderNominations = async (div,n,showAccountName) => {
    let nominations = {}
    for (let validator of n) {
	if (!nominations[validator]) {
	    nominations[validator]={
		total: 0,
		count: 0,
		percent: 0,
		splits: 0,
	    }

	    $("#nominations")
		.append($('<tr>')
			.append($('<td>')
				.attr('id',validator+'_icon')
				.attr('class','icon'))
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
    }
    return nominations;
}

const findValidatorInParams = (params) => {
    let validator_stash
    let era
    for (const p of params) {		
	if (p.name=="validator_stash") {
	    validator_stash=utils.fromHexString(p.value)
	}
	if (p.name=="era") {
	    era=p.value
	}
    }
    if (validator_stash) {
	return [addr.ss58Encode(validator_stash),era]
    }
    return null;
}

const updateAPY = (total_payout,num_eras) => {
    if (balance && balance>0) {
	// balance is (bonded) amount we have *now*
	// get the percentage of this that we know comes from payouts
	let payout_percent=(total_payout/balance)*100
	// get this as average per era
	payout_percent/=num_eras
	// multiply up to number of eras in a year
	let eras_per_day = 4
	if (token=="DOT") eras_per_day = 1
	let apy = payout_percent*eras_per_day*365    
	$("#apy").html(apy.toFixed(2)+"%")
    }
}


const updateNominations = (stats,nominations) => {
    let total = 0
    for (let validator in nominations) {
	total+=nominations[validator].total
    }

    let el = document.getElementById('total');
    if (network=="dot") {
	el.innerHTML=stats.weekly_total/1e10+" "+token
    } else {
	// right for westend too??
	el.innerHTML=stats.weekly_total/1e12+" "+token
    }

    updateAPY(stats.weekly_total,stats.num_eras)

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

const addToDetails = async (timestamp,amount,probable_validators,network) => {
    let t = timeStampToString(timestamp)

    // convert from plancks, which is what we use everywhere else
    let p = amount/1e12
    if (network=="dot") {
	p = amount/1e10
    }
    
    let price = await prices.priceAt(timestamp,$("#currency").val())
    let currency = $("#currency").val().toUpperCase()
    balance_currency += price*p
    $("#total-currency").html(prices.rounding(balance_currency).toFixed(2)+" "+currency)
    
    $("#details")
	.append($('<tr>')
		.append($('<td>').html(t[0]))
		.append($('<td>').html(t[1]))
		.append($('<td>').html(p+" "+token))
		.append($('<td>').html(prices.rounding(p*price).toFixed(2)+" "+currency))
		.append($('<td>').html(prices.rounding(price).toFixed(2)+" "+currency))
		.append($('<td>').html(probable_validators.reduce((str,v) => {
		    return str+getValidatorIdentity(v.addr)+"<br>eras: "+v.eras.join(", ")+" <br>"
		},""))))
}

const displayStaking = async (div,stash_address,nominations,num_eras) => {
    let x = await api.getStaking(stash_address,num_eras);

    const stats = { weekly_total: 0, num_eras: 0 };

    if (x.length<1) {
	displayError("No rewards found.");
    }

    for (const r of x) {
	// get the transaction detail of this reward
	let y = await api.getExtrinsic(r.extrinsic_hash);
	
	stats.weekly_total += parseInt(r.amount)
	stats.num_eras += 1
	let probable_validators = []

	// check the reward time - it's possible if we just ask for the
	// most recent extrinsics, some or all may have happened before
	// the specified start time
	let reward_time = new Date(y.data.block_timestamp * 1000);
	if (reward_time>=eras.start_date) {			
	    // payout extrinsics contain nominator addresses in their params
	    // (validator_stash), we need to deal with batched payouts too
	    if (y.data.call_module_function=="batch" ||
		y.data.call_module_function=="batch_all") {
		// we need to filter the validators to find the ones we
		// have actually nominated previously
		let unique = {}
		// a list of mutltiple calls
		for (let calls of y.data.params) {
		    for (let call of calls.value) {
			let args = call.call_args
			if (!args) args = call.params
			let [addr,era]=findValidatorInParams(args)
			// validators can appear more than once
			if (!unique[addr]) {
			    unique[addr]=[era]
			} else {
			    // add different era to same validator
			    unique[addr].push(era)
			}
		    }
		}

		// count the number of nominations we have
		let count=0
		for (let addr in unique) {
		    if (nominations[addr]) {
			count+=1;
		    }
		}
		
		for (let addr in unique) {
		    if (nominations[addr]) {
			let n = nominations[addr]
			// biggest mystery is whether we can get which validator is our one
			// if we have nomiated multiple in this set, then split the amount
			// between them equally (for the moment)
			n.total+=parseInt(r.amount)/count
			if (count>1) {
			    n.splits+=1
			}
			n.count+=1
			updateNominations(stats,nominations)
			probable_validators.push({addr:addr, eras: unique[addr]})
		    }
		}
	    } else {
		// or a single validator stash - easy!
		let [addr,era]=findValidatorInParams(y.data.params)
		let n = nominations[addr]
		if (n) {
		    n.total+=parseInt(r.amount)					
		    n.count+=1
		    updateNominations(stats,nominations)
		    probable_validators.push({addr:addr, eras: [era]})
		}
	    }
	
	    await addToDetails(y.data.block_timestamp,r.amount,probable_validators)
	}

    }
}

const displayError = (err) => {
    $("#working").css("display","none")
    $("#start").css("display","block")
    $("#error")
	.css("display","block")
	.html(err)
}

const displayDone = (err) => {
    $("#working").css("display","none")
    $("#start").css("display","block")
    $("#error")
	//.css("background","green")
	.css("display","block")
	.html(err)
}

const start = async () => {
    $("#error").css("display","none")
    $("#working").css("display","block")
    $("#start").css("display","none")
    
    let network = $("#network").val()
    addr.setNetwork(network)
    api.setNetwork(network)
    token=network.toUpperCase()
    prices.setToken(network)

    
    let stash_address = $("#stash_address").val()
    $("#nominations tbody").empty();
    $("#details tbody").empty();
    //$("#start").prop('disabled', true);

    let a = addr.ss58Decode(stash_address)

    if (!a) {
	displayError("Address error (check the network is correct?)")
	return
    } else {
	$("#stash_icon").empty();
	$("#stash_icon").append(id.identicon(a, false, 50))

	let account = await api.getSearch(stash_address)
	balance = parseFloat(account.data.account.bonded)    
	
	let controller_addresses = await getControllers(stash_address)

	if (controller_addresses.length==0) {
	    displayError("Can't find controller account for this address")
	    return
	}

	$("#nominations tbody").empty();

	let el = document.getElementById('nominations');
	let n = []
	for (let c of controller_addresses) {
	    n=n.concat(await getNominations(c))
	}
	
	if (n.length==0) {
	    displayError("No nominations found")
	    return
	}
	
	let nominations = await renderNominations(el, n, true);	
	
	el = document.getElementById('reward-slash');
	await displayStaking(el,stash_address,nominations,num_eras)
	displayDone("Finished: <a href='#' id='csv'>Download results as CSV</a>")
	$('#csv').click(csvExport);
    }
}

function csvExport() {
    csv.download_table_as_csv('details');
}

function openTab(name) {
  let x = document.getElementsByClassName("tab");
  for (let i = 0; i < x.length; i++) {
      x[i].style.display = "none";
  }
  document.getElementById(name).style.display = "block";
}

// connect up the things
eras.initDate((eras) => {
    num_eras=eras
}, $("#network").val())

$("#network").change(() => {
    eras.update((eras) => {
	num_eras=eras
    }, $("#network").val())
})

$('#start').click(start);

$("#nominations-button").click(()=>{
    openTab('nominations-tab');
    //$("#nominations-button").css("background", "#eee");
    //$("#details-button").css("background", "white");
})
$("#details-button").click(()=>{
    openTab('rewards-tab')
    //$("#nominations-button").css("background", "white");
    //$("#details-button").css("background", "#eee");
})
$("#missing-button").click(()=>{
    openTab('missing-tab')
    //$("#nominations-button").css("background", "white");
    //$("#details-button").css("background", "#eee");
})
