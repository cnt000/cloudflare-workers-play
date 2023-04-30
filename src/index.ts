import { Client as LibsqlClient, createClient } from "@libsql/client/web";
import { Router, RouterType } from "itty-router";

export interface Env {
  // The environment variable containing your the URL for your Turso database.
  LIBSQL_DB_URL?: string;
  // The Secret that contains the authentication token for your Turso database.
  LIBSQL_DB_AUTH_TOKEN?: string;

  // These objects are created before first use, then stashed here
  // for future use
  router?: RouterType;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (env.router === undefined) {
      env.router = buildRouter(env);
    }

    return env.router.handle(request);
  },
};

function buildLibsqlClient(env: Env): LibsqlClient {
  const url = env.LIBSQL_DB_URL?.trim();
  if (url === undefined) {
    throw new Error("LIBSQL_DB_URL env var is not defined");
  }

  const authToken = env.LIBSQL_DB_AUTH_TOKEN?.trim();
  if (authToken === undefined) {
    throw new Error("LIBSQL_DB_AUTH_TOKEN env var is not defined");
  }

  return createClient({ url, authToken });
}

function buildRouter(env: Env): RouterType {
  const router = Router();

  router.get("/users", async () => {
    const client = buildLibsqlClient(env);
    const rs = await client.execute("select * from users");
    // return Response.json(rs);
    return new Response(JSON.stringify(rs), {
      headers: {
        "content-type": "application/json;charset=UTF-8",
        ...corsHeaders,
      },
    });
  });

  router.get("/playlists", async () => {
    const client = buildLibsqlClient(env);
    const rs = await client.execute("select * from playlists");
    return Response.json(rs);
  });

  router.get("/add-user", async (request) => {
    const client = buildLibsqlClient(env);
    const { email, name } = request.query;

    if (email === undefined) {
      return new Response("Missing email", { status: 400 });
    }
    if (typeof email !== "string") {
      return new Response("email must be a single string", { status: 400 });
    }
    if (email.length === 0) {
      return new Response("email length must be > 0", { status: 400 });
    }
    if (name === undefined) {
      return new Response("Missing name", { status: 400 });
    }
    if (typeof name !== "string") {
      return new Response("name must be a single string", { status: 400 });
    }
    if (name.length === 0) {
      return new Response("name length must be > 0", { status: 400 });
    }

    try {
      await client.execute({
        sql: `insert into users(email, name) values(?, ?)`,
        args: [name, email],
      });
    } catch (e) {
      console.error(e);
      return new Response("database insert failed");
    }

    return new Response("Added");
  });

  router.get("/add-playlist", async (request) => {
    const client = buildLibsqlClient(env);
    const { owner_id, payload } = request.query;

    if (owner_id === undefined) {
      return new Response("Missing owner_id", { status: 400 });
    }
    if (typeof owner_id !== "string") {
      return new Response("owner_id must be a single string", { status: 400 });
    }
    if (owner_id.length === 0) {
      return new Response("owner_id length must be > 0", { status: 400 });
    }
    if (payload === undefined) {
      return new Response("Missing payload", { status: 400 });
    }
    if (typeof payload !== "string") {
      return new Response("payload must be a single string", { status: 400 });
    }
    if (payload.length === 0) {
      return new Response("payload length must be > 0", { status: 400 });
    }

    try {
      await client.execute({
        sql: `insert into playlists(owner_id, payload) values(?, ?)`,
        args: [owner_id, payload],
      });
    } catch (e) {
      console.error(e);
      return new Response("database insert failed");
    }

    return new Response("Added");
  });

  router.all("*", () => new Response("Not Found.", { status: 404 }));

  return router;
}
