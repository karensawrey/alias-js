const express = require('express');
const redis = require('./redis.js');
const {authed, asyncMiddleware} = require('./utils.js');

class SeedManager {
    constructor(timeout) {
        this.timeout = timeout;
        this._seed = [0, null];
        this._prevSeed = [0, null];
    }

    get seed() {
        const now = new Date();
        const age = now - this._seed[0];

        if (age >= this.timeout) {
            this._prevSeed = this._seed;
            this._seed = [now, chain.seed()];
        }

        return this._seed[1];
    }

    isValid(seed) {
        const now = new Date();

        return (
            (now - this._seed[0] < this.timeout && sodium.memcmp(this._seed[1], seed)) ||
            (now - this._prevSeed[0] < 2 * this.timeout && sodium.memcmp(this._prevSeed[1], seed))
        );
    }
};

const loginSeed = new SeedManager(10000); // seed changed every 10s

const app = express.Router();

app.get('/', authed, (req, res) => {
    res.status(200).send({
        status: "ok",
        publicKey: req.session.publicKey
    });
});

app.get('/seed', (req, res) => {
    res.status(200).send(chain.toJSON(loginSeed.seed));
});

app.post('/login', (req, res) => {
    try {
        const proof = chain.fromToken(req.body.token);
        if (proof.type != 'anychain.signature') {
            throw "bad proof: not a signature";
        }

        if (!loginSeed.isValid(proof.body)) {
            throw "bad proof: seed not valid";
        }

        req.session.publicKey = chain.toJSON(proof.signer);
        res.status(200).send({"status": "ok"});
    } catch(e) {
        res.status(400).send({"status": "error", "reason": e});
    }
});

app.post('/logout', (req, res) => {
    delete req.session.publicKey;
    res.status(200).send();
});

app.post('/clear', authed, (req, res) => {
    if (!req.session.publicKey) {
        return res.status(200).send();
    }

    redis.db.del(redis.key("user", req.alias.publicKey)).then(() => {
        delete req.session.publicKey;
        res.status(200).send();
    });
});

app.get('/meta', authed, asyncMiddleware(async (req, res) => {
    const blob = await redis.db.get(redis.key("user", req.alias.publicKey, "meta"));
    const data = blob ? JSON.parse(blob) : {};
    res.status(200).send(data);
}));

app.post('/meta', authed, asyncMiddleware(async (req, res) => {
    const data = req.body;
    const blob = JSON.stringify(data);
    await redis.db.set(redis.key("user", req.alias.publicKey, "meta"), blob);
    res.status(200).send(data);
}));

module.exports = app;
