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
your payout over the last ~7 days (28 eras) is shown next to
them. This might make it easier to tune and select a good mix of
nominations, but isn't really a judgement on the validators
performance.

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
* [IPFS](https://gateway.ipfs.io/ipns/k51qzi5uqu5dib1fq1xzstlnsbrv032lqe40iesofk0ioquvojjutvkqddgdqw)
* [Cloudflare IPFS](https://cloudflare-ipfs.com/ipns/k51qzi5uqu5dib1fq1xzstlnsbrv032lqe40iesofk0ioquvojjutvkqddgdqw)

IPFS hash: k51qzi5uqu5dib1fq1xzstlnsbrv032lqe40iesofk0ioquvojjutvkqddgdqw

## Run nominumbers locally

1. [Download the zip](https://github.com/playing-with-dust/nominumbers/archive/refs/heads/production.zip).
2. Extract to your device.
3. Point your browser at `nominumbers-production/index.html`.

## Notes:

* APY is an estimate - e.g. if your bonded value has changed in the
  last 28 eras it will be incorrect.
* Currently nominumbers loads all nominations found - this is partly a
  debug	measure to make sure we capture all rewards. The fix will be to
  reduce this to the last nomination call and any others in the past
  week (see [#7](https://github.com/playing-with-dust/nominumbers/issues/7)). 
 
## Building

    $ npm install
    $ browserify -p esmify src/index.js -o bundle.js

* Complaints -> playing_with_dust@protonmail.com
* Problems -> [Issues](https://github.com/playing-with-dust/nominumbers/issues)
* Support -> FLzgz4qt5foC1DXRHQQwC2cLwu39eGkhx93x7UsM5uniBvM

This project is kindly supported by the [Kusama Treasury](https://kusama.subscan.io/treasury_tip/0xf22af71734034b6fea46fcde7df56ead363beed687eb55e26a84691171d755aa)
