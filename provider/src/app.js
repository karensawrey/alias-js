const express = require('express');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
const sodium = require('libsodium-wrappers');
const Anychain = require('@alias/anychain');

const fs = require('fs');
const {google} = require('googleapis');

const app = express()
const listenPort = parseInt(process.env.ALIAS_AUTHZ_PORT) || 8080;

const chain = new Anychain();

const gdriveCredentialsPath = "./secret/credentials.json";
const userDb = require('./userdb.js');

app.use(require('body-parser')());

function getDriveOAuth2(token, cb) {
    fs.readFile(gdriveCredentialsPath, (err, content) => {
        if (err) {
            return cb("no credentials");
        }

        const {client_secret, client_id, redirect_uris} = JSON.parse(content).web;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        if (!!token) {
            oAuth2Client.setCredentials(token);
        }

        cb(null, oAuth2Client);
    });
}

app.get('/api/gdrive/link', (req, res) => {
    getDriveOAuth2(null, (err, oAuth2Client) => {
        if (err) {
            return res.status(500).send({error: err});
        }

        //oAuth2Client.setCredentials(JSON.parse(token));

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/drive.readonly',
            ]
        });

        res.redirect(authUrl);
    });
});

app.post('/api/gdrive/list', (req, res) => {
    const token = req.body.token;
    const args = req.body.args;

    getDriveOAuth2(req.body.token, (err, auth) => {
        if (err) {
            return res.status(500).send({error: "could not get Google OAuth2 client", reason: err});
        }

        const drive = google.drive({version: 'v3', auth});
        drive.files.list(args, function(err, r) {
            if (err) {
                return res.status(500).send({error: "cannot get file list", reason: err});
            }

            res.send({files: r.data.files});
        });
    });
});

app.get('/api/gdrive/cb/', (req, res) => {
    getDriveOAuth2(null, function(err, oAuth2Client) {
        if (err) {
            return res.status(500).send({error: err});
        }

        const code = req.query.code;
        if (!code) {
            return res.status(400).send({error: "no code"});
        }

        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                return res.status(500).send({error: "error retrieving access token", reason: err});
            }

            const url = "/gdrive/cb/?token=" + encodeURIComponent(JSON.stringify(token));
            res.redirect(url);
        });
    });
});

app.get('/alias/', cors(), (req, res) => {
    res.send({
        what: "alias authz server",
        reqPath: "/request",
    });
});

// User box management

const userBasicAuth = basicAuth({
    authorizer: (username, pwd, cb) => {
        userDb.get(username, pwd).then(
            (v) => cb(null, true),
            (e) => cb(null, false)
        );
    },
    authorizeAsync: true,
});

app.get('/alias/user', userBasicAuth, (req, res) => {
    userDb.get(req.auth.user, req.auth.password).then((v) => {
        if(v) {
            res.send(v);
        } else {
            res.status(404).send();
        }
    });
});

app.put('/alias/user', userBasicAuth, (req, res) => {
    const box = req.body.box;
    if (!box) {
        return res.status(400).send();
    }

    userDb.put(req.auth.user, req.auth.password, box).then(() => res.send());
});

app.delete('/alias/user', userBasicAuth, (req, res) => {
    userDb.del(req.auth.user, req.auth.password).then((wasDeleted) => {
        if (wasDeleted) {
            res.send()
        } else {
            res.status(404).send();
        }
    });
});

app.use('/', express.static('static'))

sodium.ready.then(() => {
    app.listen(listenPort, () => console.log(`Example app listening on port ${listenPort}!`))
});
