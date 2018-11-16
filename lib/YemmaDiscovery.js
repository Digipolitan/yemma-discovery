const Instance = require('./Instance');
const Request = require('request-promise');
const SocketIO = require('socket.io-client');
const utils = require('./utils');

class YemmaDiscovery {
    constructor(options) {
        this.options = options || {};

        this.access_token = null;
        this.requestModule = this.options.requestModule || Request;

        this.registry = require('./settings/registry.json');
        utils.loadFromEnv(this.registry);

        if (this.options.subscribe !== false) {
            this.instance = require('./settings/instance.json');
            utils.loadFromEnv(this.instance);
            this.instance.data.port = this.instance.data.proxy_port || this.instance.data.port;
        }

        this._initIO();
    }

    /**
     *
     * @private
     */
    _initIO() {
        this.io_client = SocketIO(`${this.registry.uri}?token=${this.registry.access_token}`, { transports: ['websocket'], forceNew: true });
        this.io_client.on('connect', () => {
            console.log('YD > process connected to registry with id:', this.io_client.id);
            if (this.options.subscribe === false)
                return;

            this.io_client.emit('/registry/subscribe', this.instance, token => this.access_token = token)
        });

        this.io_client.on('reconnect_attempt', attemptNumber => console.warn('YD >  reconnect attempt', attemptNumber));
        this.io_client.on('reconnect_failed', error => console.error('YD > reconnect_failed', error));
        this.io_client.on('reconnect_error', error => console.error('YD > reconnect_error', error));
        this.io_client.on('connect_error', error => console.error('YD > connect_error', error));
        this.io_client.on('connect_timeout', timeout => console.error('YD > connect_timeout', timeout));
        this.io_client.on('error', error => console.error('YD > Unknown error', error));
    }


    next(where) {
        const self = this;

        return getNextNodeFromRegistry()
            .then(config => new Instance(config, this.requestModule));

        function getNextNodeFromRegistry() {
            return new Promise((resolve, reject) => {
                self.io_client.emit('/registry/next', { query: { criteria: { where } } }, (response) => {
                    if (response.error)
                        return reject(response.error);
                    return resolve(response);
                });
            });
        }
    }

    validateIssuer(token) {
        return token === this.access_token
            ? Promise.resolve()
            : Promise.reject(new Error('invalid.token'));
    }
}

module.exports = YemmaDiscovery;
