const bs58 = require('bs58')
const {blake2b} = require('blakejs')

const dot_prefix = 0
const ksm_prefix = 2
const wnd_prefix = 42

var network_prefix = ksm_prefix;

const setNetwork = (network) => {
    network_prefix=ksm_prefix
    if (network=="dot") network_prefix=dot_prefix
    if (network=="wnd") network_prefix=wnd_prefix
}

const ss58Encode = (address) => {
    if (address.length != 32) {
	return null
    }
    let bytes = new Uint8Array([network_prefix, ...address])
    let pre = Buffer.from([0x53, 0x53, 0x35, 0x38, 0x50, 0x52, 0x45]);
    let hash = blake2b(Buffer.concat([pre,bytes]))
    let complete = new Uint8Array([...bytes, hash[0], hash[1]])
    return bs58.encode(complete)
}


const ss58Decode = (address) => {
    let a
    try {
	a = bs58.decode(address)
    }
    catch (e) {
	console.log(e);
	return null
    }
    if (a[0] == network_prefix) {
	if (a.length == 32 + 1 + 2) {
	    let address = a.slice(0, 33)
	    let pre = Buffer.from([0x53, 0x53, 0x35, 0x38, 0x50, 0x52, 0x45]);
	    let hash = blake2b(Buffer.concat([pre,address]))
	    if (a[33] == hash[0] && a[34] == hash[1]) {
		return address.slice(1)
	    } else {
		// invalid checksum
		console.log("invalid address checksum");
		return null
	    }
	} else {
	    // Invalid length.
	    console.log("invalid address length");
	    return null
	}
    } else {
	// Invalid version.
	console.log("invalid address version");
	return null
    }
}

export { ss58Encode, ss58Decode, setNetwork };

