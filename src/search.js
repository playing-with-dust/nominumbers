const jQuery = require("jquery")
const {ss58Encode, ss58Decode} = require('./address.js')
const api = require('./api.js')
const {fromHexString} = require('./utils.js')

var max_depth = 4

// search params :
// {
//   call_function: [a,b],
//   param: [x,y,z]
// }

const searchParams = async (depth,time,call_module,call_function,params,search_params) => {
    let ret=[]
    for (let param of params) {
	// recur into all batch calls
	if ((call_function=="batch" || call_function=="batch_all") &&
	    param.name=="calls") {
	    let count = 0
	    for (let call of param.value) {
		ret = ret.concat(await searchBatchCall(depth,time,call,search_params));
	    }
	}

	// check search condition
	if (search_params.call_function.includes(call_function) &&
	    search_params.param.includes(param.name)) {
	    
	    ret.push({
		time: time,
		value: param.value,
		name: param.name,
		call_function: call_function,
		call_module: call_module
	    });
	}
    }	
    return ret
}

const searchBatchCall = async (depth,time,call,search_params) => {
    if (depth>max_depth) return []
    // sometimes args are params and vice versa
    let args = call.call_args
    if (!args) args = call.params
    return await searchParams(depth+1,
			      time,
			      call.call_module,
			      call.call_function,
			      args,
			      search_params);
}

const searchExtrinsic = async (depth,x,search_params) => {
    if (depth>max_depth) return []

    let args = x.call_args    
    if (!args) args = x.params
    args = JSON.parse(args)
    if (args) {
	return await searchParams(depth,
				  x.block_timestamp,
				  x.call_module,
				  x.call_module_function,
				  args,
				  search_params)
    }
    return []
}

// not actually doing depth search now, but leaving depth
// in in case we turn it on again
const searchAddress = async (depth,address,search_params) => {
    let ret=[]
    if (depth>max_depth) return ret
    let xs = await api.getExtrinsics(address)
    if (xs.data.count>0) {
	for (let x of xs.data.extrinsics) {
	    ret=ret.concat(await searchExtrinsic(depth+1,x,search_params))
	}
    }
    return ret
}

export { searchAddress };
