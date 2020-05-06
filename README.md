
# fastify-nedb-auth-boilerplate

a simple API boilerplate for server-side auth with fastify and nedb 💡

If you hate databases that run binaries and are comfortable with JS - then this boilerplate may be for you.

It also features ~~shoddy~~ best password security practices (so even if baddies get that sweet, [sweet static-file nedb database](https://github.com/louischatriot/nedb), it'll just have a bunch of [salted hashes]([https://en.wikipedia.org/wiki/Salt_(cryptography)](https://en.wikipedia.org/wiki/Salt_(cryptography)))).

## Ingredients

* [fastify](https://www.fastify.io/)
* [fastify-cookie](https://github.com/fastify/fastify-cookie)
* [fastify-session](https://www.npmjs.com/package/fastify-session)
* [nedb](https://github.com/louischatriot/nedb)

## Getting Started

Assuming you have any version of Node.js installed...

#### Clone and install dependencies

```bash
git clone https://github.com/alectrocute/fastify-nedb-auth-boilerplate.git boilerplate;
cd boilerplate;
npm i;
```

<hr>

#### Config

In the file `config.js` –

```js
{
   // sessions
   secret: "ExCL45zXxL5LuAWqcFswQBvX11FiKYNRoawivW8KjH0UuKJDLysYMkhgwkrh",
   cookieName: "boilerplate_cookie_example",
   // nedb compaction rate
   compactInterval: 5000,
   // for fastify server
   hostname: "localhost",
   port: 3000,
 }
```

#### Run

```bash
npm run serve
```


## Endpoints

#### POST /api/register

Registers an account.

Expects JSON, payload example:

```js
{
  "email": "ceo@ecorp.com",
  "password": "hunter1"
  "passwordConfirm": "hunter1"
}
```

<hr>

#### POST /api/login

Authenticates and creates a session for the user.

Expects JSON, payload example:

```js
{
  "email": "ceo@ecorp.com",
  "password": "hunter1"
}
```

<hr>

#### PUT /api/account

Modifies details in the authenticated user's database entry.

Expects JSON, payload example:

```js
{
  "email": "ceo@ecorp.com",
  "key": "meta.subscriberActive",
  "value": "true"
}
```

<hr>

#### GET /api/session

Returns the server-persisted session of the requester, if any.

Returns JSON, payload example:

```js
200

{
  "email": "ceo@ecorp.com",
  "salt": "3rh808j0n#2f9"
}
```

<hr>

#### GET /api/logout

Removes the requester's session, if any.

Returns JSON, payload example:

```js
200

{
  "res": "true"
}
```
