constructor.io connector
====

This connector contains code to connect commercetools to constructor.io.

It contains two subscriptions, <code>productCreated</code> and <code>productUpdated</code>, which will update the index on c.io for the updated product but only if it has no staged changes (published).

There are also two HTTP endpoints, <code>/api/c.io/exportProduct</code>, which will export a single CT product to c.io by its ID, and <code>/api/c.io/export</code>, which will export the entire catalog.

## Running the app

After cloning this repo, run `npm i` to install dependencies.  To run in development mode, use `npm run dev`.