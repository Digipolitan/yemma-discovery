# Yemma-Client


Yemma-Client is a thin to help you manage your nodes in a micro-services architectures.
Either you are a micro-service you can use Yemma-Client to register yourself as an available node, either you are a Gateway and you want access a node with some specifications.

1. Install Yemma-Client

```bash
npm i --save yemma-client
```

2. To register yourself as a service

Yemma-Client automatically register itself as a service as soon as it is instanciated.

Before registering yourself, Yemma-Client will look into some environment variables:

```bash
# Related to the registry
YEMMA_URI=http://localhost.com:9000 #required information about where the registry is hosted
YEMMA_TOKEN=ytoken                  #since the registry is a yemma application it will verify each request with a token (set during yemma configuration)

# Related to the node itself
REALM=admin                          #required to tell the registry for which part of the business the node is responsible
PORT=3030                            #required also, the port where the node is listening
ACCESS_TOKEN=xF%eeT$mbS&             #required also, the secret used to ensure only trusted issuer can make requests
HOST=customHost.org                  #[optional] if the node is behind a proxy, you can set a host, if not, the registry will try to resolve the node'ip address during registration.
```


```javascript
const DisoveryService = require('yemma-client');
new DiscoveryService(); // will automatically register the node to the registry
```

That's it, you are not discoverable in the registry.

You can disable this behavior by passing an option in the constructor.
Meaning you don't have to set information related to the node itself.
```javascript
const DisoveryService = require('yemma-client');
new DiscoveryService({ heartBeats: false }); // disable the heartbeat
```


2. Use Yemma-Client to proxy request to registered instance.

If you develop a Gateway, it can be helpful to have a direct access to the registered nodes.


