import mongoose from "mongoose";
import dns from "dns";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Fail fast in dev; in prod this should never be missing.
  console.warn("MONGODB_URI is not set — DB calls will fail until it is configured in .env");
}

/**
 * Optional, explicit opt-in only: if MONGODB_DNS_SERVERS is set, point
 * Node's DNS resolver at those servers before connecting. This exists
 * because `mongodb+srv://` URIs require a DNS SRV lookup
 * (`_mongodb._tcp.<cluster>`), and on some networks (corporate
 * firewalls, some VPNs/split-tunnel setups, some WSL/Docker network
 * configs, some ISPs) the machine's configured DNS resolver refuses or
 * blocks that specific query type — surfacing as
 * `querySrv ECONNREFUSED ...` — even though normal web browsing works
 * fine, because Node's DNS module queries the configured nameservers
 * directly rather than going through the OS's full resolution stack.
 *
 * This is NEVER applied unless the person explicitly sets
 * MONGODB_DNS_SERVERS in their own .env.local — it does not silently
 * change anything by default. See README for when (and whether) to use
 * this vs. the non-SRV connection string alternative, which is usually
 * the better fix for a persistently blocked network.
 */
const dnsServersEnv = process.env.MONGODB_DNS_SERVERS;
if (dnsServersEnv) {
  const servers = dnsServersEnv.split(",").map((s) => s.trim()).filter(Boolean);
  if (servers.length > 0) {
    dns.setServers(servers);
    console.warn(`[mongodb] Using custom DNS servers from MONGODB_DNS_SERVERS: ${servers.join(", ")}`);
  }
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Cache the connection across hot-reloads / serverless invocations so we
// don't open a new connection pool on every request.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache || { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        bufferCommands: false,
        maxPoolSize: 10,
        // Explicit rather than relying on driver defaults, so a DNS/
        // network problem (like the SRV lookup failure this file is
        // documented for) fails predictably instead of hanging a
        // request for the driver's default ~30s server-selection window.
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000
      })
      .catch((err) => {
        // CRITICAL: clear the cached promise on failure. Without this,
        // a single failed connection attempt (e.g. this exact
        // querySrv ECONNREFUSED) gets permanently cached as a rejected
        // promise — every subsequent call to connectToDatabase() in
        // this process would immediately re-throw the SAME stale error
        // forever, even after the underlying DNS/network issue is
        // fixed, until the dev server is restarted. Clearing it lets
        // the next call retry a fresh connection.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
