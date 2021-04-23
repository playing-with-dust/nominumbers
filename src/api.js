const bs58 = require('bs58')
const {blake2b} = require('blakejs')
const {ss58Encode, ss58Decode} = require('./address.js')
const {identicon} = require('./identicon.js')
const {fromHexString,sleep} = require('./utils.js')


const callApi = async (url,body,fn) => {
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
        const data = await fetchResponse.json();
		// we have to throttle the bandwidth
		return fn(data);
    } catch (e) {
        return e;
    }	
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
			for(var i=0; i<data.data.list.length; i++) {
				let params = JSON.parse(data.data.list[i].params);
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
			"row": 20,
			"page": 0,
			"address": address
		},
		(data) => { return data; });
}

const getNomination = async (address) => {
	return callApi(
		"scan/extrinsics", {
			"row": 1,
			"page": 0,
			"address": address,
			"call": "nominate"
		},
		(data) => { return data; });
}

const getController = async (address) => {
	return callApi(
		"scan/extrinsics", {
			"row": 1,
			"page": 0,
			"address": address,
			"call": "bond"
		},
		(data) => {
			let params = JSON.parse(data.data.extrinsics[0].params);
			for (const p of params) {		
				if (p.name=="controller") {
					if (p.value.Id) {
						return ss58Encode(fromHexString(p.value.Id))
					} else {
						return ss58Encode(fromHexString(p.value))
					}
				}
			}
			return null;
		});
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
	getNomination,
	getController,
	getExtrinsics
}
