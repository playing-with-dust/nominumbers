# nominumbers

Kusama is a non-extinction causing cryptocurrency, part of the
Polkadot network. Instead of 'miners' using energy to validate
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

[Try it here](https://playing-with-dust.github.io/nominumbers/)
 
* Complaints -> hegimonic_philosophy@protonmail.com
* Problems -> [Issues](https://github.com/playing-with-dust/nominumbers/issues)
* Support -> FLzgz4qt5foC1DXRHQQwC2cLwu39eGkhx93x7UsM5uniBvM

## Building

    $ npm install
    $ browserify -p esmify src/index.js -o bundle.js

x

