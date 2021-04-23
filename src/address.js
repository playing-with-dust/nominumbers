const bs58 = require('bs58')
const {blake2b} = require('blakejs')

const ss58Encode = (address) => {
	if (address.length != 32) {
		return null
	}
	let bytes = new Uint8Array([2, ...address])
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
	if (a[0] == 2) {
		if (a.length == 32 + 1 + 2) {
			let address = a.slice(0, 33)
			let pre = Buffer.from([0x53, 0x53, 0x35, 0x38, 0x50, 0x52, 0x45]);
			let hash = blake2b(Buffer.concat([pre,address]))
			if (a[33] == hash[0] && a[34] == hash[1]) {
				return address.slice(1)
			} else {
				// invalid checksum
				console.log(1);
				return null
			}
		} else {
			// Invalid length.
			console.log(2);
			return null
		}
	} else {
		// Invalid version.
		console.log(3);
		return null
	}
}

export { ss58Encode, ss58Decode };

