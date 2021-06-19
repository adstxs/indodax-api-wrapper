const request = require('request');
const hmacSHA512 = require('crypto-js/hmac-sha512');

const IDX_PRIVATE_ENDPOINT = "https://indodax.com/tapi";
const IDX_PUBLIC_ENDPOINT = "https://indodax.com/api";

let IS_DEBUGGING = process.env.IS_DEBUGGING;
let IDX_KEY = process.env.IDX_KEY;
let IDX_SECRET = process.env.IDX_SECRET;

let latestNonce = 0;

let objectToQueryString = (payload) => {
    return Object.keys(payload).map(key => `${key}=${payload[key]}`).join('&');
}

let signPayload = (payload) => {

    if (payload === null) {
        throw Error("signPayload parameter {payload} must be filled!");
    }

    if (typeof payload !== 'object') {
        throw Error("signPayload parameter {payload} must be Object!");
    }

    if (IS_DEBUGGING) {
        console.log("signPayload {payload}", payload);
    }

    stringPayload = objectToQueryString(payload);

    if (IS_DEBUGGING) {
        console.log("signPayload {stringPayload}", stringPayload);
    }

    encryptedPayload = hmacSHA512(stringPayload, IDX_SECRET).toString();

    if (IS_DEBUGGING) {
        console.log("signPayload {encryptedPayload}", encryptedPayload);
    }

    return encryptedPayload;

}

let doRequest = (path, callback) => {
    request({
        'method': 'POST',
        'url': IDX_PUBLIC_ENDPOINT + '/' + path,
    }, function(error, response) {
        if (error) {
            console.log("doRequest request error {error}", error);
            if (response.body) {
                console.log("doRequest request error {response} ", response);
            }
            callback(error, null);
        } else {
            try {
                let responsePayload = JSON.parse(response.body);
                callback(null, responsePayload);
            } catch (e) {
                console.log("doRequest request error {response.body} ", response.body)
                callback(e, null);
            }
        }
    });
}

let doRequestEncrypted = (payload, callback) => {

    if (payload === null) {
        throw Error("doRequestEncrypted parameter {payload} must be filled!");
    }

    if (typeof payload !== 'object') {
        console.log(typeof payload);
        throw Error("doRequestEncrypted parameter {payload} must be Object!");
    }

    if (!payload.nonce) {
        process.env.TZ = 'Asia/Singapore'
        payload.nonce = latestNonce + Date.now();
        latestNonce = payload.nonce + 1;
    }

    if (IS_DEBUGGING) {
        console.log("doRequestEncrypted {payload}", payload);
    }

    request({
        'method': 'POST',
        'url': IDX_PRIVATE_ENDPOINT,
        'headers': {
            'Key': IDX_KEY,
            'Sign': signPayload(payload)
        },
        'formData': payload
    }, function(error, response) {

        if (error) {
            console.log("doRequestEncrypted request error {error}", error);
            if (response.body) {
                console.log("doRequestEncrypted request error {response} ", response);
            }
            throw Error(error);
        } else {
            let responsePayload = JSON.parse(response.body);
            if (responsePayload.success !== 1) {
                console.log(responsePayload);
                if (responsePayload.error_code === 'invalid_nonce') {
                    latestNonce = parseFloat((responsePayload.error.split(' ')[5]).replace('.', ''));
                }
                callback(Error("doRequestEncrypted request {responsePayload.success} failed!", responsePayload), null);
            } else {
                callback(null, responsePayload.return);
            }
        }

    });

}

module.exports = {

    configure: (key, secret, isDebugging = false) => {
        IDX_KEY = key;
        IDX_SECRET = secret;
        IS_DEBUGGING = isDebugging === true || isDebugging === 'true' || isDebugging === 1
    },

    setNonce: (nonce) => {
        if (isNaN(nonce)) {
            throw Error("setNonce {nonce} must be a number!");
        }
        latestNonce = nonce;
    },

    getNonce: () => {
        return latestNonce;
    },

    getInfo: (payload = {}, callback) => {
        let compiledPayload = {
            method: 'getInfo'
        };
        Object.keys(payload).map(key => compiledPayload[key] = payload[key]);
        doRequestEncrypted(compiledPayload, callback);
    },

    transHistory: (payload = {}, callback) => {
        let compiledPayload = {
            method: 'transHistory'
        };
        Object.keys(payload).map(key => compiledPayload[key] = payload[key]);
        doRequestEncrypted(compiledPayload, callback);
    },

    trade: (payload, callback) => {
        let compiledPayload = {
            method: 'trade'
        };
        Object.keys(payload).map(key => compiledPayload[key] = payload[key]);
        doRequestEncrypted(compiledPayload, callback);

    },

    tradeHistory: (payload, callback) => {
        let compiledPayload = {
            method: 'tradeHistory'
        };
        Object.keys(payload).map(key => compiledPayload[key] = payload[key]);
        doRequestEncrypted(compiledPayload, callback);
    },

    openOrders: (payload, callback) => {
        let compiledPayload = {
            method: 'openOrders'
        };
        Object.keys(payload).map(key => compiledPayload[key] = payload[key]);
        doRequestEncrypted(compiledPayload, callback);
    },

    orderHistory: (payload, callback) => {
        let compiledPayload = {
            method: 'orderHistory'
        };
        Object.keys(payload).map(key => compiledPayload[key] = payload[key]);
        doRequestEncrypted(compiledPayload, callback);
    },

    getOrder: (payload, callback) => {
        let compiledPayload = {
            method: 'getOrder'
        };
        Object.keys(payload).map(key => compiledPayload[key] = payload[key]);
        doRequestEncrypted(compiledPayload, callback);
    },

    cancelOrder: (payload, callback) => {
        let compiledPayload = {
            method: 'cancelOrder'
        };
        Object.keys(payload).map(key => compiledPayload[key] = payload[key]);
        doRequestEncrypted(compiledPayload, callback);
    },

    getTicker: (pair, callback) => {
        doRequest(pair + '/ticker', callback);
    },

    getTrades: (pair, callback) => {
        doRequest(pair + '/trades', callback);
    },

    getDepth: (pair, callback) => {
        doRequest(pair + '/depth', callback);
    }

}