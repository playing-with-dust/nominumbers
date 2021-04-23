const {blake2b} = require('blakejs')
const {ss58Encode, ss58Decode} = require('./address.js')

const identicon = (addr, sixPoint, size) => {
	let s = 64
	let c = s / 2
	let r = sixPoint ? s / 2 / 8 * 5 : (s / 2 / 4 * 3)
	let rroot3o2 = r * Math.sqrt(3) / 2
	let ro2 = r / 2
	let rroot3o4 = r * Math.sqrt(3) / 4
	let ro4 = r / 4
	let r3o4 = r * 3 / 4

	let zero = blake2b(new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]))

	let z = s / 64 * 5
	let schema = {
		target: { freq: 1, colors: [0, 28, 0, 0, 28, 0, 0, 28, 0, 0, 28, 0, 0, 28, 0, 0, 28, 0, 1] },
		cube: { freq: 20, colors: [0, 1, 3, 2, 4, 3, 0, 1, 3, 2, 4, 3, 0, 1, 3, 2, 4, 3, 5] },
		quazar: { freq: 16, colors: [1, 2, 3, 1, 2, 4, 5, 5, 4, 1, 2, 3, 1, 2, 4, 5, 5, 4, 0] },
		flower: { freq: 32, colors: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 3] },
		cyclic: { freq: 32, colors: [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 6] },
		vmirror: { freq: 128, colors: [0, 1, 2, 3, 4, 5, 3, 4, 2, 0, 1, 6, 7, 8, 9, 7, 8, 6, 10] },
		hmirror: { freq: 128, colors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 8, 6, 7, 5, 3, 4, 2, 11] }
	}

	let total = Object.keys(schema).map(k => schema[k].freq).reduce((a, b) => a + b)
	let findScheme = d => {
		let cum = 0
		let ks = Object.keys(schema)
		for (let i in ks) {
			let n = schema[ks[i]].freq
			cum += n;
			if (d < cum) {
				return schema[ks[i]]
			}
		}
		throw "Impossible"
	}

	var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	svg.setAttributeNS(null, 'width', size)
	svg.setAttributeNS(null, 'height', size)
	svg.setAttributeNS(null, 'viewBox', '0 0 64 64')
	
	let id = typeof addr == 'string' ? ss58Decode(addr) : addr
	if (!(typeof id == 'object' && id && id instanceof Uint8Array && id.length == 32)) {
		console.log("didn't work");
		console.log(id);
		return svg
	}

	let ss = ss58Encode(id);
	id = Array.from(blake2b(id)).map((x, i) => (x + 256 - zero[i]) % 256)

	let sat = (Math.floor(id[29] * 70 / 256 + 26) % 80) + 30
	let d = Math.floor((id[30] + id[31] * 256) % total)
	let scheme = findScheme(d)
	let palette = Array.from(id).map((x, i) => {
		let b = (x + i % 28 * 58) % 256
		if (b == 0) {
			return '#444'
		}
		if (b == 255) {
			return 'transparent'
		}
		let h = Math.floor(b % 64 * 360 / 64)
		let l = [53, 15, 35, 75][Math.floor(b / 64)]
		return `hsl(${h}, ${sat}%, ${l}%)`
	})

	let rot = (id[28] % 6) * 3

	let colors = scheme.colors.map((_, i) => palette[scheme.colors[i < 18 ? (i + rot) % 18 : 18]])

	let addCircle = function(cx,cy,r,fill) {
		var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
		c.setAttributeNS(null, 'cx', cx)
		c.setAttributeNS(null, 'cy', cy)
		c.setAttributeNS(null, 'r', r)
		c.setAttributeNS(null, 'fill', fill)
		svg.appendChild(c)
	}
	
	let i = 0;
//	addCircle(s/2,s/2,s/2,"#eee");
	addCircle(c,c - r,z,colors[i++]);
	addCircle(c,c - ro2,z,colors[i++]);
	addCircle(c - rroot3o4,c - r3o4,z,colors[i++]);
	addCircle(c - rroot3o2, c - ro2, z, colors[i++]);
	addCircle(c - rroot3o4, c - ro4, z, colors[i++]);
	addCircle(c - rroot3o2, c, z, colors[i++]);
	addCircle(c - rroot3o2, c + ro2, z, colors[i++]);
	addCircle(c - rroot3o4, c + ro4, z, colors[i++]);
	addCircle(c - rroot3o4, c + r3o4, z, colors[i++]);
	addCircle(c, c + r, z, colors[i++]);
	addCircle(c, c + ro2, z, colors[i++]);
	addCircle(c + rroot3o4, c + r3o4, z, colors[i++]);
	addCircle(c + rroot3o2, c + ro2, z, colors[i++]);
	addCircle(c + rroot3o4, c + ro4, z, colors[i++]);
	addCircle(c + rroot3o2, c, z, colors[i++]);
	addCircle(c + rroot3o2, c - ro2, z, colors[i++]);
	addCircle(c + rroot3o4, c - ro4, z, colors[i++]);
	addCircle(c + rroot3o4, c - r3o4, z, colors[i++]);
	addCircle(c, c, z, colors[i++]);
	return svg;
}

export { identicon };
