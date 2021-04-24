const bs58 = require('bs58')
const {blake2b} = require('blakejs')
const {ss58Encode, ss58Decode} = require('./address.js')
const {identicon} = require('./identicon.js')
const {fromHexString,sleep} = require('./utils.js')
const jQuery = require("jquery")


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
	    console.log("rewards:");
	    console.log(data);

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
	(data) => {
	    let ret=[]
	    if (data.data.count<=0) { return null }
	    for (const x of data.data.extrinsics) {
		if (x.call_module_function=="nominate") {
		    let targets = JSON.parse(x.params)[0].value
		    console.log(targets)
		    for (let t of targets) {
			ret.push(t.Id)
		    }
		    return ret
		}
	    }
	    return null;
	});
}

const getNominationFromBatch = async (address) => {
    console.log(["nomi batch",address]);
    // todo: handle this (search batched)
    return callApi(
	"scan/extrinsics", {
	    "row": 20,
	    "page": 0,
	    "address": address,
	    "call": "batch_all"
	},
	(data) => {
	    console.log(data);
	    if (data.data.count<1) {
		return null
	    }
	    for (let x of data.data.extrinsics) {
		let params = JSON.parse(x.params);
		console.log(params)
		let calls = params[0].value;
		if (calls) {
		    for (let call of calls) {
			if (call.call_function=="nominate") {
			    for (let arg of call.call_args) {
				if (arg.name=="targets") {
				    return null
				}
			    }
			}
		    }
		}
	    }
	    
	    return null;
	});
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
	    //console.log("looking for controller:");
	    //console.log(data);
	    if (data.data.count>0) {
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
	    } else {
		return null;
	    }});
}


const controllerFromBatchData = (data) => {
    if (data.data.count<1) {
	return null
    }
    for (let x of data.data.extrinsics) {
	let params = JSON.parse(x.params);
	let calls = params[0].value;
	if (calls) {
	    for (let call of calls) {
		if (call.call_function=="set_controller" ||
		    call.call_function=="bond") {
		    for (let arg of call.call_args) {
			if (arg.name=="controller") {
			    if (arg.value.Id) {
				return ss58Encode(fromHexString(arg.value.Id))
			    } else {
				return ss58Encode(fromHexString(arg.value))
			    }
			}
		    }
		}
	    }
	}
    }	    
    return null;
}

const getControllerFromBatchAll = async (address) => {
    return callApi(
	"scan/extrinsics", {
	    "row": 20,
	    "page": 0,
	    "address": address,
	    "call": "batch_all"
	}, 
	(data) => {
	    return controllerFromBatchData(data);
	});
}

const getControllerFromBatch = async (address) => {
    return callApi(
	"scan/extrinsics", {
	    "row": 20,
	    "page": 0,
	    "address": address,
	    "call": "batch"
	},
	(data) => {
	    return controllerFromBatchData(data);
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
    getNominationFromBatch,
    getController,
    getControllerFromBatch,
    getControllerFromBatchAll,
    getExtrinsics
}
