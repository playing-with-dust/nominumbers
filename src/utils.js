const fromHexString = hexString =>
	  new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const toHexString = byteArray => {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { fromHexString, toHexString, sleep };
