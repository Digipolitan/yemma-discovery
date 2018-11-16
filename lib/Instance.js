let request = null;

class Instance {
    constructor(config, requestModule) {
        this.id = config._id;
        this.address = config.address;
        this.accessToken = config.access_token;
        this.port = config.port;
        this.timeout = config.timeout;
        this.secure = config.secure;
        request = requestModule;
    }

    get uri() {
        return `${this.secure ? 'https' : 'http'}://${this.address}${this.port !== 80 ? `:${this.port}` : ''}`;
    }

    request(path, options) {
        options = options || {};
        options.uri = this.uri;
        options.uri += `${path}`;
        options.method = options.method || 'GET';
        options.json = true;
        options.timeout = this.timeout;
        options.port = options.port || this.port;
        options.headers = options.headers || {};
        options.headers.host = this.address;
        options.headers['access-token'] = this.accessToken;

        options.qs = options.query;

        return request(options)
            .catch((err) => {
                    let error = err.response && err.response.body || err;
                    if (typeof error === 'string')
                        error = { reason: error };

                    error.code = err.statusCode;

                    return (err.statusCode === 304)
                        ? err.response
                        : Promise.reject(error);
                }
            );
    }
}


module.exports = Instance;

