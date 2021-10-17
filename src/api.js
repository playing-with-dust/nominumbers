const bs58 = require('bs58')
const {blake2b} = require('blakejs')
const {ss58Encode, ss58Decode} = require('./address.js')
const {identicon} = require('./identicon.js')
const {fromHexString,sleep} = require('./utils.js')
const jQuery = require("jquery")

var max_calls = 25 // don't ddos subscan

var network_api = "kusama"

const setNetwork = (network) => {
    network_api = "kusama"
    if (network=="dot") network_api="polkadot"
    if (network=="wnd") network_api="westend"
}

const callApi = async (url,body,fn) => {
    // we have to throttle the bandwidth
    await sleep(300);
    let data
    let result=false
    let num_tries=0
    while (!result && num_tries<max_calls) {
	const location = window.location.hostname;
	const settings = {
            method: 'POST',
	    mode: 'cors', 
            headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
        },
	    body: JSON.stringify(body)
	}
	try {
            const fetchResponse = await fetch(`https://`+network_api+`.api.subscan.io/api/`+url, settings);
            data = await fetchResponse.json();
	    if (data.message && data.message=="API rate limit exceeded") {
		console.log("rate limit");
		// wait a bit and try again
		await sleep(500);
	    } else {
		result = true
	    }
	} catch (e) {
	    console.log("error talking to subscan");
	    console.log(e);
	    // wait a bit and try again
	    await sleep(500);
	}
	if (result) {
	    return fn(data);
	}
	num_tries+=1
    }
    return null
}

const getStaking = async (address,eras) => {
    let max_rows = 100
    let page = 0
    let npages = Math.floor(eras/max_rows)
    let rewards = []   

    while (page<=npages) {	
	await callApi(
	    "scan/account/reward_slash",
	    {
		"row": max_rows,
		"page": page,
		"address": address
	    },
	    (data) => {
		if (data.data.list!=null) {	    
		    for(let i=0; i<data.data.list.length; i++) {
			if (rewards.length<eras) {
			    rewards.push({
				"event_index": data.data.list[i].event_index,
				"event_idx": data.data.list[i].event_idx,
				"amount": data.data.list[i].amount,
				"extrinsic_hash": data.data.list[i].extrinsic_hash,
			    });
			}
		    }
		}
	    });

	page+=1
    }
    return rewards;
}

const getTransfers = async (address) => {
    return callApi(
	"scan/transfers", {
	    "row": 20,
	    "page": 0,
	    "address": address
	},
	(data) => { return data; });
}

const getBonded = async (address) => {
    return callApi(
	"wallet/bond_list", {
	    "row": 20,
	    "page": 0,
	    "status": "bonded",
	    "address": address
	},
	(data) => { return data; });
}

const getEvent = async (event_index) => {
    return callApi(
	"scan/event", { "event_index": event_index },
	(data) => { return data; });
}

const getSearch = async (key) => {
    return callApi(
	"scan/search", { "key": key },
	(data) => { return data; });
}

const getExtrinsics = async (address) => {
    return callApi(
	"scan/extrinsics", {
	    "row": 100,
	    "page": 0,
	    "address": address
	},
	(data) => { return data; });
}


const getExtrinsic = async (hash) => {
    return callApi(
	"scan/extrinsic", {
	    "hash": hash
	},
	(data) => { return data; });
}

const getPrice = async (timestamp) => {
    return callApi(
	"open/price", {
	    "time": timestamp
	},
	(data) => {
	    return parseFloat(data.data.price);
	});
}

export {
    setNetwork,
    getStaking,
    getTransfers, 
    getBonded,
    getEvent, 
    getSearch, 
    getExtrinsic,
    getExtrinsics,
    getPrice
}
