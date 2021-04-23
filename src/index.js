const nn = require('./app.js')
const api = require('./api.js')
const jQuery = require("jquery")
const id = require('./identicon.js')
const addr = require('./address.js')
const utils = require('./utils.js')

var stash_address = ""
var controller_address = ""

const stashAddr = async () => {
	stash_address = jQuery("#stash_address").val()
	let a = addr.ss58Decode(stash_address)	
	if (!a) {
		jQuery("#status").html("status: address error")
	} else {
		jQuery("#stash_icon").append(id.identicon(a, false, 50))
		controller_address = await api.getController(stash_address)
		if (!controller_address) {
			jQuery("#status").html("status: couldn't find controller")
		} else {
			jQuery("#start").prop('disabled', false);
		}
	}
}

const run = async () => {
	jQuery("#status").html("status: loading nominations")
	var el = document.getElementById('nominations');
	nominations = await nn.findNominations(el,controller_address)

	jQuery("#status").html("status: loading rewards")
	var el = document.getElementById('reward-slash');
	await nn.displayStaking(el,stash_address,nominations)
	jQuery("#status").html("status: finished")
}

// connect up the things
jQuery("#stash_address").change(stashAddr);
jQuery("#start").click(run);

