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
    jQuery("#nominations").empty();
    jQuery("#start").prop('disabled', true);
    jQuery("#status").html("status: searching for controller")
    let a = addr.ss58Decode(stash_address)	
    if (!a) {
	jQuery("#status").html("status: address error")
    } else {
	jQuery("#stash_icon").empty();
	jQuery("#stash_icon").append(id.identicon(a, false, 50))
	controller_address = await api.getController(stash_address)
	if (!controller_address) {
	    console.log("searching in batch for controller")
	    // try another approach
	    await utils.sleep(1000); 
	    controller_address = await api.getControllerFromBatch(stash_address)
	    if (!controller_address) {
		jQuery("#status").html("status: couldn't find controller")
		return
	    }
	}
	jQuery("#status").html("status: ready")
	jQuery("#start").prop('disabled', false);
	console.log(controller_address);
    }
}

const run = async () => {
    jQuery("#nominations").empty();
    jQuery("#status").html("status: loading nominations")
    var el = document.getElementById('nominations');
    nominations = await nn.findNominations(el,controller_address,false)
    console.log(nominations);
    if (nominations) {
	jQuery("#status").html("status: loading rewards")
	var el = document.getElementById('reward-slash');
	await nn.displayStaking(el,stash_address,nominations)
	jQuery("#status").html("status: finished")
    }
}

// connect up the things
jQuery("#stash_address").change(stashAddr);
jQuery("#start").click(run);

