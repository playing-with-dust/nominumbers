const base_url = "https://api.coingecko.com/api/v3/"
var historical = "coins/kusama/history"

const setToken = (token) => {
    let s = "kusama"
    if (token=="dot") s="polkadot"
    if (token=="wnd") s="westend"
    historical = "coins/"+s+"/history"
}

const priceURL = (date) => {
    return base_url+historical+"?date="+date
}

const timestampToDate = (time) => {
    let date = new Date(time*1000)
    return date.getDate().toString().padStart(2,"0")+"-"
	+(date.getMonth()+1).toString().padStart(2,"0")+"-"
	+date.getFullYear()
}

const rounding = (num) => {
    // todo: possibly incorrect
    return Math.round((num + Number.EPSILON) * 100) / 100
}

const priceAt = async (timestamp,currency) => {
    if (historical=="coins/westend/history") return 0
    let date = timestampToDate(timestamp)
    let data
    let result = false
    try {
        const fetchResponse = await fetch(priceURL(date))
        data = await fetchResponse.json()
	result = true
    } catch (e) {
	console.log("error talking to coingecko");
	console.log(e);
    }
    if (result) {
	let r = data["market_data"]["current_price"][currency]
	if (r == undefined) {
	    console.log("problem parsing coingecko: "+data)
	}
	return r;
    }
}

export {
    setToken,
    priceAt,
    rounding
}
