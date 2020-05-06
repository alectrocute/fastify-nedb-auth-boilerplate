// Copyright 2020 Alec Armbruster <alectrocute@gmail.com>

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
// associated documentation files (the "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
// following conditions:

// The above copyright notice and this permission notice shall be included in all copies or substantial
// portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
// LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// config
const config = require("./config.js").config;

const fastify = require("fastify")();
const fastifySession = require("fastify-session");
const fastifyCookie = require("fastify-cookie");
const Datastore = require("nedb");
let db = new Datastore({ filename: "./database.db", autoload: true });
db.persistence.setAutocompactionInterval(config.compactInterval);
const { saltHashPassword, decrypt } = require("./utils.js");

fastify.register(fastifyCookie);
fastify.register(fastifySession, {
  cookieName: config.cookieName,
  secret: config.secret,
  cookie: { secure: false },
  expires: 1800000,
});

const logger = (line) => {
  const now = new Date();
  const formattedNow = now.toISOString();
  console.log(`🎒${formattedNow} – ${line}`);
};

// app routes

// POST /api/login
// signs user in and generates server session
// { email: <email>, password: <password> }

fastify.post("/api/login", (request, reply) => {
  const { email, password } = request.body;
  logger(`/api/login - attempt: ${email}`);

  db.find({ email: email }, (err, docs) => {
    if (docs.length === 0) {
      reply.send(403);
      return;
    }

    const de = decrypt(
      password,
      docs[0].password.passwordHash,
      docs[0].password.salt
    );

    if (de === true) {
      logger(`/api/login - ${email}, success`);
      request.session.user = {
        email: email,
        salt: docs[0].password.salt,
      };
      reply.code(200).send({
        res: true,
      });
    } else {
      request.session.user = {};
      logger(`/api/login - ${email}, failed`);
      reply.code(403).send({
        res: false,
      });
    }
  });
});

// POST /api/register
// registers new account
// { email: <email>, password: <password>, passwordConfirm: <password> }

fastify.post("/api/register", (request, reply) => {
  const { email, password, passwordConfirm } = request.body;
  const validatePassword = (pass) => {
    return pass && pass.length > 5;
  };
  logger(`/api/register - attempt: ${email}`);
  // basic validation
  if (
    password !== passwordConfirm ||
    !password ||
    !passwordConfirm ||
    !email ||
    !validatePassword(password)
  ) {
    logger(`/api/register - ${email}, failed`);
    reply.code(403).send({
      res: false,
    });
    return;
  }

  const hs = saltHashPassword(password);

  db.find({ email: email }, (err, docs) => {
    if (docs.length > 0) {
      logger(`/api/register - ${email}, failed`);
      reply.code(403).send({
        res: false,
      });
      return;
    }

    const d = new Date();

    db.insert(
      {
        email: email,
        password: hs,
        meta: {
          admin: false,
          created: d.toISOString(),
          active: true,
        },
      },
      function (err) {
        logger(`/api/register - ${email}, success`);

        reply.code(200).send({
          res: true,
        });
      }
    );
  });
});

// PUT /api/account
// { email: <email>, key: <key>, value: <value> }

fastify.put("/api/account", (request, reply) => {
  const { email, key, value } = request.body;

  const error = () => {
    logger(`/api/account - ${email}, failed`);
    reply.code(403).send({
      res: false,
    });
    return;
  };

  logger(`/api/account - attempt: ${email}`);

  db.find({ email: email }, (err, docs) => {
    if (err) error();
    const verifiedSalt = docs[0].password.salt;

    if (
      verifiedSalt &&
      request.session &&
      request.session.user &&
      request.session.user.email !== undefined &&
      request.session.user.email === email &&
      request.session.user.salt === verifiedSalt
    ) {
      const jsonKey = `${key}`;

      db.update(
        { email: `${request.session.user.email}` },
        { $set: { [jsonKey]: value } },
        { upsert: false },
        function (err, numReplaced) {
          logger(`/api/account - ${email}, success`);
          reply.code(200).send({
            res: true,
            numReplaced: numReplaced,
          });
        }
      );
    } else {
      error();
    }
  });
});

// GET /api/session
// checks server session
fastify.get("/api/session", (request, reply) => {
  const ses = request.session.user;
  logger(`/api/session - request`);

  if (ses && ses !== {} && ses.email !== undefined) reply.code(200).send(ses);
  if (!ses || ses === {} || !ses.email) {
    logger(`/api/session - fail`);
    reply.code(403).send({
      res: false,
    });
  }
});

// GET /api/logout
// clears server session
fastify.get("/api/logout", (request, reply) => {
  logger(`/api/logout - request`);

  request.session.user = {};
  reply.code(200).send({
    res: true,
  });
});

fastify.listen(config.port, config.hostname, () => {
  logger(`server up on ${config.hostname}:${config.port}`);
});
