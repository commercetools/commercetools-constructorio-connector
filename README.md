constructor.io connector
====

This connector contains code to connect commercetools to constructor.io.

It contains two subscriptions, <code>productCreated</code> and <code>productUpdated</code>, which will update the index on c.io for the updated product but only if it has no staged changes (published).

There are also two HTTP endpoints, <code>/api/c.io/exportProduct</code>, which will export a single CT product to c.io by its ID, and <code>/api/c.io/export</code>, which will export the entire catalog.

## Running the app

After cloning this repo, run `npm i` to install dependencies.  To run in development mode, use `npm run dev`.

## Configuration

To read any configuration variables, the app uses this hierarchy:

* Command line arguments
* Environment variables
* `config/local.json` (this file is gitignored, therefore safe to keep secrets here)
* `config/(development|production).json` (depending on the npm run mode)
* `config/default.json`

Sources that are higher up in the hierarchy get priority (e.g., it will use a value from `local.json` before one from `default.json`)

Configuration variables that are accessed in this code are:

* `port` - this is the node.js port (default: 3001)
* `pubSub`

    If you look in `config/default.json` you will see the following block:
   
    ```
    "pubSub": {
        "type": "GoogleCloudPubSub",
        "projectId": "<gcp_id>",
        "topic": "<gcp_pubsub_topic>"
    }
    ```

    You will need to replace <gcp_id> and <gcp_pubsub_topic> with appropriate values for your environment.

* `constructor.io`

    Again in `config/default.json` there is this block:

    ```
    "constructor.io": {
        "apiToken": "<api_token>",
        "apiKey": "<api_key>",
        "mapper": "<path_to_mapper>"
    }
    ```

    `apiToken` and `apiKey` are your constructor.io token and key respectively.  If you want to use a custom mapper (optional), you need to specify the source path in `mapper` (e.g. `services/foo/mapper.js`)

## Mapper behavior

There is a basic CT -> c.io mapper that lives in `src/services/c.io/baseMapper.js`.  This mapper always gets run.  You can also specify another mapper that will be used in 'pipeline mode' -- so your new mapper will be called with `product` (the CT representation of the product) and with `mapped` (the result of running `product` through the base mapper).

A trivial pipeline mapper would look like this:

```
module.exports = {
    mapProduct: (product, mapped = {}, languageCode) => {
        // maybe do something like change the URL?
        mapped.url = `https://foo.bar.com/${languageCode}/${product.id}`
        return mapped
    }
}
```

The end result of this mapping will have most of its data populated by the base mapper, but customizations can be done if need be.

## Code sharing

Since the subscription listener and the microservice endpoints are defined in the same place, they can share code.  Each entry point into the exporter

* `productCreated`
* `productUpdated`
* `/api/c.io/export`
* `/api/c.io/exportProduct`

uses the same mappers and constructorio connection information.  See `src/services/c.io/index.js` for entry point definitions.