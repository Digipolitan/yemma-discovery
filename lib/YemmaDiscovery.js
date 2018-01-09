const _ = require('lodash');
const Instance = require('./Instance');
const Request = require('request-promise');
const SocketIO = require('socket.io-client');

class YemmaDiscovery {
    constructor(options) {
        options = options || {};

        this.heartBeatDelay = options.heartBeatDelay || 3000;
        this.requestModule = options.requestModule || Request;
        this.registry = require('./settings/registry.json');
        this.instance = require('./settings/instance.json');

        this.heartBeatId = null;
        loadFromEnv(this.registry);

        this.heartBeat = (options.heartBeat !== false);
        this._initIO();
    }

    /**
     *
     * @param value {Boolean}
     */
    set heartBeat(value) {
        if (value)
            this._triggerHeartBeat();
        else
            this._cancelHeartBeat();
    }

    /**
     *
     * @return {Promise.<Instance>}
     */
    next(query) {
        const self = this;

        return getNextNodeFromRegistry()
            .then(config => new Instance(config, this.requestModule))
            .catch(err => (err.statusCode === 304) ? err.response : Promise.reject(err));

        function getNextNodeFromRegistry() {
            return self.requestModule({
                uri: `${self.registry.uri}/registry/next`,
                headers: {
                    'access-token': self.registry.access_token,
                },
                qs: { criteria: JSON.stringify({ where: query }) },
                json: true
            });
        }
    };

    /**
     *
     * @private
     */
    _initIO() {
        if (!this.registry.registration_channel)
            return;

        try {
            this.io_client = SocketIO(this.registry.uri);
        } catch (error) {
            return;
        }

        if (this.io_client)
            this.io_client.on('connect', () => this.io.emit(this.registry.registration_channel, this.instance));
    }

    /**
     *
     * @private
     */
    _triggerHeartBeat() {
        loadFromEnv(this.instance);

        if (process.env.PROXY_PORT)
            this.instance.info.body.port = process.env.PROXY_PORT;

        if (process.env.PROXY_HOST)
            this.instance.info.body.address = process.env.PROXY_HOST;

        this.heartBeatId = setInterval(() => {
            const options = _.cloneDeep(this.instance.info);
            options.headers = { 'access-token': this.registry.access_token };

            this.requestModule(`${this.registry.uri}/registry/subscribe`, options);
        }, this.heartBeatDelay);
    }

    validateIssuer(access_token) {
        return access_token === this.instance.info.body.access_token
            ? Promise.resolve()
            : Promise.reject(new Error('invalid.token'));
    }

    /**
     *
     * @private
     */
    _cancelHeartBeat() {
        clearInterval(this.heartBeatId);
    }
}

function loadFromEnv(settings) {
    Object.keys(settings).forEach((property) => {
        if (!Object.prototype.hasOwnProperty.call(settings, property))
            return null;

        if (typeof settings[property] === 'object')
            return loadFromEnv(settings[property]);

        if (typeof settings[property] === 'string' && settings[property].startsWith('$')) {
            const key = (settings[property].endsWith('?'))
                ? settings[property].slice(1).slice(0, -1)
                : settings[property].slice(1);

            const setting = process.env[key];

            if (!setting && !settings[property].endsWith('?'))
                throw new Error(`missing env property: ${key}`);

            if (!settings && settings[property].endsWith('?'))
                delete settings[property];

            settings[property] = setting;
        }

        return null;
    });
}

module.exports = YemmaDiscovery;
