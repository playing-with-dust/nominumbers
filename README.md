# nominumbers

[Kusama](https://kusama.network) is a non-extinction causing cryptocurrency, part of the
[Polkadot network](https://polkadot.network/). Instead of 'miners' using energy to validate
transactions as in Bitcoin, the community 'nominates' trustworthy
'validators' (that work efficiently using ordinary servers) and
who redistribute a small share of their awards to their nominators in
return.

There is a lot of information on how to choose validators but not so
much on judging how they have actually done in relation to your
specific nomination choices - this is just an experiment trying to do
something like that. Each nomination is loaded and a percentage of
your payout is shown next to them. This might make it easier to tune
and select a good mix of nominations, but isn't really a judgement on
the validators performance.

The algorithm is not perfect as it can be difficult to follow the
trail in retrospect - sometimes payouts are batched and more than one
of your nominated validators will be present in the transaction, I
haven't figured out if you can tell which one was active for you in
that era. In this case we divide the payout equally and lower a
"confidence" metric as we can't be sure - mainly we want to see
nominations that are not activated much, so perhaps this doesn't
matter.

## Try it

* [Github hosted](https://playing-with-dust.github.io/nominumbers/)
* (IPFS for v1.0 soon)

## Run nominumbers locally

1. [Download the zip](https://github.com/playing-with-dust/nominumbers/archive/refs/heads/production.zip).
2. Extract to your device.
3. Point your browser at `nominumbers-production/index.html`.

## Release info

### v1.0rc1

* Added support for polkadot and westend
* Currency conversion for USD/EUR/GBP: totals, reward and daily prices added
* Download report as CSV file for tax calculations
* User definable/arbitrary start time
* Automatically collects validators nominated during the specified time period
* Added batch_all payout support

(IPFS hash coming soon)

### v0.4

* Added reward info including possible eras (towards income tax calculations)
* Added "click on icon = address to copy buffer" feature
* Fixed extrinsic parsing when params is an empty string
* Fixed percentage in batch calls (was % of all validators in payout, not nominations)

* [IPFS](https://gateway.ipfs.io/ipns/k51qzi5uqu5dib1fq1xzstlnsbrv032lqe40iesofk0ioquvojjutvkqddgdqw)
* [Cloudflare IPFS](https://cloudflare-ipfs.com/ipns/k51qzi5uqu5dib1fq1xzstlnsbrv032lqe40iesofk0ioquvojjutvkqddgdqw)
* IPFS hash: k51qzi5uqu5dib1fq1xzstlnsbrv032lqe40iesofk0ioquvojjutvkqddgdqw

## Building

    $ npm install
    $ browserify -p esmify src/index.js -o bundle.js

* Complaints -> playing_with_dust@protonmail.com
* Problems -> [Issues](https://github.com/playing-with-dust/nominumbers/issues)

This project is kindly supported by the [Kusama Treasury](https://kusama.subscan.io/treasury_tip/0xf22af71734034b6fea46fcde7df56ead363beed687eb55e26a84691171d755aa)
