import '@polkadot/util-crypto'

const keyring = new Keyring();
keyring.setSS58Format(2);	
console.log(keyring.decodeAddress('5CSbZ7wG456oty4WoiX6a1J88VUbrCXLhrKVJ9q95BsYH4TZ'));
