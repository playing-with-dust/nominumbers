const ss58 = require('ss58')

callApi = async (url,body,fn) => {
    const location = window.location.hostname;
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
		body: JSON.stringify(body)
	}
    try {
        const fetchResponse = await fetch(`https://kusama.api.subscan.io/api/`+url, settings);
        const data = await fetchResponse.json();
		return fn(data);
    } catch (e) {
        return e;
    }	
}

getStaking = async (address) => {
	return callApi(
		"scan/account/reward_slash",
		{
			"row": 20,
			"page": 0,
			"address": address
		},
		(data) => {
			let rewards = []; 
			for(var i=0; i<data.data.list.length; i++) {
				params = JSON.parse(data.data.list[i].params);
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

getEvent = async (event_index) => {
	return callApi(
		"scan/event", { "event_index": event_index },
		(data) => {
			console.log(data);

			
			return data;
		});
}

getSearch = async (key) => {
	return callApi(
		"scan/search", { "key": key },
		(data) => { return data; });
}

getEx = async (key) => {
	return callApi(
		"scan/extrinsic", { "extrinsic_index": key },
		(data) => { return data; });
}

/* 
   todo: 
   - hex -> address 
   - address -> itenticon
*/


async function run() {
	var x = await getStaking("HTw3PE3FMWnPsZEgM87v6Whp2QxXmj6mCp4vqtujQ6xjrYq");
	console.log(x[0]);

	//var y = await getSearch(x[0]["extrinsic_hash"])
	//console.log(y);
	//console.log(y.data.event[x[0]["event_idx"]-1]);
	//7078762-1

	console.log(ss58_encode("ec496735eca64ceabe80e911ddbad8c072ac5b69d3d88ed8dada02a9cf5c66c8"))
	
	var y = await getEx("7078762-1")
	console.log(y);
	console.log(y.data.params[0].value[event[x[0]["event_idx"]-1]]);
}

run();


