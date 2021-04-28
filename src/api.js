const bs58 = require('bs58')
const {blake2b} = require('blakejs')
const {ss58Encode, ss58Decode} = require('./address.js')
const {identicon} = require('./identicon.js')
const {fromHexString,sleep} = require('./utils.js')
const jQuery = require("jquery")

var max_calls = 25 // don't ddos subscan

const callApi = async (url,body,fn) => {
    console.log("calling: "+url)
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
            const fetchResponse = await fetch(`https://kusama.api.subscan.io/api/`+url, settings);
            data = await fetchResponse.json();
	    result = true
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

const getStaking = async (address) => {
    return callApi(
	"scan/account/reward_slash",
	{
	    "row": 28,
	    "page": 0,
	    "address": address
	},
	(data) => {
	    const rewards = [];
	    console.log("rewards:");
	    console.log(data);

	    for(var i=0; i<data.data.list.length; i++) {
		//let params = JSON.parse(data.data.list[i].params);
		rewards.push({
		    "event_index": data.data.list[i].event_index,
		    "event_idx": data.data.list[i].event_idx,
		    "amount": data.data.list[i].amount,
		    "extrinsic_hash": data.data.list[i].extrinsic_hash,
		});				
	    }		
	    return rewards;
	});
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

export {
    getStaking,
    getTransfers, 
    getBonded,
    getEvent, 
    getSearch, 
    getExtrinsic,
    getExtrinsics
}
