var Wn = Object.defineProperty;
var Gn = (o, t, n) => t in o ? Wn(o, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : o[t] = n;
var I = (o, t, n) => Gn(o, typeof t != "symbol" ? t + "" : t, n);
import Hn, { app as M, ipcMain as D, Tray as Vn, Menu as Gi, shell as Hi, BrowserWindow as $e, dialog as Jn, nativeImage as ii, clipboard as Xn, protocol as Ue, net as xa } from "electron";
import P from "node:path";
import Be from "node:os";
import U, { mkdirp as Yn } from "fs-extra";
import $i from "node:process";
import Ae from "os";
import z from "path";
import Qn, { fileURLToPath as Kn } from "url";
import gn from "cross-spawn";
import Zn, { EventEmitter as es } from "node:events";
import { Writable as ze } from "node:stream";
import is, { randomUUID as as } from "node:crypto";
import Vi from "electron-store";
import "node:net";
import { exec as bn } from "node:child_process";
import { createRequire as ns } from "node:module";
import We from "events";
import yn from "https";
import Ji from "http";
import ss from "net";
import os from "tls";
import Xi from "crypto";
import De from "stream";
import ts from "zlib";
import rs from "buffer";
import { existsSync as cs, readFileSync as ps, writeFileSync as ls } from "node:fs";
import us, { execSync as ds } from "child_process";
import ms, { download as fs, CancelError as xs } from "electron-dl";
import ue from "fs";
import hs from "util";
import { createServer as vs, request as gs } from "node:http";
import wn from "fs/promises";
import { Anthropic as bs } from "@anthropic-ai/sdk";
import { Ollama as ys } from "ollama";
import ha, { AzureOpenAI as ws } from "openai";
import { Mistral as _s } from "@mistralai/mistralai";
import { BedrockClient as ks, ListFoundationModelsCommand as Es } from "@aws-sdk/client-bedrock";
class Ss {
  constructor() {
    I(this, "isQuitting", !0);
  }
  setIsQuitting(t) {
    this.isQuitting = t;
  }
}
const be = new Ss(), js = "0.13.0", _n = {
  version: js
}, oe = Be.homedir(), Yi = Be.tmpdir(), { env: he } = $i, Ps = (o) => {
  const t = P.join(oe, "Library");
  return {
    data: P.join(t, "Application Support", o),
    config: P.join(t, "Preferences", o),
    cache: P.join(t, "Caches", o),
    log: P.join(t, "Logs", o),
    temp: P.join(Yi, o)
  };
}, Ts = (o) => {
  const t = he.APPDATA || P.join(oe, "AppData", "Roaming"), n = he.LOCALAPPDATA || P.join(oe, "AppData", "Local");
  return {
    // Data/config/cache/log are invented by me as Windows isn't opinionated about this
    data: P.join(n, o, "Data"),
    config: P.join(t, o, "Config"),
    cache: P.join(n, o, "Cache"),
    log: P.join(n, o, "Log"),
    temp: P.join(Yi, o)
  };
}, Os = (o) => {
  const t = P.basename(oe);
  return {
    data: P.join(he.XDG_DATA_HOME || P.join(oe, ".local", "share"), o),
    config: P.join(he.XDG_CONFIG_HOME || P.join(oe, ".config"), o),
    cache: P.join(he.XDG_CACHE_HOME || P.join(oe, ".cache"), o),
    // https://wiki.debian.org/XDGBaseDirectorySpecification#state
    log: P.join(he.XDG_STATE_HOME || P.join(oe, ".local", "state"), o),
    temp: P.join(Yi, t, o)
  };
};
function Cs(o, { suffix: t = "nodejs" } = {}) {
  if (typeof o != "string")
    throw new TypeError(`Expected a string, got ${typeof o}`);
  return t && (o += `-${t}`), $i.platform === "darwin" ? Ps(o) : $i.platform === "win32" ? Ts(o) : Os(o);
}
const Ne = z.dirname(Kn(import.meta.url));
process.env.APP_ROOT = z.join(Ne, "../..");
z.join(process.env.APP_ROOT, "dist-electron");
const kn = z.join(process.env.APP_ROOT, "dist"), se = process.env.VITE_DEV_SERVER_URL;
process.env.VITE_PUBLIC = se ? z.join(process.env.APP_ROOT, "public") : kn;
const En = Cs(M.getName(), { suffix: "" });
En.cache;
const Ls = Ae.homedir(), ye = z.join(Ls, ".dive"), Te = z.join(ye, "scripts"), Oe = M.isPackaged ? z.join(ye, "config") : z.join(process.cwd(), ".config"), ve = z.join(ye, "host_cache"), As = z.join(ye, "log"), Ds = [
  z.join(process.resourcesPath, "node"),
  z.join(process.resourcesPath, "uv"),
  z.join(process.resourcesPath, "python", "bin")
], Ns = [
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  z.join(process.resourcesPath, "node", "bin"),
  z.join(process.resourcesPath, "uv")
], ai = "__SYSTEM_DIVE_SERVER__", va = process.platform === "win32" ? "dive-mcp.exe" : process.platform === "darwin" ? process.arch === "arm64" ? "dive-mcp-aarch64" : "dive-mcp-x86_64" : "dive-mcp", Fs = () => M.isPackaged ? z.join(process.resourcesPath, "prebuilt", va) : z.join(process.cwd(), "target", "release", va), Is = {
  mcpServers: {}
}, Ms = {
  activeProvider: "none",
  configs: {},
  enableTools: !0
}, Rs = [
  {
    name: "oap-platform",
    module: "dive_mcp_host.oap_plugin",
    config: {},
    ctx_manager: "dive_mcp_host.oap_plugin.OAPPlugin",
    static_callbacks: "dive_mcp_host.oap_plugin.get_static_callbacks"
  }
], ga = z.join(Oe, "db.sqlite"), qs = {
  db: {
    uri: `sqlite:///${ga}`,
    pool_size: 5,
    pool_recycle: 60,
    max_overflow: 10,
    echo: !1,
    pool_pre_ping: !0,
    migrate: !0
  },
  checkpointer: {
    uri: `sqlite:///${ga}`
  }
}, Sn = M.isPackaged ? z.join(Ne, "../..") : process.cwd(), Ce = new Vi({
  name: "preferences",
  defaults: {
    autoLaunch: !1,
    minimalToTray: !0
  }
}), jn = new Vi({
  name: "oap",
  defaults: {
    oap: {
      token: ""
    }
  }
}), ba = new Vi({
  name: "host-cache",
  defaults: {
    lockHash: ""
  }
}), ne = M.isPackaged ? Oe : P.join(Ne, "..", "..", ".config"), Qi = [], Us = () => Qi.length = 0, zs = (o) => Qi.push(o), H = {
  ip: "localhost",
  port: 0
};
let X = null;
const Bi = new es(), Le = /* @__PURE__ */ new Set();
let Wi = [];
const $s = () => Wi;
async function Bs() {
  await U.mkdir(ne, { recursive: !0 });
  const o = P.join(ne, "mcp_config.json"), t = Fs(), n = await U.pathExists(t);
  if (n || console.warn("defalut mcp server not found"), await le(o, JSON.stringify(Is, null, 2)), n && await U.pathExists(o))
    try {
      const r = await U.readJSON(o);
      r.mcpServers && !r.mcpServers[ai] && (r.mcpServers[ai] = {
        transport: "stdio",
        enabled: !0,
        command: t
      }, await U.writeJSON(o, r, { spaces: 2 }), console.log(`added ${ai} to mcp_config.json`));
    } catch (r) {
      console.error("Failed to check/update mcp_config.json:", r);
    }
  const p = P.join(ne, "customrules");
  await le(p, "");
  const a = P.join(ne, "model_config.json");
  await le(a, JSON.stringify(Ms, null, 2));
  const e = P.join(ne, "dive_httpd.json");
  await le(e, JSON.stringify(qs, null, 2));
  const i = P.join(ne, "plugin_config.json");
  await le(i, JSON.stringify(Rs, null, 2));
  const s = P.join(ne, "command_alias.json");
  await le(s, JSON.stringify(process.platform === "win32" && M.isPackaged ? {
    npx: P.join(process.resourcesPath, "node", "npx.cmd"),
    npm: P.join(process.resourcesPath, "node", "npm.cmd")
  } : {}, null, 2));
}
async function le(o, t) {
  await U.pathExists(o) || (console.log("creating file", o), await U.ensureDir(P.dirname(o)), await U.writeFile(o, t));
}
async function Ws(o) {
  const t = (n) => {
    n.server.listen.port && (H.ip = n.server.listen.ip, H.port = n.server.listen.port, o.webContents.send("app-port", n.server.listen.port), Bi.off("ipc", t), setTimeout(() => {
      Qi.forEach((c) => c(n.server.listen.ip, n.server.listen.port).catch((p) => console.error("Failed to call service up callback:", p))), Us();
    }, 100));
  };
  Bi.on("ipc", t), await Bs().catch(console.error), await Vs(o).catch(console.error), await Hs().catch(console.error);
}
async function Gs() {
  console.log("cleanup");
  for (const o of Le)
    o.killed || o.kill("SIGTERM");
  Le.clear(), X && (console.log("killing host process"), X.kill("SIGTERM"), await new Promise((o) => setTimeout(o, 100)), X.killed || (console.log("killing host process again"), X == null || X.kill("SIGKILL"))), await U.writeFile(P.join(ve, "bus"), "");
}
async function Hs() {
  var f, w;
  const o = process.platform === "win32", t = M.isPackaged ? process.resourcesPath : Sn, n = P.join(t, "python", "bin"), c = o ? P.join(t, "python", "python.exe") : P.join(n, "python3"), p = P.join(ve, "deps"), a = P.join(t, "mcp-host"), e = M.isPackaged ? c : "uv", i = M.isPackaged ? process.platform === "darwin" ? ["-I", P.join(n, "dive_httpd")] : ["-I", "-c", `import site; site.addsitedir('${a.replace(/\\/g, "\\\\")}'); site.addsitedir('${p.replace(/\\/g, "\\\\")}'); from dive_mcp_host.httpd._main import main; main()`] : ["run", "dive_httpd"], s = {
    ...process.env,
    DIVE_CONFIG_DIR: ne,
    RESOURCE_DIR: ve,
    DIVE_USER_AGENT: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Dive/${_n.version} (+https://github.com/OpenAgentPlatform/Dive)`
  };
  console.log("httpd executing path: ", e);
  const r = P.join(ve, "bus");
  await le(r, ""), process.platform !== "win32" && await U.chmod(r, 438), U.watch(r, async (E, _) => {
    if (!_ || E !== "change")
      return;
    const y = Buffer.alloc(1024 * 32);
    if (await U.read(await U.open(r, "r"), y, 0, y.length, 0), !!y.length)
      try {
        const g = y.toString().trim().replace(/\0/g, "");
        if (!g)
          return;
        const b = JSON.parse(g);
        b && (Bi.emit("ipc", b), console.log("received message from host service", b));
      } catch (g) {
        console.error("Failed to parse bus content:", y.toString().trim(), g);
      }
  });
  const l = [
    ...i,
    "--port",
    "0",
    "--report_status_file",
    r,
    "--cors",
    "*",
    "--log_dir",
    P.join(En.log, "host"),
    "--plugin_config",
    P.join(ne, "plugin_config.json")
  ], m = {
    env: s,
    stdio: se ? "inherit" : "pipe"
  };
  se && (m.cwd = P.join(Ne, "..", "..", "mcp-host")), console.log("spawn host with", e, l.join(" ")), X = gn(e, l, m), M.isPackaged && ((f = X == null ? void 0 : X.stdout) == null || f.pipe(new ze({
    write(E, _, y) {
      console.log("[dived]", E.toString()), y();
    }
  })), (w = X == null ? void 0 : X.stderr) == null || w.pipe(new ze({
    write(E, _, y) {
      const g = E.toString();
      g.startsWith("INFO") || g.startsWith("DEBUG") ? console.log("[dived]", g) : g.startsWith("WARNING") ? console.warn("[dived]", g) : console.error("[dived]", g), y();
    }
  }))), X.on("error", (E) => {
    console.error("Failed to start host process:", E);
  }), X.on("close", (E) => {
    console.log(`host process exited with code ${E}`);
  }), X.on("spawn", () => {
    console.log("host process spawned");
  });
}
async function Vs(o) {
  const t = () => {
    o.webContents.send("install-host-dependencies-log", "finish"), Wi = ["finish"];
  };
  if (!M.isPackaged || process.platform === "darwin")
    return t();
  console.log("installing host dependencies");
  const n = process.platform === "win32", c = P.join(process.resourcesPath, "python", "bin"), p = n ? P.join(process.resourcesPath, "python", "python.exe") : P.join(c, "python3"), a = P.join(process.resourcesPath, "uv", n ? "uv.exe" : "uv"), e = P.join(ve, "requirements.txt"), i = P.join(process.resourcesPath, "mcp-host");
  if (!await U.pathExists(P.join(i, "uv.lock")))
    return t();
  const s = P.join(ve, "deps"), r = await Js(P.join(i, "uv.lock"));
  if (r === ba.get("lockHash") && await U.pathExists(s))
    return t();
  await Yn(s);
  const l = ["pip", "install", "-r", e, "--target", s, "--python", p];
  return ya(a, ["export", "-o", e], i, "ignore").then(() => ya(a, l, i, "pipe", 60 * 1e3 * 10, (m) => {
    Wi.push(m), o.webContents.send("install-host-dependencies-log", m), ba.set("lockHash", r);
  })).finally(t);
}
function ya(o, t, n, c = "inherit", p = 60 * 1e3 * 5, a) {
  return new Promise((e, i) => {
    var r, l;
    setTimeout(i, p);
    const s = gn(o, t, { cwd: n, stdio: c });
    Le.add(s), s.on("close", () => {
      Le.delete(s), e(1);
    }), s.on("error", (m) => {
      console.error(m), Le.delete(s), i(m);
    }), (r = s == null ? void 0 : s.stdout) == null || r.pipe(new ze({
      write(m, f, w) {
        a == null || a(m.toString()), w();
      }
    })), (l = s == null ? void 0 : s.stderr) == null || l.pipe(new ze({
      write(m, f, w) {
        a == null || a(m.toString()), w();
      }
    }));
  });
}
function Js(o) {
  return new Promise((t, n) => {
    const c = is.createHash("md5"), p = U.createReadStream(o);
    p.on("data", (a) => {
      c.update(a);
    }), p.on("end", () => {
      t(c.digest("hex"));
    });
  });
}
function wa(o) {
  const t = process.platform === "win32" ? ";" : ":";
  process.env.PATH = `${o}${t}${process.env.PATH}`;
}
function Xs() {
  return new Promise((o, t) => {
    bn("echo $PATH", (n, c, p) => {
      if (n) {
        t(n);
        return;
      }
      o(c.trim());
    });
  });
}
const ge = "https://oaphub.ai";
function Ge(o) {
  return o && o.__esModule && Object.prototype.hasOwnProperty.call(o, "default") ? o.default : o;
}
var je = { exports: {} }, ni, _a;
function te() {
  if (_a) return ni;
  _a = 1;
  const o = ["nodebuffer", "arraybuffer", "fragments"], t = typeof Blob < "u";
  return t && o.push("blob"), ni = {
    BINARY_TYPES: o,
    EMPTY_BUFFER: Buffer.alloc(0),
    GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
    hasBlob: t,
    kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
    kListener: Symbol("kListener"),
    kStatusCode: Symbol("status-code"),
    kWebSocket: Symbol("websocket"),
    NOOP: () => {
    }
  }, ni;
}
var ka;
function He() {
  if (ka) return je.exports;
  ka = 1;
  const { EMPTY_BUFFER: o } = te(), t = Buffer[Symbol.species];
  function n(i, s) {
    if (i.length === 0) return o;
    if (i.length === 1) return i[0];
    const r = Buffer.allocUnsafe(s);
    let l = 0;
    for (let m = 0; m < i.length; m++) {
      const f = i[m];
      r.set(f, l), l += f.length;
    }
    return l < s ? new t(r.buffer, r.byteOffset, l) : r;
  }
  function c(i, s, r, l, m) {
    for (let f = 0; f < m; f++)
      r[l + f] = i[f] ^ s[f & 3];
  }
  function p(i, s) {
    for (let r = 0; r < i.length; r++)
      i[r] ^= s[r & 3];
  }
  function a(i) {
    return i.length === i.buffer.byteLength ? i.buffer : i.buffer.slice(i.byteOffset, i.byteOffset + i.length);
  }
  function e(i) {
    if (e.readOnly = !0, Buffer.isBuffer(i)) return i;
    let s;
    return i instanceof ArrayBuffer ? s = new t(i) : ArrayBuffer.isView(i) ? s = new t(i.buffer, i.byteOffset, i.byteLength) : (s = Buffer.from(i), e.readOnly = !1), s;
  }
  if (je.exports = {
    concat: n,
    mask: c,
    toArrayBuffer: a,
    toBuffer: e,
    unmask: p
  }, !process.env.WS_NO_BUFFER_UTIL)
    try {
      const i = require("bufferutil");
      je.exports.mask = function(s, r, l, m, f) {
        f < 48 ? c(s, r, l, m, f) : i.mask(s, r, l, m, f);
      }, je.exports.unmask = function(s, r) {
        s.length < 32 ? p(s, r) : i.unmask(s, r);
      };
    } catch {
    }
  return je.exports;
}
var si, Ea;
function Ys() {
  if (Ea) return si;
  Ea = 1;
  const o = Symbol("kDone"), t = Symbol("kRun");
  class n {
    /**
     * Creates a new `Limiter`.
     *
     * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
     *     to run concurrently
     */
    constructor(p) {
      this[o] = () => {
        this.pending--, this[t]();
      }, this.concurrency = p || 1 / 0, this.jobs = [], this.pending = 0;
    }
    /**
     * Adds a job to the queue.
     *
     * @param {Function} job The job to run
     * @public
     */
    add(p) {
      this.jobs.push(p), this[t]();
    }
    /**
     * Removes a job from the queue and runs it if possible.
     *
     * @private
     */
    [t]() {
      if (this.pending !== this.concurrency && this.jobs.length) {
        const p = this.jobs.shift();
        this.pending++, p(this[o]);
      }
    }
  }
  return si = n, si;
}
var oi, Sa;
function Ve() {
  if (Sa) return oi;
  Sa = 1;
  const o = ts, t = He(), n = Ys(), { kStatusCode: c } = te(), p = Buffer[Symbol.species], a = Buffer.from([0, 0, 255, 255]), e = Symbol("permessage-deflate"), i = Symbol("total-length"), s = Symbol("callback"), r = Symbol("buffers"), l = Symbol("error");
  let m;
  class f {
    /**
     * Creates a PerMessageDeflate instance.
     *
     * @param {Object} [options] Configuration options
     * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
     *     for, or request, a custom client window size
     * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
     *     acknowledge disabling of client context takeover
     * @param {Number} [options.concurrencyLimit=10] The number of concurrent
     *     calls to zlib
     * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
     *     use of a custom server window size
     * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
     *     disabling of server context takeover
     * @param {Number} [options.threshold=1024] Size (in bytes) below which
     *     messages should not be compressed if context takeover is disabled
     * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
     *     deflate
     * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
     *     inflate
     * @param {Boolean} [isServer=false] Create the instance in either server or
     *     client mode
     * @param {Number} [maxPayload=0] The maximum allowed message length
     */
    constructor(g, b, j) {
      if (this._maxPayload = j | 0, this._options = g || {}, this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024, this._isServer = !!b, this._deflate = null, this._inflate = null, this.params = null, !m) {
        const S = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
        m = new n(S);
      }
    }
    /**
     * @type {String}
     */
    static get extensionName() {
      return "permessage-deflate";
    }
    /**
     * Create an extension negotiation offer.
     *
     * @return {Object} Extension parameters
     * @public
     */
    offer() {
      const g = {};
      return this._options.serverNoContextTakeover && (g.server_no_context_takeover = !0), this._options.clientNoContextTakeover && (g.client_no_context_takeover = !0), this._options.serverMaxWindowBits && (g.server_max_window_bits = this._options.serverMaxWindowBits), this._options.clientMaxWindowBits ? g.client_max_window_bits = this._options.clientMaxWindowBits : this._options.clientMaxWindowBits == null && (g.client_max_window_bits = !0), g;
    }
    /**
     * Accept an extension negotiation offer/response.
     *
     * @param {Array} configurations The extension negotiation offers/reponse
     * @return {Object} Accepted configuration
     * @public
     */
    accept(g) {
      return g = this.normalizeParams(g), this.params = this._isServer ? this.acceptAsServer(g) : this.acceptAsClient(g), this.params;
    }
    /**
     * Releases all resources used by the extension.
     *
     * @public
     */
    cleanup() {
      if (this._inflate && (this._inflate.close(), this._inflate = null), this._deflate) {
        const g = this._deflate[s];
        this._deflate.close(), this._deflate = null, g && g(
          new Error(
            "The deflate stream was closed while data was being processed"
          )
        );
      }
    }
    /**
     *  Accept an extension negotiation offer.
     *
     * @param {Array} offers The extension negotiation offers
     * @return {Object} Accepted configuration
     * @private
     */
    acceptAsServer(g) {
      const b = this._options, j = g.find((S) => !(b.serverNoContextTakeover === !1 && S.server_no_context_takeover || S.server_max_window_bits && (b.serverMaxWindowBits === !1 || typeof b.serverMaxWindowBits == "number" && b.serverMaxWindowBits > S.server_max_window_bits) || typeof b.clientMaxWindowBits == "number" && !S.client_max_window_bits));
      if (!j)
        throw new Error("None of the extension offers can be accepted");
      return b.serverNoContextTakeover && (j.server_no_context_takeover = !0), b.clientNoContextTakeover && (j.client_no_context_takeover = !0), typeof b.serverMaxWindowBits == "number" && (j.server_max_window_bits = b.serverMaxWindowBits), typeof b.clientMaxWindowBits == "number" ? j.client_max_window_bits = b.clientMaxWindowBits : (j.client_max_window_bits === !0 || b.clientMaxWindowBits === !1) && delete j.client_max_window_bits, j;
    }
    /**
     * Accept the extension negotiation response.
     *
     * @param {Array} response The extension negotiation response
     * @return {Object} Accepted configuration
     * @private
     */
    acceptAsClient(g) {
      const b = g[0];
      if (this._options.clientNoContextTakeover === !1 && b.client_no_context_takeover)
        throw new Error('Unexpected parameter "client_no_context_takeover"');
      if (!b.client_max_window_bits)
        typeof this._options.clientMaxWindowBits == "number" && (b.client_max_window_bits = this._options.clientMaxWindowBits);
      else if (this._options.clientMaxWindowBits === !1 || typeof this._options.clientMaxWindowBits == "number" && b.client_max_window_bits > this._options.clientMaxWindowBits)
        throw new Error(
          'Unexpected or invalid parameter "client_max_window_bits"'
        );
      return b;
    }
    /**
     * Normalize parameters.
     *
     * @param {Array} configurations The extension negotiation offers/reponse
     * @return {Array} The offers/response with normalized parameters
     * @private
     */
    normalizeParams(g) {
      return g.forEach((b) => {
        Object.keys(b).forEach((j) => {
          let S = b[j];
          if (S.length > 1)
            throw new Error(`Parameter "${j}" must have only a single value`);
          if (S = S[0], j === "client_max_window_bits") {
            if (S !== !0) {
              const u = +S;
              if (!Number.isInteger(u) || u < 8 || u > 15)
                throw new TypeError(
                  `Invalid value for parameter "${j}": ${S}`
                );
              S = u;
            } else if (!this._isServer)
              throw new TypeError(
                `Invalid value for parameter "${j}": ${S}`
              );
          } else if (j === "server_max_window_bits") {
            const u = +S;
            if (!Number.isInteger(u) || u < 8 || u > 15)
              throw new TypeError(
                `Invalid value for parameter "${j}": ${S}`
              );
            S = u;
          } else if (j === "client_no_context_takeover" || j === "server_no_context_takeover") {
            if (S !== !0)
              throw new TypeError(
                `Invalid value for parameter "${j}": ${S}`
              );
          } else
            throw new Error(`Unknown parameter "${j}"`);
          b[j] = S;
        });
      }), g;
    }
    /**
     * Decompress data. Concurrency limited.
     *
     * @param {Buffer} data Compressed data
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @public
     */
    decompress(g, b, j) {
      m.add((S) => {
        this._decompress(g, b, (u, d) => {
          S(), j(u, d);
        });
      });
    }
    /**
     * Compress data. Concurrency limited.
     *
     * @param {(Buffer|String)} data Data to compress
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @public
     */
    compress(g, b, j) {
      m.add((S) => {
        this._compress(g, b, (u, d) => {
          S(), j(u, d);
        });
      });
    }
    /**
     * Decompress data.
     *
     * @param {Buffer} data Compressed data
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @private
     */
    _decompress(g, b, j) {
      const S = this._isServer ? "client" : "server";
      if (!this._inflate) {
        const u = `${S}_max_window_bits`, d = typeof this.params[u] != "number" ? o.Z_DEFAULT_WINDOWBITS : this.params[u];
        this._inflate = o.createInflateRaw({
          ...this._options.zlibInflateOptions,
          windowBits: d
        }), this._inflate[e] = this, this._inflate[i] = 0, this._inflate[r] = [], this._inflate.on("error", _), this._inflate.on("data", E);
      }
      this._inflate[s] = j, this._inflate.write(g), b && this._inflate.write(a), this._inflate.flush(() => {
        const u = this._inflate[l];
        if (u) {
          this._inflate.close(), this._inflate = null, j(u);
          return;
        }
        const d = t.concat(
          this._inflate[r],
          this._inflate[i]
        );
        this._inflate._readableState.endEmitted ? (this._inflate.close(), this._inflate = null) : (this._inflate[i] = 0, this._inflate[r] = [], b && this.params[`${S}_no_context_takeover`] && this._inflate.reset()), j(null, d);
      });
    }
    /**
     * Compress data.
     *
     * @param {(Buffer|String)} data Data to compress
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @private
     */
    _compress(g, b, j) {
      const S = this._isServer ? "server" : "client";
      if (!this._deflate) {
        const u = `${S}_max_window_bits`, d = typeof this.params[u] != "number" ? o.Z_DEFAULT_WINDOWBITS : this.params[u];
        this._deflate = o.createDeflateRaw({
          ...this._options.zlibDeflateOptions,
          windowBits: d
        }), this._deflate[i] = 0, this._deflate[r] = [], this._deflate.on("data", w);
      }
      this._deflate[s] = j, this._deflate.write(g), this._deflate.flush(o.Z_SYNC_FLUSH, () => {
        if (!this._deflate)
          return;
        let u = t.concat(
          this._deflate[r],
          this._deflate[i]
        );
        b && (u = new p(u.buffer, u.byteOffset, u.length - 4)), this._deflate[s] = null, this._deflate[i] = 0, this._deflate[r] = [], b && this.params[`${S}_no_context_takeover`] && this._deflate.reset(), j(null, u);
      });
    }
  }
  oi = f;
  function w(y) {
    this[r].push(y), this[i] += y.length;
  }
  function E(y) {
    if (this[i] += y.length, this[e]._maxPayload < 1 || this[i] <= this[e]._maxPayload) {
      this[r].push(y);
      return;
    }
    this[l] = new RangeError("Max payload size exceeded"), this[l].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH", this[l][c] = 1009, this.removeListener("data", E), this.reset();
  }
  function _(y) {
    if (this[e]._inflate = null, this[l]) {
      this[s](this[l]);
      return;
    }
    y[c] = 1007, this[s](y);
  }
  return oi;
}
var Pe = { exports: {} }, ja;
function Fe() {
  if (ja) return Pe.exports;
  ja = 1;
  const { isUtf8: o } = rs, { hasBlob: t } = te(), n = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 0 - 15
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 16 - 31
    0,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    1,
    0,
    // 32 - 47
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    // 48 - 63
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    // 64 - 79
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    1,
    1,
    // 80 - 95
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    // 96 - 111
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    1,
    0,
    1,
    0
    // 112 - 127
  ];
  function c(e) {
    return e >= 1e3 && e <= 1014 && e !== 1004 && e !== 1005 && e !== 1006 || e >= 3e3 && e <= 4999;
  }
  function p(e) {
    const i = e.length;
    let s = 0;
    for (; s < i; )
      if ((e[s] & 128) === 0)
        s++;
      else if ((e[s] & 224) === 192) {
        if (s + 1 === i || (e[s + 1] & 192) !== 128 || (e[s] & 254) === 192)
          return !1;
        s += 2;
      } else if ((e[s] & 240) === 224) {
        if (s + 2 >= i || (e[s + 1] & 192) !== 128 || (e[s + 2] & 192) !== 128 || e[s] === 224 && (e[s + 1] & 224) === 128 || // Overlong
        e[s] === 237 && (e[s + 1] & 224) === 160)
          return !1;
        s += 3;
      } else if ((e[s] & 248) === 240) {
        if (s + 3 >= i || (e[s + 1] & 192) !== 128 || (e[s + 2] & 192) !== 128 || (e[s + 3] & 192) !== 128 || e[s] === 240 && (e[s + 1] & 240) === 128 || // Overlong
        e[s] === 244 && e[s + 1] > 143 || e[s] > 244)
          return !1;
        s += 4;
      } else
        return !1;
    return !0;
  }
  function a(e) {
    return t && typeof e == "object" && typeof e.arrayBuffer == "function" && typeof e.type == "string" && typeof e.stream == "function" && (e[Symbol.toStringTag] === "Blob" || e[Symbol.toStringTag] === "File");
  }
  if (Pe.exports = {
    isBlob: a,
    isValidStatusCode: c,
    isValidUTF8: p,
    tokenChars: n
  }, o)
    Pe.exports.isValidUTF8 = function(e) {
      return e.length < 24 ? p(e) : o(e);
    };
  else if (!process.env.WS_NO_UTF_8_VALIDATE)
    try {
      const e = require("utf-8-validate");
      Pe.exports.isValidUTF8 = function(i) {
        return i.length < 32 ? p(i) : e(i);
      };
    } catch {
    }
  return Pe.exports;
}
var ti, Pa;
function Pn() {
  if (Pa) return ti;
  Pa = 1;
  const { Writable: o } = De, t = Ve(), {
    BINARY_TYPES: n,
    EMPTY_BUFFER: c,
    kStatusCode: p,
    kWebSocket: a
  } = te(), { concat: e, toArrayBuffer: i, unmask: s } = He(), { isValidStatusCode: r, isValidUTF8: l } = Fe(), m = Buffer[Symbol.species], f = 0, w = 1, E = 2, _ = 3, y = 4, g = 5, b = 6;
  class j extends o {
    /**
     * Creates a Receiver instance.
     *
     * @param {Object} [options] Options object
     * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
     *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
     *     multiple times in the same tick
     * @param {String} [options.binaryType=nodebuffer] The type for binary data
     * @param {Object} [options.extensions] An object containing the negotiated
     *     extensions
     * @param {Boolean} [options.isServer=false] Specifies whether to operate in
     *     client or server mode
     * @param {Number} [options.maxPayload=0] The maximum allowed message length
     * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
     *     not to skip UTF-8 validation for text and close messages
     */
    constructor(u = {}) {
      super(), this._allowSynchronousEvents = u.allowSynchronousEvents !== void 0 ? u.allowSynchronousEvents : !0, this._binaryType = u.binaryType || n[0], this._extensions = u.extensions || {}, this._isServer = !!u.isServer, this._maxPayload = u.maxPayload | 0, this._skipUTF8Validation = !!u.skipUTF8Validation, this[a] = void 0, this._bufferedBytes = 0, this._buffers = [], this._compressed = !1, this._payloadLength = 0, this._mask = void 0, this._fragmented = 0, this._masked = !1, this._fin = !1, this._opcode = 0, this._totalPayloadLength = 0, this._messageLength = 0, this._fragments = [], this._errored = !1, this._loop = !1, this._state = f;
    }
    /**
     * Implements `Writable.prototype._write()`.
     *
     * @param {Buffer} chunk The chunk of data to write
     * @param {String} encoding The character encoding of `chunk`
     * @param {Function} cb Callback
     * @private
     */
    _write(u, d, x) {
      if (this._opcode === 8 && this._state == f) return x();
      this._bufferedBytes += u.length, this._buffers.push(u), this.startLoop(x);
    }
    /**
     * Consumes `n` bytes from the buffered data.
     *
     * @param {Number} n The number of bytes to consume
     * @return {Buffer} The consumed bytes
     * @private
     */
    consume(u) {
      if (this._bufferedBytes -= u, u === this._buffers[0].length) return this._buffers.shift();
      if (u < this._buffers[0].length) {
        const x = this._buffers[0];
        return this._buffers[0] = new m(
          x.buffer,
          x.byteOffset + u,
          x.length - u
        ), new m(x.buffer, x.byteOffset, u);
      }
      const d = Buffer.allocUnsafe(u);
      do {
        const x = this._buffers[0], h = d.length - u;
        u >= x.length ? d.set(this._buffers.shift(), h) : (d.set(new Uint8Array(x.buffer, x.byteOffset, u), h), this._buffers[0] = new m(
          x.buffer,
          x.byteOffset + u,
          x.length - u
        )), u -= x.length;
      } while (u > 0);
      return d;
    }
    /**
     * Starts the parsing loop.
     *
     * @param {Function} cb Callback
     * @private
     */
    startLoop(u) {
      this._loop = !0;
      do
        switch (this._state) {
          case f:
            this.getInfo(u);
            break;
          case w:
            this.getPayloadLength16(u);
            break;
          case E:
            this.getPayloadLength64(u);
            break;
          case _:
            this.getMask();
            break;
          case y:
            this.getData(u);
            break;
          case g:
          case b:
            this._loop = !1;
            return;
        }
      while (this._loop);
      this._errored || u();
    }
    /**
     * Reads the first two bytes of a frame.
     *
     * @param {Function} cb Callback
     * @private
     */
    getInfo(u) {
      if (this._bufferedBytes < 2) {
        this._loop = !1;
        return;
      }
      const d = this.consume(2);
      if ((d[0] & 48) !== 0) {
        const h = this.createError(
          RangeError,
          "RSV2 and RSV3 must be clear",
          !0,
          1002,
          "WS_ERR_UNEXPECTED_RSV_2_3"
        );
        u(h);
        return;
      }
      const x = (d[0] & 64) === 64;
      if (x && !this._extensions[t.extensionName]) {
        const h = this.createError(
          RangeError,
          "RSV1 must be clear",
          !0,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
        u(h);
        return;
      }
      if (this._fin = (d[0] & 128) === 128, this._opcode = d[0] & 15, this._payloadLength = d[1] & 127, this._opcode === 0) {
        if (x) {
          const h = this.createError(
            RangeError,
            "RSV1 must be clear",
            !0,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          u(h);
          return;
        }
        if (!this._fragmented) {
          const h = this.createError(
            RangeError,
            "invalid opcode 0",
            !0,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          u(h);
          return;
        }
        this._opcode = this._fragmented;
      } else if (this._opcode === 1 || this._opcode === 2) {
        if (this._fragmented) {
          const h = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            !0,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          u(h);
          return;
        }
        this._compressed = x;
      } else if (this._opcode > 7 && this._opcode < 11) {
        if (!this._fin) {
          const h = this.createError(
            RangeError,
            "FIN must be set",
            !0,
            1002,
            "WS_ERR_EXPECTED_FIN"
          );
          u(h);
          return;
        }
        if (x) {
          const h = this.createError(
            RangeError,
            "RSV1 must be clear",
            !0,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          u(h);
          return;
        }
        if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
          const h = this.createError(
            RangeError,
            `invalid payload length ${this._payloadLength}`,
            !0,
            1002,
            "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
          );
          u(h);
          return;
        }
      } else {
        const h = this.createError(
          RangeError,
          `invalid opcode ${this._opcode}`,
          !0,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
        u(h);
        return;
      }
      if (!this._fin && !this._fragmented && (this._fragmented = this._opcode), this._masked = (d[1] & 128) === 128, this._isServer) {
        if (!this._masked) {
          const h = this.createError(
            RangeError,
            "MASK must be set",
            !0,
            1002,
            "WS_ERR_EXPECTED_MASK"
          );
          u(h);
          return;
        }
      } else if (this._masked) {
        const h = this.createError(
          RangeError,
          "MASK must be clear",
          !0,
          1002,
          "WS_ERR_UNEXPECTED_MASK"
        );
        u(h);
        return;
      }
      this._payloadLength === 126 ? this._state = w : this._payloadLength === 127 ? this._state = E : this.haveLength(u);
    }
    /**
     * Gets extended payload length (7+16).
     *
     * @param {Function} cb Callback
     * @private
     */
    getPayloadLength16(u) {
      if (this._bufferedBytes < 2) {
        this._loop = !1;
        return;
      }
      this._payloadLength = this.consume(2).readUInt16BE(0), this.haveLength(u);
    }
    /**
     * Gets extended payload length (7+64).
     *
     * @param {Function} cb Callback
     * @private
     */
    getPayloadLength64(u) {
      if (this._bufferedBytes < 8) {
        this._loop = !1;
        return;
      }
      const d = this.consume(8), x = d.readUInt32BE(0);
      if (x > Math.pow(2, 21) - 1) {
        const h = this.createError(
          RangeError,
          "Unsupported WebSocket frame: payload length > 2^53 - 1",
          !1,
          1009,
          "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
        );
        u(h);
        return;
      }
      this._payloadLength = x * Math.pow(2, 32) + d.readUInt32BE(4), this.haveLength(u);
    }
    /**
     * Payload length has been read.
     *
     * @param {Function} cb Callback
     * @private
     */
    haveLength(u) {
      if (this._payloadLength && this._opcode < 8 && (this._totalPayloadLength += this._payloadLength, this._totalPayloadLength > this._maxPayload && this._maxPayload > 0)) {
        const d = this.createError(
          RangeError,
          "Max payload size exceeded",
          !1,
          1009,
          "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
        );
        u(d);
        return;
      }
      this._masked ? this._state = _ : this._state = y;
    }
    /**
     * Reads mask bytes.
     *
     * @private
     */
    getMask() {
      if (this._bufferedBytes < 4) {
        this._loop = !1;
        return;
      }
      this._mask = this.consume(4), this._state = y;
    }
    /**
     * Reads data bytes.
     *
     * @param {Function} cb Callback
     * @private
     */
    getData(u) {
      let d = c;
      if (this._payloadLength) {
        if (this._bufferedBytes < this._payloadLength) {
          this._loop = !1;
          return;
        }
        d = this.consume(this._payloadLength), this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0 && s(d, this._mask);
      }
      if (this._opcode > 7) {
        this.controlMessage(d, u);
        return;
      }
      if (this._compressed) {
        this._state = g, this.decompress(d, u);
        return;
      }
      d.length && (this._messageLength = this._totalPayloadLength, this._fragments.push(d)), this.dataMessage(u);
    }
    /**
     * Decompresses data.
     *
     * @param {Buffer} data Compressed data
     * @param {Function} cb Callback
     * @private
     */
    decompress(u, d) {
      this._extensions[t.extensionName].decompress(u, this._fin, (h, T) => {
        if (h) return d(h);
        if (T.length) {
          if (this._messageLength += T.length, this._messageLength > this._maxPayload && this._maxPayload > 0) {
            const C = this.createError(
              RangeError,
              "Max payload size exceeded",
              !1,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            d(C);
            return;
          }
          this._fragments.push(T);
        }
        this.dataMessage(d), this._state === f && this.startLoop(d);
      });
    }
    /**
     * Handles a data message.
     *
     * @param {Function} cb Callback
     * @private
     */
    dataMessage(u) {
      if (!this._fin) {
        this._state = f;
        return;
      }
      const d = this._messageLength, x = this._fragments;
      if (this._totalPayloadLength = 0, this._messageLength = 0, this._fragmented = 0, this._fragments = [], this._opcode === 2) {
        let h;
        this._binaryType === "nodebuffer" ? h = e(x, d) : this._binaryType === "arraybuffer" ? h = i(e(x, d)) : this._binaryType === "blob" ? h = new Blob(x) : h = x, this._allowSynchronousEvents ? (this.emit("message", h, !0), this._state = f) : (this._state = b, setImmediate(() => {
          this.emit("message", h, !0), this._state = f, this.startLoop(u);
        }));
      } else {
        const h = e(x, d);
        if (!this._skipUTF8Validation && !l(h)) {
          const T = this.createError(
            Error,
            "invalid UTF-8 sequence",
            !0,
            1007,
            "WS_ERR_INVALID_UTF8"
          );
          u(T);
          return;
        }
        this._state === g || this._allowSynchronousEvents ? (this.emit("message", h, !1), this._state = f) : (this._state = b, setImmediate(() => {
          this.emit("message", h, !1), this._state = f, this.startLoop(u);
        }));
      }
    }
    /**
     * Handles a control message.
     *
     * @param {Buffer} data Data to handle
     * @return {(Error|RangeError|undefined)} A possible error
     * @private
     */
    controlMessage(u, d) {
      if (this._opcode === 8) {
        if (u.length === 0)
          this._loop = !1, this.emit("conclude", 1005, c), this.end();
        else {
          const x = u.readUInt16BE(0);
          if (!r(x)) {
            const T = this.createError(
              RangeError,
              `invalid status code ${x}`,
              !0,
              1002,
              "WS_ERR_INVALID_CLOSE_CODE"
            );
            d(T);
            return;
          }
          const h = new m(
            u.buffer,
            u.byteOffset + 2,
            u.length - 2
          );
          if (!this._skipUTF8Validation && !l(h)) {
            const T = this.createError(
              Error,
              "invalid UTF-8 sequence",
              !0,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            d(T);
            return;
          }
          this._loop = !1, this.emit("conclude", x, h), this.end();
        }
        this._state = f;
        return;
      }
      this._allowSynchronousEvents ? (this.emit(this._opcode === 9 ? "ping" : "pong", u), this._state = f) : (this._state = b, setImmediate(() => {
        this.emit(this._opcode === 9 ? "ping" : "pong", u), this._state = f, this.startLoop(d);
      }));
    }
    /**
     * Builds an error object.
     *
     * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
     * @param {String} message The error message
     * @param {Boolean} prefix Specifies whether or not to add a default prefix to
     *     `message`
     * @param {Number} statusCode The status code
     * @param {String} errorCode The exposed error code
     * @return {(Error|RangeError)} The error
     * @private
     */
    createError(u, d, x, h, T) {
      this._loop = !1, this._errored = !0;
      const C = new u(
        x ? `Invalid WebSocket frame: ${d}` : d
      );
      return Error.captureStackTrace(C, this.createError), C.code = T, C[p] = h, C;
    }
  }
  return ti = j, ti;
}
var ri, Ta;
function Tn() {
  if (Ta) return ri;
  Ta = 1;
  const { Duplex: o } = De, { randomFillSync: t } = Xi, n = Ve(), { EMPTY_BUFFER: c, kWebSocket: p, NOOP: a } = te(), { isBlob: e, isValidStatusCode: i } = Fe(), { mask: s, toBuffer: r } = He(), l = Symbol("kByteLength"), m = Buffer.alloc(4), f = 8 * 1024;
  let w, E = f;
  const _ = 0, y = 1, g = 2;
  class b {
    /**
     * Creates a Sender instance.
     *
     * @param {Duplex} socket The connection socket
     * @param {Object} [extensions] An object containing the negotiated extensions
     * @param {Function} [generateMask] The function used to generate the masking
     *     key
     */
    constructor(d, x, h) {
      this._extensions = x || {}, h && (this._generateMask = h, this._maskBuffer = Buffer.alloc(4)), this._socket = d, this._firstFragment = !0, this._compress = !1, this._bufferedBytes = 0, this._queue = [], this._state = _, this.onerror = a, this[p] = void 0;
    }
    /**
     * Frames a piece of data according to the HyBi WebSocket protocol.
     *
     * @param {(Buffer|String)} data The data to frame
     * @param {Object} options Options object
     * @param {Boolean} [options.fin=false] Specifies whether or not to set the
     *     FIN bit
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
     *     key
     * @param {Number} options.opcode The opcode
     * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
     *     modified
     * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
     *     RSV1 bit
     * @return {(Buffer|String)[]} The framed data
     * @public
     */
    static frame(d, x) {
      let h, T = !1, C = 2, R = !1;
      x.mask && (h = x.maskBuffer || m, x.generateMask ? x.generateMask(h) : (E === f && (w === void 0 && (w = Buffer.alloc(f)), t(w, 0, f), E = 0), h[0] = w[E++], h[1] = w[E++], h[2] = w[E++], h[3] = w[E++]), R = (h[0] | h[1] | h[2] | h[3]) === 0, C = 6);
      let $;
      typeof d == "string" ? (!x.mask || R) && x[l] !== void 0 ? $ = x[l] : (d = Buffer.from(d), $ = d.length) : ($ = d.length, T = x.mask && x.readOnly && !R);
      let G = $;
      $ >= 65536 ? (C += 8, G = 127) : $ > 125 && (C += 2, G = 126);
      const F = Buffer.allocUnsafe(T ? $ + C : C);
      return F[0] = x.fin ? x.opcode | 128 : x.opcode, x.rsv1 && (F[0] |= 64), F[1] = G, G === 126 ? F.writeUInt16BE($, 2) : G === 127 && (F[2] = F[3] = 0, F.writeUIntBE($, 4, 6)), x.mask ? (F[1] |= 128, F[C - 4] = h[0], F[C - 3] = h[1], F[C - 2] = h[2], F[C - 1] = h[3], R ? [F, d] : T ? (s(d, h, F, C, $), [F]) : (s(d, h, d, 0, $), [F, d])) : [F, d];
    }
    /**
     * Sends a close message to the other peer.
     *
     * @param {Number} [code] The status code component of the body
     * @param {(String|Buffer)} [data] The message component of the body
     * @param {Boolean} [mask=false] Specifies whether or not to mask the message
     * @param {Function} [cb] Callback
     * @public
     */
    close(d, x, h, T) {
      let C;
      if (d === void 0)
        C = c;
      else {
        if (typeof d != "number" || !i(d))
          throw new TypeError("First argument must be a valid error code number");
        if (x === void 0 || !x.length)
          C = Buffer.allocUnsafe(2), C.writeUInt16BE(d, 0);
        else {
          const $ = Buffer.byteLength(x);
          if ($ > 123)
            throw new RangeError("The message must not be greater than 123 bytes");
          C = Buffer.allocUnsafe(2 + $), C.writeUInt16BE(d, 0), typeof x == "string" ? C.write(x, 2) : C.set(x, 2);
        }
      }
      const R = {
        [l]: C.length,
        fin: !0,
        generateMask: this._generateMask,
        mask: h,
        maskBuffer: this._maskBuffer,
        opcode: 8,
        readOnly: !1,
        rsv1: !1
      };
      this._state !== _ ? this.enqueue([this.dispatch, C, !1, R, T]) : this.sendFrame(b.frame(C, R), T);
    }
    /**
     * Sends a ping message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
     * @param {Function} [cb] Callback
     * @public
     */
    ping(d, x, h) {
      let T, C;
      if (typeof d == "string" ? (T = Buffer.byteLength(d), C = !1) : e(d) ? (T = d.size, C = !1) : (d = r(d), T = d.length, C = r.readOnly), T > 125)
        throw new RangeError("The data size must not be greater than 125 bytes");
      const R = {
        [l]: T,
        fin: !0,
        generateMask: this._generateMask,
        mask: x,
        maskBuffer: this._maskBuffer,
        opcode: 9,
        readOnly: C,
        rsv1: !1
      };
      e(d) ? this._state !== _ ? this.enqueue([this.getBlobData, d, !1, R, h]) : this.getBlobData(d, !1, R, h) : this._state !== _ ? this.enqueue([this.dispatch, d, !1, R, h]) : this.sendFrame(b.frame(d, R), h);
    }
    /**
     * Sends a pong message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
     * @param {Function} [cb] Callback
     * @public
     */
    pong(d, x, h) {
      let T, C;
      if (typeof d == "string" ? (T = Buffer.byteLength(d), C = !1) : e(d) ? (T = d.size, C = !1) : (d = r(d), T = d.length, C = r.readOnly), T > 125)
        throw new RangeError("The data size must not be greater than 125 bytes");
      const R = {
        [l]: T,
        fin: !0,
        generateMask: this._generateMask,
        mask: x,
        maskBuffer: this._maskBuffer,
        opcode: 10,
        readOnly: C,
        rsv1: !1
      };
      e(d) ? this._state !== _ ? this.enqueue([this.getBlobData, d, !1, R, h]) : this.getBlobData(d, !1, R, h) : this._state !== _ ? this.enqueue([this.dispatch, d, !1, R, h]) : this.sendFrame(b.frame(d, R), h);
    }
    /**
     * Sends a data message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Object} options Options object
     * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
     *     or text
     * @param {Boolean} [options.compress=false] Specifies whether or not to
     *     compress `data`
     * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
     *     last one
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Function} [cb] Callback
     * @public
     */
    send(d, x, h) {
      const T = this._extensions[n.extensionName];
      let C = x.binary ? 2 : 1, R = x.compress, $, G;
      typeof d == "string" ? ($ = Buffer.byteLength(d), G = !1) : e(d) ? ($ = d.size, G = !1) : (d = r(d), $ = d.length, G = r.readOnly), this._firstFragment ? (this._firstFragment = !1, R && T && T.params[T._isServer ? "server_no_context_takeover" : "client_no_context_takeover"] && (R = $ >= T._threshold), this._compress = R) : (R = !1, C = 0), x.fin && (this._firstFragment = !0);
      const F = {
        [l]: $,
        fin: x.fin,
        generateMask: this._generateMask,
        mask: x.mask,
        maskBuffer: this._maskBuffer,
        opcode: C,
        readOnly: G,
        rsv1: R
      };
      e(d) ? this._state !== _ ? this.enqueue([this.getBlobData, d, this._compress, F, h]) : this.getBlobData(d, this._compress, F, h) : this._state !== _ ? this.enqueue([this.dispatch, d, this._compress, F, h]) : this.dispatch(d, this._compress, F, h);
    }
    /**
     * Gets the contents of a blob as binary data.
     *
     * @param {Blob} blob The blob
     * @param {Boolean} [compress=false] Specifies whether or not to compress
     *     the data
     * @param {Object} options Options object
     * @param {Boolean} [options.fin=false] Specifies whether or not to set the
     *     FIN bit
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
     *     key
     * @param {Number} options.opcode The opcode
     * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
     *     modified
     * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
     *     RSV1 bit
     * @param {Function} [cb] Callback
     * @private
     */
    getBlobData(d, x, h, T) {
      this._bufferedBytes += h[l], this._state = g, d.arrayBuffer().then((C) => {
        if (this._socket.destroyed) {
          const $ = new Error(
            "The socket was closed while the blob was being read"
          );
          process.nextTick(j, this, $, T);
          return;
        }
        this._bufferedBytes -= h[l];
        const R = r(C);
        x ? this.dispatch(R, x, h, T) : (this._state = _, this.sendFrame(b.frame(R, h), T), this.dequeue());
      }).catch((C) => {
        process.nextTick(S, this, C, T);
      });
    }
    /**
     * Dispatches a message.
     *
     * @param {(Buffer|String)} data The message to send
     * @param {Boolean} [compress=false] Specifies whether or not to compress
     *     `data`
     * @param {Object} options Options object
     * @param {Boolean} [options.fin=false] Specifies whether or not to set the
     *     FIN bit
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
     *     key
     * @param {Number} options.opcode The opcode
     * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
     *     modified
     * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
     *     RSV1 bit
     * @param {Function} [cb] Callback
     * @private
     */
    dispatch(d, x, h, T) {
      if (!x) {
        this.sendFrame(b.frame(d, h), T);
        return;
      }
      const C = this._extensions[n.extensionName];
      this._bufferedBytes += h[l], this._state = y, C.compress(d, h.fin, (R, $) => {
        if (this._socket.destroyed) {
          const G = new Error(
            "The socket was closed while data was being compressed"
          );
          j(this, G, T);
          return;
        }
        this._bufferedBytes -= h[l], this._state = _, h.readOnly = !1, this.sendFrame(b.frame($, h), T), this.dequeue();
      });
    }
    /**
     * Executes queued send operations.
     *
     * @private
     */
    dequeue() {
      for (; this._state === _ && this._queue.length; ) {
        const d = this._queue.shift();
        this._bufferedBytes -= d[3][l], Reflect.apply(d[0], this, d.slice(1));
      }
    }
    /**
     * Enqueues a send operation.
     *
     * @param {Array} params Send operation parameters.
     * @private
     */
    enqueue(d) {
      this._bufferedBytes += d[3][l], this._queue.push(d);
    }
    /**
     * Sends a frame.
     *
     * @param {(Buffer | String)[]} list The frame to send
     * @param {Function} [cb] Callback
     * @private
     */
    sendFrame(d, x) {
      d.length === 2 ? (this._socket.cork(), this._socket.write(d[0]), this._socket.write(d[1], x), this._socket.uncork()) : this._socket.write(d[0], x);
    }
  }
  ri = b;
  function j(u, d, x) {
    typeof x == "function" && x(d);
    for (let h = 0; h < u._queue.length; h++) {
      const T = u._queue[h], C = T[T.length - 1];
      typeof C == "function" && C(d);
    }
  }
  function S(u, d, x) {
    j(u, d, x), u.onerror(d);
  }
  return ri;
}
var ci, Oa;
function Qs() {
  if (Oa) return ci;
  Oa = 1;
  const { kForOnEventAttribute: o, kListener: t } = te(), n = Symbol("kCode"), c = Symbol("kData"), p = Symbol("kError"), a = Symbol("kMessage"), e = Symbol("kReason"), i = Symbol("kTarget"), s = Symbol("kType"), r = Symbol("kWasClean");
  class l {
    /**
     * Create a new `Event`.
     *
     * @param {String} type The name of the event
     * @throws {TypeError} If the `type` argument is not specified
     */
    constructor(g) {
      this[i] = null, this[s] = g;
    }
    /**
     * @type {*}
     */
    get target() {
      return this[i];
    }
    /**
     * @type {String}
     */
    get type() {
      return this[s];
    }
  }
  Object.defineProperty(l.prototype, "target", { enumerable: !0 }), Object.defineProperty(l.prototype, "type", { enumerable: !0 });
  class m extends l {
    /**
     * Create a new `CloseEvent`.
     *
     * @param {String} type The name of the event
     * @param {Object} [options] A dictionary object that allows for setting
     *     attributes via object members of the same name
     * @param {Number} [options.code=0] The status code explaining why the
     *     connection was closed
     * @param {String} [options.reason=''] A human-readable string explaining why
     *     the connection was closed
     * @param {Boolean} [options.wasClean=false] Indicates whether or not the
     *     connection was cleanly closed
     */
    constructor(g, b = {}) {
      super(g), this[n] = b.code === void 0 ? 0 : b.code, this[e] = b.reason === void 0 ? "" : b.reason, this[r] = b.wasClean === void 0 ? !1 : b.wasClean;
    }
    /**
     * @type {Number}
     */
    get code() {
      return this[n];
    }
    /**
     * @type {String}
     */
    get reason() {
      return this[e];
    }
    /**
     * @type {Boolean}
     */
    get wasClean() {
      return this[r];
    }
  }
  Object.defineProperty(m.prototype, "code", { enumerable: !0 }), Object.defineProperty(m.prototype, "reason", { enumerable: !0 }), Object.defineProperty(m.prototype, "wasClean", { enumerable: !0 });
  class f extends l {
    /**
     * Create a new `ErrorEvent`.
     *
     * @param {String} type The name of the event
     * @param {Object} [options] A dictionary object that allows for setting
     *     attributes via object members of the same name
     * @param {*} [options.error=null] The error that generated this event
     * @param {String} [options.message=''] The error message
     */
    constructor(g, b = {}) {
      super(g), this[p] = b.error === void 0 ? null : b.error, this[a] = b.message === void 0 ? "" : b.message;
    }
    /**
     * @type {*}
     */
    get error() {
      return this[p];
    }
    /**
     * @type {String}
     */
    get message() {
      return this[a];
    }
  }
  Object.defineProperty(f.prototype, "error", { enumerable: !0 }), Object.defineProperty(f.prototype, "message", { enumerable: !0 });
  class w extends l {
    /**
     * Create a new `MessageEvent`.
     *
     * @param {String} type The name of the event
     * @param {Object} [options] A dictionary object that allows for setting
     *     attributes via object members of the same name
     * @param {*} [options.data=null] The message content
     */
    constructor(g, b = {}) {
      super(g), this[c] = b.data === void 0 ? null : b.data;
    }
    /**
     * @type {*}
     */
    get data() {
      return this[c];
    }
  }
  Object.defineProperty(w.prototype, "data", { enumerable: !0 }), ci = {
    CloseEvent: m,
    ErrorEvent: f,
    Event: l,
    EventTarget: {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(y, g, b = {}) {
        for (const S of this.listeners(y))
          if (!b[o] && S[t] === g && !S[o])
            return;
        let j;
        if (y === "message")
          j = function(u, d) {
            const x = new w("message", {
              data: d ? u : u.toString()
            });
            x[i] = this, _(g, this, x);
          };
        else if (y === "close")
          j = function(u, d) {
            const x = new m("close", {
              code: u,
              reason: d.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            x[i] = this, _(g, this, x);
          };
        else if (y === "error")
          j = function(u) {
            const d = new f("error", {
              error: u,
              message: u.message
            });
            d[i] = this, _(g, this, d);
          };
        else if (y === "open")
          j = function() {
            const u = new l("open");
            u[i] = this, _(g, this, u);
          };
        else
          return;
        j[o] = !!b[o], j[t] = g, b.once ? this.once(y, j) : this.on(y, j);
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(y, g) {
        for (const b of this.listeners(y))
          if (b[t] === g && !b[o]) {
            this.removeListener(y, b);
            break;
          }
      }
    },
    MessageEvent: w
  };
  function _(y, g, b) {
    typeof y == "object" && y.handleEvent ? y.handleEvent.call(y, b) : y.call(g, b);
  }
  return ci;
}
var pi, Ca;
function On() {
  if (Ca) return pi;
  Ca = 1;
  const { tokenChars: o } = Fe();
  function t(p, a, e) {
    p[a] === void 0 ? p[a] = [e] : p[a].push(e);
  }
  function n(p) {
    const a = /* @__PURE__ */ Object.create(null);
    let e = /* @__PURE__ */ Object.create(null), i = !1, s = !1, r = !1, l, m, f = -1, w = -1, E = -1, _ = 0;
    for (; _ < p.length; _++)
      if (w = p.charCodeAt(_), l === void 0)
        if (E === -1 && o[w] === 1)
          f === -1 && (f = _);
        else if (_ !== 0 && (w === 32 || w === 9))
          E === -1 && f !== -1 && (E = _);
        else if (w === 59 || w === 44) {
          if (f === -1)
            throw new SyntaxError(`Unexpected character at index ${_}`);
          E === -1 && (E = _);
          const g = p.slice(f, E);
          w === 44 ? (t(a, g, e), e = /* @__PURE__ */ Object.create(null)) : l = g, f = E = -1;
        } else
          throw new SyntaxError(`Unexpected character at index ${_}`);
      else if (m === void 0)
        if (E === -1 && o[w] === 1)
          f === -1 && (f = _);
        else if (w === 32 || w === 9)
          E === -1 && f !== -1 && (E = _);
        else if (w === 59 || w === 44) {
          if (f === -1)
            throw new SyntaxError(`Unexpected character at index ${_}`);
          E === -1 && (E = _), t(e, p.slice(f, E), !0), w === 44 && (t(a, l, e), e = /* @__PURE__ */ Object.create(null), l = void 0), f = E = -1;
        } else if (w === 61 && f !== -1 && E === -1)
          m = p.slice(f, _), f = E = -1;
        else
          throw new SyntaxError(`Unexpected character at index ${_}`);
      else if (s) {
        if (o[w] !== 1)
          throw new SyntaxError(`Unexpected character at index ${_}`);
        f === -1 ? f = _ : i || (i = !0), s = !1;
      } else if (r)
        if (o[w] === 1)
          f === -1 && (f = _);
        else if (w === 34 && f !== -1)
          r = !1, E = _;
        else if (w === 92)
          s = !0;
        else
          throw new SyntaxError(`Unexpected character at index ${_}`);
      else if (w === 34 && p.charCodeAt(_ - 1) === 61)
        r = !0;
      else if (E === -1 && o[w] === 1)
        f === -1 && (f = _);
      else if (f !== -1 && (w === 32 || w === 9))
        E === -1 && (E = _);
      else if (w === 59 || w === 44) {
        if (f === -1)
          throw new SyntaxError(`Unexpected character at index ${_}`);
        E === -1 && (E = _);
        let g = p.slice(f, E);
        i && (g = g.replace(/\\/g, ""), i = !1), t(e, m, g), w === 44 && (t(a, l, e), e = /* @__PURE__ */ Object.create(null), l = void 0), m = void 0, f = E = -1;
      } else
        throw new SyntaxError(`Unexpected character at index ${_}`);
    if (f === -1 || r || w === 32 || w === 9)
      throw new SyntaxError("Unexpected end of input");
    E === -1 && (E = _);
    const y = p.slice(f, E);
    return l === void 0 ? t(a, y, e) : (m === void 0 ? t(e, y, !0) : i ? t(e, m, y.replace(/\\/g, "")) : t(e, m, y), t(a, l, e)), a;
  }
  function c(p) {
    return Object.keys(p).map((a) => {
      let e = p[a];
      return Array.isArray(e) || (e = [e]), e.map((i) => [a].concat(
        Object.keys(i).map((s) => {
          let r = i[s];
          return Array.isArray(r) || (r = [r]), r.map((l) => l === !0 ? s : `${s}=${l}`).join("; ");
        })
      ).join("; ")).join(", ");
    }).join(", ");
  }
  return pi = { format: c, parse: n }, pi;
}
var li, La;
function Ki() {
  if (La) return li;
  La = 1;
  const o = We, t = yn, n = Ji, c = ss, p = os, { randomBytes: a, createHash: e } = Xi, { Duplex: i, Readable: s } = De, { URL: r } = Qn, l = Ve(), m = Pn(), f = Tn(), { isBlob: w } = Fe(), {
    BINARY_TYPES: E,
    EMPTY_BUFFER: _,
    GUID: y,
    kForOnEventAttribute: g,
    kListener: b,
    kStatusCode: j,
    kWebSocket: S,
    NOOP: u
  } = te(), {
    EventTarget: { addEventListener: d, removeEventListener: x }
  } = Qs(), { format: h, parse: T } = On(), { toBuffer: C } = He(), R = 30 * 1e3, $ = Symbol("kAborted"), G = [8, 13], F = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"], Z = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
  class A extends o {
    /**
     * Create a new `WebSocket`.
     *
     * @param {(String|URL)} address The URL to which to connect
     * @param {(String|String[])} [protocols] The subprotocols
     * @param {Object} [options] Connection options
     */
    constructor(k, L, N) {
      super(), this._binaryType = E[0], this._closeCode = 1006, this._closeFrameReceived = !1, this._closeFrameSent = !1, this._closeMessage = _, this._closeTimer = null, this._errorEmitted = !1, this._extensions = {}, this._paused = !1, this._protocol = "", this._readyState = A.CONNECTING, this._receiver = null, this._sender = null, this._socket = null, k !== null ? (this._bufferedAmount = 0, this._isServer = !1, this._redirects = 0, L === void 0 ? L = [] : Array.isArray(L) || (typeof L == "object" && L !== null ? (N = L, L = []) : L = [L]), ae(this, k, L, N)) : (this._autoPong = N.autoPong, this._isServer = !0);
    }
    /**
     * For historical reasons, the custom "nodebuffer" type is used by the default
     * instead of "blob".
     *
     * @type {String}
     */
    get binaryType() {
      return this._binaryType;
    }
    set binaryType(k) {
      E.includes(k) && (this._binaryType = k, this._receiver && (this._receiver._binaryType = k));
    }
    /**
     * @type {Number}
     */
    get bufferedAmount() {
      return this._socket ? this._socket._writableState.length + this._sender._bufferedBytes : this._bufferedAmount;
    }
    /**
     * @type {String}
     */
    get extensions() {
      return Object.keys(this._extensions).join();
    }
    /**
     * @type {Boolean}
     */
    get isPaused() {
      return this._paused;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onclose() {
      return null;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onerror() {
      return null;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onopen() {
      return null;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onmessage() {
      return null;
    }
    /**
     * @type {String}
     */
    get protocol() {
      return this._protocol;
    }
    /**
     * @type {Number}
     */
    get readyState() {
      return this._readyState;
    }
    /**
     * @type {String}
     */
    get url() {
      return this._url;
    }
    /**
     * Set up the socket and the internal resources.
     *
     * @param {Duplex} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Object} options Options object
     * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
     *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
     *     multiple times in the same tick
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Number} [options.maxPayload=0] The maximum allowed message size
     * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
     *     not to skip UTF-8 validation for text and close messages
     * @private
     */
    setSocket(k, L, N) {
      const O = new m({
        allowSynchronousEvents: N.allowSynchronousEvents,
        binaryType: this.binaryType,
        extensions: this._extensions,
        isServer: this._isServer,
        maxPayload: N.maxPayload,
        skipUTF8Validation: N.skipUTF8Validation
      }), W = new f(k, this._extensions, N.generateMask);
      this._receiver = O, this._sender = W, this._socket = k, O[S] = this, W[S] = this, k[S] = this, O.on("conclude", In), O.on("drain", Mn), O.on("error", Rn), O.on("message", qn), O.on("ping", Un), O.on("pong", zn), W.onerror = $n, k.setTimeout && k.setTimeout(0), k.setNoDelay && k.setNoDelay(), L.length > 0 && k.unshift(L), k.on("close", ta), k.on("data", Me), k.on("end", ra), k.on("error", ca), this._readyState = A.OPEN, this.emit("open");
    }
    /**
     * Emit the `'close'` event.
     *
     * @private
     */
    emitClose() {
      if (!this._socket) {
        this._readyState = A.CLOSED, this.emit("close", this._closeCode, this._closeMessage);
        return;
      }
      this._extensions[l.extensionName] && this._extensions[l.extensionName].cleanup(), this._receiver.removeAllListeners(), this._readyState = A.CLOSED, this.emit("close", this._closeCode, this._closeMessage);
    }
    /**
     * Start a closing handshake.
     *
     *          +----------+   +-----------+   +----------+
     *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
     *    |     +----------+   +-----------+   +----------+     |
     *          +----------+   +-----------+         |
     * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
     *          +----------+   +-----------+   |
     *    |           |                        |   +---+        |
     *                +------------------------+-->|fin| - - - -
     *    |         +---+                      |   +---+
     *     - - - - -|fin|<---------------------+
     *              +---+
     *
     * @param {Number} [code] Status code explaining why the connection is closing
     * @param {(String|Buffer)} [data] The reason why the connection is
     *     closing
     * @public
     */
    close(k, L) {
      if (this.readyState !== A.CLOSED) {
        if (this.readyState === A.CONNECTING) {
          K(this, this._req, "WebSocket was closed before the connection was established");
          return;
        }
        if (this.readyState === A.CLOSING) {
          this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted) && this._socket.end();
          return;
        }
        this._readyState = A.CLOSING, this._sender.close(k, L, !this._isServer, (N) => {
          N || (this._closeFrameSent = !0, (this._closeFrameReceived || this._receiver._writableState.errorEmitted) && this._socket.end());
        }), oa(this);
      }
    }
    /**
     * Pause the socket.
     *
     * @public
     */
    pause() {
      this.readyState === A.CONNECTING || this.readyState === A.CLOSED || (this._paused = !0, this._socket.pause());
    }
    /**
     * Send a ping.
     *
     * @param {*} [data] The data to send
     * @param {Boolean} [mask] Indicates whether or not to mask `data`
     * @param {Function} [cb] Callback which is executed when the ping is sent
     * @public
     */
    ping(k, L, N) {
      if (this.readyState === A.CONNECTING)
        throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      if (typeof k == "function" ? (N = k, k = L = void 0) : typeof L == "function" && (N = L, L = void 0), typeof k == "number" && (k = k.toString()), this.readyState !== A.OPEN) {
        Ke(this, k, N);
        return;
      }
      L === void 0 && (L = !this._isServer), this._sender.ping(k || _, L, N);
    }
    /**
     * Send a pong.
     *
     * @param {*} [data] The data to send
     * @param {Boolean} [mask] Indicates whether or not to mask `data`
     * @param {Function} [cb] Callback which is executed when the pong is sent
     * @public
     */
    pong(k, L, N) {
      if (this.readyState === A.CONNECTING)
        throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      if (typeof k == "function" ? (N = k, k = L = void 0) : typeof L == "function" && (N = L, L = void 0), typeof k == "number" && (k = k.toString()), this.readyState !== A.OPEN) {
        Ke(this, k, N);
        return;
      }
      L === void 0 && (L = !this._isServer), this._sender.pong(k || _, L, N);
    }
    /**
     * Resume the socket.
     *
     * @public
     */
    resume() {
      this.readyState === A.CONNECTING || this.readyState === A.CLOSED || (this._paused = !1, this._receiver._writableState.needDrain || this._socket.resume());
    }
    /**
     * Send a data message.
     *
     * @param {*} data The message to send
     * @param {Object} [options] Options object
     * @param {Boolean} [options.binary] Specifies whether `data` is binary or
     *     text
     * @param {Boolean} [options.compress] Specifies whether or not to compress
     *     `data`
     * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
     *     last one
     * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
     * @param {Function} [cb] Callback which is executed when data is written out
     * @public
     */
    send(k, L, N) {
      if (this.readyState === A.CONNECTING)
        throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      if (typeof L == "function" && (N = L, L = {}), typeof k == "number" && (k = k.toString()), this.readyState !== A.OPEN) {
        Ke(this, k, N);
        return;
      }
      const O = {
        binary: typeof k != "string",
        mask: !this._isServer,
        compress: !0,
        fin: !0,
        ...L
      };
      this._extensions[l.extensionName] || (O.compress = !1), this._sender.send(k || _, O, N);
    }
    /**
     * Forcibly close the connection.
     *
     * @public
     */
    terminate() {
      if (this.readyState !== A.CLOSED) {
        if (this.readyState === A.CONNECTING) {
          K(this, this._req, "WebSocket was closed before the connection was established");
          return;
        }
        this._socket && (this._readyState = A.CLOSING, this._socket.destroy());
      }
    }
  }
  Object.defineProperty(A, "CONNECTING", {
    enumerable: !0,
    value: F.indexOf("CONNECTING")
  }), Object.defineProperty(A.prototype, "CONNECTING", {
    enumerable: !0,
    value: F.indexOf("CONNECTING")
  }), Object.defineProperty(A, "OPEN", {
    enumerable: !0,
    value: F.indexOf("OPEN")
  }), Object.defineProperty(A.prototype, "OPEN", {
    enumerable: !0,
    value: F.indexOf("OPEN")
  }), Object.defineProperty(A, "CLOSING", {
    enumerable: !0,
    value: F.indexOf("CLOSING")
  }), Object.defineProperty(A.prototype, "CLOSING", {
    enumerable: !0,
    value: F.indexOf("CLOSING")
  }), Object.defineProperty(A, "CLOSED", {
    enumerable: !0,
    value: F.indexOf("CLOSED")
  }), Object.defineProperty(A.prototype, "CLOSED", {
    enumerable: !0,
    value: F.indexOf("CLOSED")
  }), [
    "binaryType",
    "bufferedAmount",
    "extensions",
    "isPaused",
    "protocol",
    "readyState",
    "url"
  ].forEach((v) => {
    Object.defineProperty(A.prototype, v, { enumerable: !0 });
  }), ["open", "error", "close", "message"].forEach((v) => {
    Object.defineProperty(A.prototype, `on${v}`, {
      enumerable: !0,
      get() {
        for (const k of this.listeners(v))
          if (k[g]) return k[b];
        return null;
      },
      set(k) {
        for (const L of this.listeners(v))
          if (L[g]) {
            this.removeListener(v, L);
            break;
          }
        typeof k == "function" && this.addEventListener(v, k, {
          [g]: !0
        });
      }
    });
  }), A.prototype.addEventListener = d, A.prototype.removeEventListener = x, li = A;
  function ae(v, k, L, N) {
    const O = {
      allowSynchronousEvents: !0,
      autoPong: !0,
      protocolVersion: G[1],
      maxPayload: 104857600,
      skipUTF8Validation: !1,
      perMessageDeflate: !0,
      followRedirects: !1,
      maxRedirects: 10,
      ...N,
      socketPath: void 0,
      hostname: void 0,
      protocol: void 0,
      timeout: void 0,
      method: "GET",
      host: void 0,
      path: void 0,
      port: void 0
    };
    if (v._autoPong = O.autoPong, !G.includes(O.protocolVersion))
      throw new RangeError(
        `Unsupported protocol version: ${O.protocolVersion} (supported versions: ${G.join(", ")})`
      );
    let W;
    if (k instanceof r)
      W = k;
    else
      try {
        W = new r(k);
      } catch {
        throw new SyntaxError(`Invalid URL: ${k}`);
      }
    W.protocol === "http:" ? W.protocol = "ws:" : W.protocol === "https:" && (W.protocol = "wss:"), v._url = W.href;
    const de = W.protocol === "wss:", me = W.protocol === "ws+unix:";
    let we;
    if (W.protocol !== "ws:" && !de && !me ? we = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"` : me && !W.pathname ? we = "The URL's pathname is empty" : W.hash && (we = "The URL contains a fragment identifier"), we) {
      const B = new SyntaxError(we);
      if (v._redirects === 0)
        throw B;
      re(v, B);
      return;
    }
    const pa = de ? 443 : 80, la = a(16).toString("base64"), ua = de ? t.request : n.request, _e = /* @__PURE__ */ new Set();
    let ke;
    if (O.createConnection = O.createConnection || (de ? Qe : Ye), O.defaultPort = O.defaultPort || pa, O.port = W.port || pa, O.host = W.hostname.startsWith("[") ? W.hostname.slice(1, -1) : W.hostname, O.headers = {
      ...O.headers,
      "Sec-WebSocket-Version": O.protocolVersion,
      "Sec-WebSocket-Key": la,
      Connection: "Upgrade",
      Upgrade: "websocket"
    }, O.path = W.pathname + W.search, O.timeout = O.handshakeTimeout, O.perMessageDeflate && (ke = new l(
      O.perMessageDeflate !== !0 ? O.perMessageDeflate : {},
      !1,
      O.maxPayload
    ), O.headers["Sec-WebSocket-Extensions"] = h({
      [l.extensionName]: ke.offer()
    })), L.length) {
      for (const B of L) {
        if (typeof B != "string" || !Z.test(B) || _e.has(B))
          throw new SyntaxError(
            "An invalid or duplicated subprotocol was specified"
          );
        _e.add(B);
      }
      O.headers["Sec-WebSocket-Protocol"] = L.join(",");
    }
    if (O.origin && (O.protocolVersion < 13 ? O.headers["Sec-WebSocket-Origin"] = O.origin : O.headers.Origin = O.origin), (W.username || W.password) && (O.auth = `${W.username}:${W.password}`), me) {
      const B = O.path.split(":");
      O.socketPath = B[0], O.path = B[1];
    }
    let J;
    if (O.followRedirects) {
      if (v._redirects === 0) {
        v._originalIpc = me, v._originalSecure = de, v._originalHostOrSocketPath = me ? O.socketPath : W.host;
        const B = N && N.headers;
        if (N = { ...N, headers: {} }, B)
          for (const [Y, fe] of Object.entries(B))
            N.headers[Y.toLowerCase()] = fe;
      } else if (v.listenerCount("redirect") === 0) {
        const B = me ? v._originalIpc ? O.socketPath === v._originalHostOrSocketPath : !1 : v._originalIpc ? !1 : W.host === v._originalHostOrSocketPath;
        (!B || v._originalSecure && !de) && (delete O.headers.authorization, delete O.headers.cookie, B || delete O.headers.host, O.auth = void 0);
      }
      O.auth && !N.headers.authorization && (N.headers.authorization = "Basic " + Buffer.from(O.auth).toString("base64")), J = v._req = ua(O), v._redirects && v.emit("redirect", v.url, J);
    } else
      J = v._req = ua(O);
    O.timeout && J.on("timeout", () => {
      K(v, J, "Opening handshake has timed out");
    }), J.on("error", (B) => {
      J === null || J[$] || (J = v._req = null, re(v, B));
    }), J.on("response", (B) => {
      const Y = B.headers.location, fe = B.statusCode;
      if (Y && O.followRedirects && fe >= 300 && fe < 400) {
        if (++v._redirects > O.maxRedirects) {
          K(v, J, "Maximum redirects exceeded");
          return;
        }
        J.abort();
        let Ee;
        try {
          Ee = new r(Y, k);
        } catch {
          const xe = new SyntaxError(`Invalid URL: ${Y}`);
          re(v, xe);
          return;
        }
        ae(v, Ee, L, N);
      } else v.emit("unexpected-response", J, B) || K(
        v,
        J,
        `Unexpected server response: ${B.statusCode}`
      );
    }), J.on("upgrade", (B, Y, fe) => {
      if (v.emit("upgrade", B), v.readyState !== A.CONNECTING) return;
      J = v._req = null;
      const Ee = B.headers.upgrade;
      if (Ee === void 0 || Ee.toLowerCase() !== "websocket") {
        K(v, Y, "Invalid Upgrade header");
        return;
      }
      const da = e("sha1").update(la + y).digest("base64");
      if (B.headers["sec-websocket-accept"] !== da) {
        K(v, Y, "Invalid Sec-WebSocket-Accept header");
        return;
      }
      const xe = B.headers["sec-websocket-protocol"];
      let Se;
      if (xe !== void 0 ? _e.size ? _e.has(xe) || (Se = "Server sent an invalid subprotocol") : Se = "Server sent a subprotocol but none was requested" : _e.size && (Se = "Server sent no subprotocol"), Se) {
        K(v, Y, Se);
        return;
      }
      xe && (v._protocol = xe);
      const ma = B.headers["sec-websocket-extensions"];
      if (ma !== void 0) {
        if (!ke) {
          K(v, Y, "Server sent a Sec-WebSocket-Extensions header but no extension was requested");
          return;
        }
        let Ze;
        try {
          Ze = T(ma);
        } catch {
          K(v, Y, "Invalid Sec-WebSocket-Extensions header");
          return;
        }
        const fa = Object.keys(Ze);
        if (fa.length !== 1 || fa[0] !== l.extensionName) {
          K(v, Y, "Server indicated an extension that was not requested");
          return;
        }
        try {
          ke.accept(Ze[l.extensionName]);
        } catch {
          K(v, Y, "Invalid Sec-WebSocket-Extensions header");
          return;
        }
        v._extensions[l.extensionName] = ke;
      }
      v.setSocket(Y, fe, {
        allowSynchronousEvents: O.allowSynchronousEvents,
        generateMask: O.generateMask,
        maxPayload: O.maxPayload,
        skipUTF8Validation: O.skipUTF8Validation
      });
    }), O.finishRequest ? O.finishRequest(J, v) : J.end();
  }
  function re(v, k) {
    v._readyState = A.CLOSING, v._errorEmitted = !0, v.emit("error", k), v.emitClose();
  }
  function Ye(v) {
    return v.path = v.socketPath, c.connect(v);
  }
  function Qe(v) {
    return v.path = void 0, !v.servername && v.servername !== "" && (v.servername = c.isIP(v.host) ? "" : v.host), p.connect(v);
  }
  function K(v, k, L) {
    v._readyState = A.CLOSING;
    const N = new Error(L);
    Error.captureStackTrace(N, K), k.setHeader ? (k[$] = !0, k.abort(), k.socket && !k.socket.destroyed && k.socket.destroy(), process.nextTick(re, v, N)) : (k.destroy(N), k.once("error", v.emit.bind(v, "error")), k.once("close", v.emitClose.bind(v)));
  }
  function Ke(v, k, L) {
    if (k) {
      const N = w(k) ? k.size : C(k).length;
      v._socket ? v._sender._bufferedBytes += N : v._bufferedAmount += N;
    }
    if (L) {
      const N = new Error(
        `WebSocket is not open: readyState ${v.readyState} (${F[v.readyState]})`
      );
      process.nextTick(L, N);
    }
  }
  function In(v, k) {
    const L = this[S];
    L._closeFrameReceived = !0, L._closeMessage = k, L._closeCode = v, L._socket[S] !== void 0 && (L._socket.removeListener("data", Me), process.nextTick(sa, L._socket), v === 1005 ? L.close() : L.close(v, k));
  }
  function Mn() {
    const v = this[S];
    v.isPaused || v._socket.resume();
  }
  function Rn(v) {
    const k = this[S];
    k._socket[S] !== void 0 && (k._socket.removeListener("data", Me), process.nextTick(sa, k._socket), k.close(v[j])), k._errorEmitted || (k._errorEmitted = !0, k.emit("error", v));
  }
  function na() {
    this[S].emitClose();
  }
  function qn(v, k) {
    this[S].emit("message", v, k);
  }
  function Un(v) {
    const k = this[S];
    k._autoPong && k.pong(v, !this._isServer, u), k.emit("ping", v);
  }
  function zn(v) {
    this[S].emit("pong", v);
  }
  function sa(v) {
    v.resume();
  }
  function $n(v) {
    const k = this[S];
    k.readyState !== A.CLOSED && (k.readyState === A.OPEN && (k._readyState = A.CLOSING, oa(k)), this._socket.end(), k._errorEmitted || (k._errorEmitted = !0, k.emit("error", v)));
  }
  function oa(v) {
    v._closeTimer = setTimeout(
      v._socket.destroy.bind(v._socket),
      R
    );
  }
  function ta() {
    const v = this[S];
    this.removeListener("close", ta), this.removeListener("data", Me), this.removeListener("end", ra), v._readyState = A.CLOSING;
    let k;
    !this._readableState.endEmitted && !v._closeFrameReceived && !v._receiver._writableState.errorEmitted && (k = v._socket.read()) !== null && v._receiver.write(k), v._receiver.end(), this[S] = void 0, clearTimeout(v._closeTimer), v._receiver._writableState.finished || v._receiver._writableState.errorEmitted ? v.emitClose() : (v._receiver.on("error", na), v._receiver.on("finish", na));
  }
  function Me(v) {
    this[S]._receiver.write(v) || this.pause();
  }
  function ra() {
    const v = this[S];
    v._readyState = A.CLOSING, v._receiver.end(), this.end();
  }
  function ca() {
    const v = this[S];
    this.removeListener("error", ca), this.on("error", u), v && (v._readyState = A.CLOSING, this.destroy());
  }
  return li;
}
var ui, Aa;
function Ks() {
  if (Aa) return ui;
  Aa = 1, Ki();
  const { Duplex: o } = De;
  function t(a) {
    a.emit("close");
  }
  function n() {
    !this.destroyed && this._writableState.finished && this.destroy();
  }
  function c(a) {
    this.removeListener("error", c), this.destroy(), this.listenerCount("error") === 0 && this.emit("error", a);
  }
  function p(a, e) {
    let i = !0;
    const s = new o({
      ...e,
      autoDestroy: !1,
      emitClose: !1,
      objectMode: !1,
      writableObjectMode: !1
    });
    return a.on("message", function(l, m) {
      const f = !m && s._readableState.objectMode ? l.toString() : l;
      s.push(f) || a.pause();
    }), a.once("error", function(l) {
      s.destroyed || (i = !1, s.destroy(l));
    }), a.once("close", function() {
      s.destroyed || s.push(null);
    }), s._destroy = function(r, l) {
      if (a.readyState === a.CLOSED) {
        l(r), process.nextTick(t, s);
        return;
      }
      let m = !1;
      a.once("error", function(w) {
        m = !0, l(w);
      }), a.once("close", function() {
        m || l(r), process.nextTick(t, s);
      }), i && a.terminate();
    }, s._final = function(r) {
      if (a.readyState === a.CONNECTING) {
        a.once("open", function() {
          s._final(r);
        });
        return;
      }
      a._socket !== null && (a._socket._writableState.finished ? (r(), s._readableState.endEmitted && s.destroy()) : (a._socket.once("finish", function() {
        r();
      }), a.close()));
    }, s._read = function() {
      a.isPaused && a.resume();
    }, s._write = function(r, l, m) {
      if (a.readyState === a.CONNECTING) {
        a.once("open", function() {
          s._write(r, l, m);
        });
        return;
      }
      a.send(r, m);
    }, s.on("end", n), s.on("error", c), s;
  }
  return ui = p, ui;
}
Ks();
Pn();
Tn();
var Zs = Ki();
const eo = /* @__PURE__ */ Ge(Zs);
var di, Da;
function io() {
  if (Da) return di;
  Da = 1;
  const { tokenChars: o } = Fe();
  function t(n) {
    const c = /* @__PURE__ */ new Set();
    let p = -1, a = -1, e = 0;
    for (e; e < n.length; e++) {
      const s = n.charCodeAt(e);
      if (a === -1 && o[s] === 1)
        p === -1 && (p = e);
      else if (e !== 0 && (s === 32 || s === 9))
        a === -1 && p !== -1 && (a = e);
      else if (s === 44) {
        if (p === -1)
          throw new SyntaxError(`Unexpected character at index ${e}`);
        a === -1 && (a = e);
        const r = n.slice(p, a);
        if (c.has(r))
          throw new SyntaxError(`The "${r}" subprotocol is duplicated`);
        c.add(r), p = a = -1;
      } else
        throw new SyntaxError(`Unexpected character at index ${e}`);
    }
    if (p === -1 || a !== -1)
      throw new SyntaxError("Unexpected end of input");
    const i = n.slice(p, e);
    if (c.has(i))
      throw new SyntaxError(`The "${i}" subprotocol is duplicated`);
    return c.add(i), c;
  }
  return di = { parse: t }, di;
}
var mi, Na;
function ao() {
  if (Na) return mi;
  Na = 1;
  const o = We, t = Ji, { Duplex: n } = De, { createHash: c } = Xi, p = On(), a = Ve(), e = io(), i = Ki(), { GUID: s, kWebSocket: r } = te(), l = /^[+/0-9A-Za-z]{22}==$/, m = 0, f = 1, w = 2;
  class E extends o {
    /**
     * Create a `WebSocketServer` instance.
     *
     * @param {Object} options Configuration options
     * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
     *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
     *     multiple times in the same tick
     * @param {Boolean} [options.autoPong=true] Specifies whether or not to
     *     automatically send a pong in response to a ping
     * @param {Number} [options.backlog=511] The maximum length of the queue of
     *     pending connections
     * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
     *     track clients
     * @param {Function} [options.handleProtocols] A hook to handle protocols
     * @param {String} [options.host] The hostname where to bind the server
     * @param {Number} [options.maxPayload=104857600] The maximum allowed message
     *     size
     * @param {Boolean} [options.noServer=false] Enable no server mode
     * @param {String} [options.path] Accept only connections matching this path
     * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
     *     permessage-deflate
     * @param {Number} [options.port] The port where to bind the server
     * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
     *     server to use
     * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
     *     not to skip UTF-8 validation for text and close messages
     * @param {Function} [options.verifyClient] A hook to reject connections
     * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
     *     class to use. It must be the `WebSocket` class or class that extends it
     * @param {Function} [callback] A listener for the `listening` event
     */
    constructor(u, d) {
      if (super(), u = {
        allowSynchronousEvents: !0,
        autoPong: !0,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: !1,
        perMessageDeflate: !1,
        handleProtocols: null,
        clientTracking: !0,
        verifyClient: null,
        noServer: !1,
        backlog: null,
        // use default (511 as implemented in net.js)
        server: null,
        host: null,
        path: null,
        port: null,
        WebSocket: i,
        ...u
      }, u.port == null && !u.server && !u.noServer || u.port != null && (u.server || u.noServer) || u.server && u.noServer)
        throw new TypeError(
          'One and only one of the "port", "server", or "noServer" options must be specified'
        );
      if (u.port != null ? (this._server = t.createServer((x, h) => {
        const T = t.STATUS_CODES[426];
        h.writeHead(426, {
          "Content-Length": T.length,
          "Content-Type": "text/plain"
        }), h.end(T);
      }), this._server.listen(
        u.port,
        u.host,
        u.backlog,
        d
      )) : u.server && (this._server = u.server), this._server) {
        const x = this.emit.bind(this, "connection");
        this._removeListeners = _(this._server, {
          listening: this.emit.bind(this, "listening"),
          error: this.emit.bind(this, "error"),
          upgrade: (h, T, C) => {
            this.handleUpgrade(h, T, C, x);
          }
        });
      }
      u.perMessageDeflate === !0 && (u.perMessageDeflate = {}), u.clientTracking && (this.clients = /* @__PURE__ */ new Set(), this._shouldEmitClose = !1), this.options = u, this._state = m;
    }
    /**
     * Returns the bound address, the address family name, and port of the server
     * as reported by the operating system if listening on an IP socket.
     * If the server is listening on a pipe or UNIX domain socket, the name is
     * returned as a string.
     *
     * @return {(Object|String|null)} The address of the server
     * @public
     */
    address() {
      if (this.options.noServer)
        throw new Error('The server is operating in "noServer" mode');
      return this._server ? this._server.address() : null;
    }
    /**
     * Stop the server from accepting new connections and emit the `'close'` event
     * when all existing connections are closed.
     *
     * @param {Function} [cb] A one-time listener for the `'close'` event
     * @public
     */
    close(u) {
      if (this._state === w) {
        u && this.once("close", () => {
          u(new Error("The server is not running"));
        }), process.nextTick(y, this);
        return;
      }
      if (u && this.once("close", u), this._state !== f)
        if (this._state = f, this.options.noServer || this.options.server)
          this._server && (this._removeListeners(), this._removeListeners = this._server = null), this.clients ? this.clients.size ? this._shouldEmitClose = !0 : process.nextTick(y, this) : process.nextTick(y, this);
        else {
          const d = this._server;
          this._removeListeners(), this._removeListeners = this._server = null, d.close(() => {
            y(this);
          });
        }
    }
    /**
     * See if a given request should be handled by this server instance.
     *
     * @param {http.IncomingMessage} req Request object to inspect
     * @return {Boolean} `true` if the request is valid, else `false`
     * @public
     */
    shouldHandle(u) {
      if (this.options.path) {
        const d = u.url.indexOf("?");
        if ((d !== -1 ? u.url.slice(0, d) : u.url) !== this.options.path) return !1;
      }
      return !0;
    }
    /**
     * Handle a HTTP Upgrade request.
     *
     * @param {http.IncomingMessage} req The request object
     * @param {Duplex} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Function} cb Callback
     * @public
     */
    handleUpgrade(u, d, x, h) {
      d.on("error", g);
      const T = u.headers["sec-websocket-key"], C = u.headers.upgrade, R = +u.headers["sec-websocket-version"];
      if (u.method !== "GET") {
        j(this, u, d, 405, "Invalid HTTP method");
        return;
      }
      if (C === void 0 || C.toLowerCase() !== "websocket") {
        j(this, u, d, 400, "Invalid Upgrade header");
        return;
      }
      if (T === void 0 || !l.test(T)) {
        j(this, u, d, 400, "Missing or invalid Sec-WebSocket-Key header");
        return;
      }
      if (R !== 13 && R !== 8) {
        j(this, u, d, 400, "Missing or invalid Sec-WebSocket-Version header", {
          "Sec-WebSocket-Version": "13, 8"
        });
        return;
      }
      if (!this.shouldHandle(u)) {
        b(d, 400);
        return;
      }
      const $ = u.headers["sec-websocket-protocol"];
      let G = /* @__PURE__ */ new Set();
      if ($ !== void 0)
        try {
          G = e.parse($);
        } catch {
          j(this, u, d, 400, "Invalid Sec-WebSocket-Protocol header");
          return;
        }
      const F = u.headers["sec-websocket-extensions"], Z = {};
      if (this.options.perMessageDeflate && F !== void 0) {
        const A = new a(
          this.options.perMessageDeflate,
          !0,
          this.options.maxPayload
        );
        try {
          const ae = p.parse(F);
          ae[a.extensionName] && (A.accept(ae[a.extensionName]), Z[a.extensionName] = A);
        } catch {
          j(this, u, d, 400, "Invalid or unacceptable Sec-WebSocket-Extensions header");
          return;
        }
      }
      if (this.options.verifyClient) {
        const A = {
          origin: u.headers[`${R === 8 ? "sec-websocket-origin" : "origin"}`],
          secure: !!(u.socket.authorized || u.socket.encrypted),
          req: u
        };
        if (this.options.verifyClient.length === 2) {
          this.options.verifyClient(A, (ae, re, Ye, Qe) => {
            if (!ae)
              return b(d, re || 401, Ye, Qe);
            this.completeUpgrade(
              Z,
              T,
              G,
              u,
              d,
              x,
              h
            );
          });
          return;
        }
        if (!this.options.verifyClient(A)) return b(d, 401);
      }
      this.completeUpgrade(Z, T, G, u, d, x, h);
    }
    /**
     * Upgrade the connection to WebSocket.
     *
     * @param {Object} extensions The accepted extensions
     * @param {String} key The value of the `Sec-WebSocket-Key` header
     * @param {Set} protocols The subprotocols
     * @param {http.IncomingMessage} req The request object
     * @param {Duplex} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Function} cb Callback
     * @throws {Error} If called more than once with the same socket
     * @private
     */
    completeUpgrade(u, d, x, h, T, C, R) {
      if (!T.readable || !T.writable) return T.destroy();
      if (T[r])
        throw new Error(
          "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
        );
      if (this._state > m) return b(T, 503);
      const G = [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${c("sha1").update(d + s).digest("base64")}`
      ], F = new this.options.WebSocket(null, void 0, this.options);
      if (x.size) {
        const Z = this.options.handleProtocols ? this.options.handleProtocols(x, h) : x.values().next().value;
        Z && (G.push(`Sec-WebSocket-Protocol: ${Z}`), F._protocol = Z);
      }
      if (u[a.extensionName]) {
        const Z = u[a.extensionName].params, A = p.format({
          [a.extensionName]: [Z]
        });
        G.push(`Sec-WebSocket-Extensions: ${A}`), F._extensions = u;
      }
      this.emit("headers", G, h), T.write(G.concat(`\r
`).join(`\r
`)), T.removeListener("error", g), F.setSocket(T, C, {
        allowSynchronousEvents: this.options.allowSynchronousEvents,
        maxPayload: this.options.maxPayload,
        skipUTF8Validation: this.options.skipUTF8Validation
      }), this.clients && (this.clients.add(F), F.on("close", () => {
        this.clients.delete(F), this._shouldEmitClose && !this.clients.size && process.nextTick(y, this);
      })), R(F, h);
    }
  }
  mi = E;
  function _(S, u) {
    for (const d of Object.keys(u)) S.on(d, u[d]);
    return function() {
      for (const x of Object.keys(u))
        S.removeListener(x, u[x]);
    };
  }
  function y(S) {
    S._state = w, S.emit("close");
  }
  function g() {
    this.destroy();
  }
  function b(S, u, d, x) {
    d = d || t.STATUS_CODES[u], x = {
      Connection: "close",
      "Content-Type": "text/html",
      "Content-Length": Buffer.byteLength(d),
      ...x
    }, S.once("finish", S.destroy), S.end(
      `HTTP/1.1 ${u} ${t.STATUS_CODES[u]}\r
` + Object.keys(x).map((h) => `${h}: ${x[h]}`).join(`\r
`) + `\r
\r
` + d
    );
  }
  function j(S, u, d, x, h, T) {
    if (S.listenerCount("wsClientError")) {
      const C = new Error(h);
      Error.captureStackTrace(C, j), S.emit("wsClientError", C, d, u);
    } else
      b(d, x, h, T);
  }
  return mi;
}
ao();
const qe = () => jn.get("token"), Fa = (o) => jn.set("token", o), Zi = (() => {
  U.ensureDirSync(ye);
  const o = P.join(ye, ".client");
  if (cs(o))
    return ps(o, "utf-8");
  {
    const t = as().slice(0, 16);
    return ls(o, t), t;
  }
})();
class no {
  constructor() {
    I(this, "loggedIn");
    I(this, "eventEmitter", new Zn());
    I(this, "socket", null);
    I(this, "onReceiveWebSocketMessageCB", () => {
    });
    const t = qe();
    this.loggedIn = !!t, t && this.openWebSocket(t);
  }
  onReceiveWebSocketMessage(t) {
    this.onReceiveWebSocketMessageCB = t;
  }
  registEvent(t, n) {
    this.eventEmitter.on(t, n);
  }
  openWebSocket(t) {
    try {
      this.socket && this.closeWebSocket(), console.log(`wss://${ge.split("://")[1]}/api/v1/socket`), this.socket = new eo(`wss://${ge.split("://")[1]}/api/v1/socket`, {
        headers: {
          Authorization: `Bearer ${t}`
        }
      }), this.socket.on("message", (n) => {
        this.onReceiveWebSocketMessageCB(JSON.parse(n.toString()));
      }), this.socket.on("open", () => {
        console.log("oap socket connected");
      }), this.socket.on("close", () => {
        console.log("oap socket closed");
      }), this.socket.on("error", (n) => {
        console.error("oap socket error", n);
      });
    } catch (n) {
      console.error("openWebSocket", n);
    }
  }
  closeWebSocket() {
    try {
      this.socket && (this.socket.close(), this.socket = null);
    } catch (t) {
      console.error("closeWebSocket", t);
    }
  }
  login(t) {
    Fa(t), this.loggedIn = !0, this.eventEmitter.emit("login"), this.openWebSocket(t);
  }
  async logout() {
    qe() && await this.fetch("/api/v1/user/logout").catch(console.error), Fa(""), this.loggedIn = !1, this.eventEmitter.emit("logout");
    const n = `http://${H.ip}:${H.port}`;
    fetch(`${n}/api/plugins/oap-platform/auth`, { method: "DELETE" }).then((c) => console.log("oap logout", c.status)), this.closeWebSocket();
  }
  fetch(t, n = {}) {
    const c = qe();
    if (!c)
      throw this.logout(), new Error("not logged in");
    return fetch(`${ge}${t}`, {
      ...n,
      headers: {
        ...n.headers,
        Authorization: `Bearer ${c}`,
        "User-Agent": `Dive Desktop(${Zi})-${_n.version}`
      }
    }).then((p) => p.text()).then((p) => {
      try {
        return JSON.parse(p);
      } catch {
        return p;
      }
    });
  }
  getMCPTags() {
    return this.fetch("/api/v1/mcp/tags");
  }
  getMCPServers() {
    return this.fetch("/api/v1/user/mcp/configs");
  }
  searchMCPServer(t) {
    return this.fetch("/api/v1/user/mcp/search2", {
      method: "POST",
      body: JSON.stringify(t)
    });
  }
  modelDescription(t) {
    return t && (t == null ? void 0 : t.models.length) > 0 ? this.fetch("/api/v1/llms/query", {
      method: "POST",
      body: JSON.stringify(t)
    }) : this.fetch("/api/v1/llms");
  }
  applyMCPServer(t) {
    return this.fetch("/api/v1/user/mcp/apply", {
      method: "POST",
      body: JSON.stringify(t)
    });
  }
  getMe() {
    return this.fetch("/api/v1/user/me");
  }
  getUsage() {
    return this.fetch("/api/v1/user/usage");
  }
  limiterCheck(t) {
    return this.fetch("/api/v1/user/limiter/check", {
      method: "POST",
      body: JSON.stringify(t)
    });
  }
}
const Q = new no(), { autoUpdater: V } = ns(import.meta.url)("electron-updater"), Ia = `${ge}/api/v1/version`, so = {
  provider: "github",
  owner: "OpenAgentPlatform",
  repo: "Dive"
}, oo = 3600 * 1e3, to = 3 * 1e3;
let Re = !1;
function ro(o) {
  V.autoDownload = !1, V.disableWebInstaller = !1, V.allowDowngrade = !1, process.env.DEBUG && (V.updateConfigPath = P.join(Sn, "dev-app-update.yml")), M.isPackaged && (setTimeout(() => {
    t();
  }, to), setInterval(() => {
    t();
  }, oo));
  async function t() {
    try {
      console.log("Performing automatic update check..."), Re || await Ma(), await V.checkForUpdatesAndNotify();
    } catch (n) {
      console.error("Auto update check failed:", n);
    }
  }
  V.on("checking-for-update", function() {
  }), V.on("update-available", (n) => {
    o.webContents.send("update-can-available", { update: !0, version: M.getVersion(), newVersion: n == null ? void 0 : n.version });
  }), V.on("update-not-available", (n) => {
    o.webContents.send("update-can-available", { update: !1, version: M.getVersion(), newVersion: n == null ? void 0 : n.version });
  }), D.handle("check-update", async () => {
    if (!M.isPackaged) {
      const n = new Error("The update feature is only available after the package.");
      return { message: n.message, error: n };
    }
    try {
      return Re || await Ma(), await V.checkForUpdatesAndNotify();
    } catch (n) {
      if (console.error("Primary update server failed:", n), !Re) {
        console.log("Switching to fallback update server (GitHub)"), Re = !0, po();
        try {
          return await V.checkForUpdatesAndNotify();
        } catch (c) {
          return console.error("Fallback update server also failed:", c), { message: "All update servers failed", error: c };
        }
      }
      return { message: "Network error", error: n };
    }
  }), D.handle("start-download", (n) => {
    co(
      (c, p) => {
        c ? n.sender.send("update-error", { message: c.message, error: c }) : n.sender.send("download-progress", p);
      },
      () => {
        n.sender.send("update-downloaded");
      }
    );
  }), D.handle("quit-and-install", () => {
    V.quitAndInstall(!1, !0);
  });
}
function co(o, t) {
  V.on("download-progress", (n) => o(null, n)), V.on("error", (n) => o(n, null)), V.on("update-downloaded", t), V.downloadUpdate();
}
async function Ma() {
  console.log("Configuring primary update server:", Ia), V.requestHeaders = {
    "User-Agent": `DiveDesktop/${M.getVersion()}`,
    "X-Dive-Id": Zi
  }, V.setFeedURL({
    provider: "generic",
    url: Ia
  });
}
function po() {
  console.log("Configuring fallback update server: GitHub"), V.requestHeaders = {}, V.setFeedURL(so);
}
function lo(o) {
  D.handle("env:getPlatform", async () => process.platform), D.handle("env:port", async () => H.port), D.handle("env:getResourcesPath", async (t, n) => M.isPackaged ? P.join(process.resourcesPath, n) : n), D.handle("env:isDev", async () => !!se);
}
function uo(o) {
  if (!process.env.APPIMAGE)
    return !1;
  try {
    const t = process.env.APPIMAGE;
    try {
      ds(`chmod +x "${t}"`);
    } catch (p) {
      console.error("Failed to set executable permission for AppImage", p);
    }
    const n = z.join(
      process.env.HOME || "~",
      ".config/autostart"
    );
    U.existsSync(n) || U.mkdirSync(n, { recursive: !0 });
    const c = z.join(n, "dive-ai.desktop");
    if (o) {
      const p = fo();
      U.writeFileSync(c, p);
    } else
      U.existsSync(c) && U.unlinkSync(c);
    return !0;
  } catch {
    return !1;
  }
}
function mo() {
  if (!process.env.APPIMAGE)
    return !1;
  const o = z.join(
    process.env.HOME || "~",
    ".config/autostart/dive-ai.desktop"
  );
  return U.existsSync(o);
}
function fo() {
  const o = z.join(process.env.VITE_PUBLIC, "linux", "dive-ai.desktop");
  return (U.existsSync(o) ? U.readFileSync(o, "utf-8") : `[Desktop Entry]
Type=Application
Name=Dive AI
Exec=%EXEC%
Icon=%ICON%
StartupNotify=false
Terminal=false
Categories=Utility;
%APPEND%`).replace("%EXEC%", process.env.APPIMAGE).replace("%ICON%", z.join(process.env.VITE_PUBLIC, "icon.ico")).replace("%APPEND%", "X-GNOME-Autostart-enabled=true");
}
let ie = null;
function Cn(o) {
  if (process.platform === "darwin")
    return;
  const t = process.platform === "win32" ? P.join(process.env.VITE_PUBLIC, "icon.ico") : P.join(process.env.VITE_PUBLIC, "icon.png");
  ie = new Vn(t), ie.setToolTip(M.getName()), xo(o), ie.on("click", () => {
    o.show();
  });
}
function xo(o) {
  const t = [
    {
      label: "Open",
      click: () => {
        o.show();
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        be.setIsQuitting(!0), M.quit();
      }
    }
  ], n = Gi.buildFromTemplate(t);
  ie == null || ie.setContextMenu(n);
}
function ho() {
  ie == null || ie.destroy(), ie = null;
}
function vo(o) {
  D.handle("system:openScriptsDir", async () => {
    Hi.openPath(Te);
  }), D.handle("system:getAutoLaunch", () => process.env.APPIMAGE ? mo() : M.getLoginItemSettings().openAtLogin), D.handle("system:setAutoLaunch", (t, n) => (Ce.set("autoLaunch", n), process.env.APPIMAGE ? uo(n) : M.setLoginItemSettings({
    openAtLogin: n,
    openAsHidden: !1
  }), n)), D.handle("system:getMinimalToTray", () => Ce.get("minimalToTray")), D.handle("system:setMinimalToTray", (t, n) => {
    Ce.set("minimalToTray", n), be.setIsQuitting(!n), n ? Cn(o) : ho();
  }), D.handle("system:closeWindow", () => {
    o.close();
  }), D.handle("system:hideWindow", () => {
    o.hide();
  });
}
const go = "oaphub-dive.desktop";
function bo(o) {
  return o.startsWith("dive://signin/") ? "login" : o.includes("refresh") ? "refresh" : o.includes("mcp.install") ? "mcp.install" : o.includes("mcp.oauth.redirect") ? "mcp.oauth.redirect" : "unknown";
}
async function Je() {
  const o = `http://${H.ip}:${H.port}`;
  await fetch(`${o}/api/plugins/oap-platform/config/refresh`, { method: "POST" }).then((t) => t.json()).then((t) => console.log("refresh config", t));
}
function yo(o) {
  const t = async (n, c) => {
    const p = `http://${n}:${c}`;
    await fetch(`${p}/api/plugins/oap-platform/auth`, {
      method: "POST",
      body: JSON.stringify({ token: o }),
      headers: {
        "Content-Type": "application/json"
      }
    }).then((a) => a.json()).then((a) => console.log("set token to host", a)).then(Je).catch(console.error), Q.login(o);
  };
  H.port ? t(H.ip, H.port) : zs(t), Q.login(o);
}
function wo(o) {
  const t = o.split("/").pop();
  if (!t) {
    console.error("No token found in deep link");
    return;
  }
  console.info("login from deep link"), yo(t);
}
async function Ln(o, t) {
  const n = $e.getAllWindows();
  switch (!o && n.length && (o = n[0]), o ? (o.show(), o.focus()) : await aa().catch(console.error), bo(t)) {
    case "login":
      wo(t);
      break;
    case "refresh":
      o == null || o.webContents.send("refresh"), Je().catch(console.error);
      break;
    case "mcp.install":
      const c = new URL(t);
      o == null || o.webContents.send("mcp.install", {
        name: c.searchParams.get("name") || "",
        config: c.searchParams.get("config") || ""
      });
      break;
    case "mcp.oauth.redirect":
      const p = `http://${H.ip}:${H.port}`;
      fetch(`${p}/api/tools/login/oauth/callback?${t.split("?")[1]}`);
      break;
    case "open":
      o == null || o.show(), o == null || o.focus();
      break;
  }
}
async function _o() {
  if (!(process.platform !== "linux" || !process.env.APPIMAGE))
    try {
      const o = M.getPath("exe");
      if (!o) {
        console.error("Could not determine App path.");
        return;
      }
      const t = M.getPath("home"), n = P.join(t, ".local", "share", "applications"), c = P.join(n, go);
      await U.mkdir(n, { recursive: !0 });
      const p = `[Desktop Entry]
Name=Dive
Exec=${Ra(o)} %U
Terminal=false
Type=Application
MimeType=x-scheme-handler/dive;
NoDisplay=true
`;
      await U.writeFile(c, p, "utf-8"), console.info(`Created/Updated desktop file: ${c}`);
      try {
        const { stdout: a, stderr: e } = bn(`update-desktop-database ${Ra(n)}`);
        e && console.warn(`update-desktop-database stderr: ${e}`), console.info(`update-desktop-database stdout: ${a}`), console.info("Desktop database updated successfully.");
      } catch (a) {
        console.error("Failed to update desktop database:", a);
      }
    } catch (o) {
      console.error("Failed to setup AppImage deep link:", o);
    }
}
function Ra(o) {
  return `'${o.replace(/'/g, "'\\''")}'`;
}
var ee = {}, ce = {}, qa;
function ko() {
  if (qa) return ce;
  qa = 1, Object.defineProperty(ce, "__esModule", { value: !0 }), ce.sync = ce.isexe = void 0;
  const o = ue, t = wn, n = async (e, i = {}) => {
    const { ignoreErrors: s = !1 } = i;
    try {
      return p(await (0, t.stat)(e), i);
    } catch (r) {
      const l = r;
      if (s || l.code === "EACCES")
        return !1;
      throw l;
    }
  };
  ce.isexe = n;
  const c = (e, i = {}) => {
    const { ignoreErrors: s = !1 } = i;
    try {
      return p((0, o.statSync)(e), i);
    } catch (r) {
      const l = r;
      if (s || l.code === "EACCES")
        return !1;
      throw l;
    }
  };
  ce.sync = c;
  const p = (e, i) => e.isFile() && a(e, i), a = (e, i) => {
    var j, S, u;
    const s = i.uid ?? ((j = process.getuid) == null ? void 0 : j.call(process)), r = i.groups ?? ((S = process.getgroups) == null ? void 0 : S.call(process)) ?? [], l = i.gid ?? ((u = process.getgid) == null ? void 0 : u.call(process)) ?? r[0];
    if (s === void 0 || l === void 0)
      throw new Error("cannot get uid or gid");
    const m = /* @__PURE__ */ new Set([l, ...r]), f = e.mode, w = e.uid, E = e.gid, _ = parseInt("100", 8), y = parseInt("010", 8), g = parseInt("001", 8), b = _ | y;
    return !!(f & g || f & y && m.has(E) || f & _ && w === s || f & b && s === 0);
  };
  return ce;
}
var pe = {}, Ua;
function Eo() {
  if (Ua) return pe;
  Ua = 1, Object.defineProperty(pe, "__esModule", { value: !0 }), pe.sync = pe.isexe = void 0;
  const o = ue, t = wn, n = async (e, i = {}) => {
    const { ignoreErrors: s = !1 } = i;
    try {
      return a(await (0, t.stat)(e), e, i);
    } catch (r) {
      const l = r;
      if (s || l.code === "EACCES")
        return !1;
      throw l;
    }
  };
  pe.isexe = n;
  const c = (e, i = {}) => {
    const { ignoreErrors: s = !1 } = i;
    try {
      return a((0, o.statSync)(e), e, i);
    } catch (r) {
      const l = r;
      if (s || l.code === "EACCES")
        return !1;
      throw l;
    }
  };
  pe.sync = c;
  const p = (e, i) => {
    const { pathExt: s = process.env.PATHEXT || "" } = i, r = s.split(";");
    if (r.indexOf("") !== -1)
      return !0;
    for (let l = 0; l < r.length; l++) {
      const m = r[l].toLowerCase(), f = e.substring(e.length - m.length).toLowerCase();
      if (m && f === m)
        return !0;
    }
    return !1;
  }, a = (e, i, s) => e.isFile() && p(i, s);
  return pe;
}
var fi = {}, za;
function So() {
  return za || (za = 1, Object.defineProperty(fi, "__esModule", { value: !0 })), fi;
}
var $a;
function jo() {
  return $a || ($a = 1, function(o) {
    var t = ee && ee.__createBinding || (Object.create ? function(r, l, m, f) {
      f === void 0 && (f = m);
      var w = Object.getOwnPropertyDescriptor(l, m);
      (!w || ("get" in w ? !l.__esModule : w.writable || w.configurable)) && (w = { enumerable: !0, get: function() {
        return l[m];
      } }), Object.defineProperty(r, f, w);
    } : function(r, l, m, f) {
      f === void 0 && (f = m), r[f] = l[m];
    }), n = ee && ee.__setModuleDefault || (Object.create ? function(r, l) {
      Object.defineProperty(r, "default", { enumerable: !0, value: l });
    } : function(r, l) {
      r.default = l;
    }), c = ee && ee.__importStar || function(r) {
      if (r && r.__esModule) return r;
      var l = {};
      if (r != null)
        for (var m in r) m !== "default" && Object.prototype.hasOwnProperty.call(r, m) && t(l, r, m);
      return n(l, r), l;
    }, p = ee && ee.__exportStar || function(r, l) {
      for (var m in r) m !== "default" && !Object.prototype.hasOwnProperty.call(l, m) && t(l, r, m);
    };
    Object.defineProperty(o, "__esModule", { value: !0 }), o.sync = o.isexe = o.posix = o.win32 = void 0;
    const a = c(ko());
    o.posix = a;
    const e = c(Eo());
    o.win32 = e, p(So(), o);
    const s = (process.env._ISEXE_TEST_PLATFORM_ || process.platform) === "win32" ? e : a;
    o.isexe = s.isexe, o.sync = s.sync;
  }(ee)), ee;
}
var xi, Ba;
function Po() {
  if (Ba) return xi;
  Ba = 1;
  const { isexe: o, sync: t } = jo(), { join: n, delimiter: c, sep: p, posix: a } = z, e = process.platform === "win32", i = new RegExp(`[${a.sep}${p === a.sep ? "" : p}]`.replace(/(\\)/g, "\\$1")), s = new RegExp(`^\\.${i.source}`), r = (E) => Object.assign(new Error(`not found: ${E}`), { code: "ENOENT" }), l = (E, {
    path: _ = process.env.PATH,
    pathExt: y = process.env.PATHEXT,
    delimiter: g = c
  }) => {
    const b = E.match(i) ? [""] : [
      // windows always checks the cwd first
      ...e ? [process.cwd()] : [],
      ...(_ || /* istanbul ignore next: very unusual */
      "").split(g)
    ];
    if (e) {
      const j = y || [".EXE", ".CMD", ".BAT", ".COM"].join(g), S = j.split(g).flatMap((u) => [u, u.toLowerCase()]);
      return E.includes(".") && S[0] !== "" && S.unshift(""), { pathEnv: b, pathExt: S, pathExtExe: j };
    }
    return { pathEnv: b, pathExt: [""] };
  }, m = (E, _) => {
    const y = /^".*"$/.test(E) ? E.slice(1, -1) : E;
    return (!y && s.test(_) ? _.slice(0, 2) : "") + n(y, _);
  }, f = async (E, _ = {}) => {
    const { pathEnv: y, pathExt: g, pathExtExe: b } = l(E, _), j = [];
    for (const S of y) {
      const u = m(S, E);
      for (const d of g) {
        const x = u + d;
        if (await o(x, { pathExt: b, ignoreErrors: !0 })) {
          if (!_.all)
            return x;
          j.push(x);
        }
      }
    }
    if (_.all && j.length)
      return j;
    if (_.nothrow)
      return null;
    throw r(E);
  }, w = (E, _ = {}) => {
    const { pathEnv: y, pathExt: g, pathExtExe: b } = l(E, _), j = [];
    for (const S of y) {
      const u = m(S, E);
      for (const d of g) {
        const x = u + d;
        if (t(x, { pathExt: b, ignoreErrors: !0 })) {
          if (!_.all)
            return x;
          j.push(x);
        }
      }
    }
    if (_.all && j.length)
      return j;
    if (_.nothrow)
      return null;
    throw r(E);
  };
  return xi = f, f.sync = w, xi;
}
var To = Po();
const Oo = /* @__PURE__ */ Ge(To);
var hi = {};
const Co = {
  "application/1d-interleaved-parityfec": { source: "iana" },
  "application/3gpdash-qoe-report+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/3gpp-ims+xml": { source: "iana", compressible: !0 },
  "application/3gpphal+json": { source: "iana", compressible: !0 },
  "application/3gpphalforms+json": { source: "iana", compressible: !0 },
  "application/a2l": { source: "iana" },
  "application/ace+cbor": { source: "iana" },
  "application/activemessage": { source: "iana" },
  "application/activity+json": { source: "iana", compressible: !0 },
  "application/alto-costmap+json": { source: "iana", compressible: !0 },
  "application/alto-costmapfilter+json": { source: "iana", compressible: !0 },
  "application/alto-directory+json": { source: "iana", compressible: !0 },
  "application/alto-endpointcost+json": { source: "iana", compressible: !0 },
  "application/alto-endpointcostparams+json": { source: "iana", compressible: !0 },
  "application/alto-endpointprop+json": { source: "iana", compressible: !0 },
  "application/alto-endpointpropparams+json": { source: "iana", compressible: !0 },
  "application/alto-error+json": { source: "iana", compressible: !0 },
  "application/alto-networkmap+json": { source: "iana", compressible: !0 },
  "application/alto-networkmapfilter+json": { source: "iana", compressible: !0 },
  "application/alto-updatestreamcontrol+json": { source: "iana", compressible: !0 },
  "application/alto-updatestreamparams+json": { source: "iana", compressible: !0 },
  "application/aml": { source: "iana" },
  "application/andrew-inset": { source: "iana", extensions: ["ez"] },
  "application/applefile": { source: "iana" },
  "application/applixware": { source: "apache", extensions: ["aw"] },
  "application/at+jwt": { source: "iana" },
  "application/atf": { source: "iana" },
  "application/atfx": { source: "iana" },
  "application/atom+xml": { source: "iana", compressible: !0, extensions: ["atom"] },
  "application/atomcat+xml": { source: "iana", compressible: !0, extensions: ["atomcat"] },
  "application/atomdeleted+xml": { source: "iana", compressible: !0, extensions: ["atomdeleted"] },
  "application/atomicmail": { source: "iana" },
  "application/atomsvc+xml": { source: "iana", compressible: !0, extensions: ["atomsvc"] },
  "application/atsc-dwd+xml": { source: "iana", compressible: !0, extensions: ["dwd"] },
  "application/atsc-dynamic-event-message": { source: "iana" },
  "application/atsc-held+xml": { source: "iana", compressible: !0, extensions: ["held"] },
  "application/atsc-rdt+json": { source: "iana", compressible: !0 },
  "application/atsc-rsat+xml": { source: "iana", compressible: !0, extensions: ["rsat"] },
  "application/atxml": { source: "iana" },
  "application/auth-policy+xml": { source: "iana", compressible: !0 },
  "application/bacnet-xdd+zip": { source: "iana", compressible: !1 },
  "application/batch-smtp": { source: "iana" },
  "application/bdoc": { compressible: !1, extensions: ["bdoc"] },
  "application/beep+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/calendar+json": { source: "iana", compressible: !0 },
  "application/calendar+xml": { source: "iana", compressible: !0, extensions: ["xcs"] },
  "application/call-completion": { source: "iana" },
  "application/cals-1840": { source: "iana" },
  "application/captive+json": { source: "iana", compressible: !0 },
  "application/cbor": { source: "iana" },
  "application/cbor-seq": { source: "iana" },
  "application/cccex": { source: "iana" },
  "application/ccmp+xml": { source: "iana", compressible: !0 },
  "application/ccxml+xml": { source: "iana", compressible: !0, extensions: ["ccxml"] },
  "application/cdfx+xml": { source: "iana", compressible: !0, extensions: ["cdfx"] },
  "application/cdmi-capability": { source: "iana", extensions: ["cdmia"] },
  "application/cdmi-container": { source: "iana", extensions: ["cdmic"] },
  "application/cdmi-domain": { source: "iana", extensions: ["cdmid"] },
  "application/cdmi-object": { source: "iana", extensions: ["cdmio"] },
  "application/cdmi-queue": { source: "iana", extensions: ["cdmiq"] },
  "application/cdni": { source: "iana" },
  "application/cea": { source: "iana" },
  "application/cea-2018+xml": { source: "iana", compressible: !0 },
  "application/cellml+xml": { source: "iana", compressible: !0 },
  "application/cfw": { source: "iana" },
  "application/city+json": { source: "iana", compressible: !0 },
  "application/clr": { source: "iana" },
  "application/clue+xml": { source: "iana", compressible: !0 },
  "application/clue_info+xml": { source: "iana", compressible: !0 },
  "application/cms": { source: "iana" },
  "application/cnrp+xml": { source: "iana", compressible: !0 },
  "application/coap-group+json": { source: "iana", compressible: !0 },
  "application/coap-payload": { source: "iana" },
  "application/commonground": { source: "iana" },
  "application/conference-info+xml": { source: "iana", compressible: !0 },
  "application/cose": { source: "iana" },
  "application/cose-key": { source: "iana" },
  "application/cose-key-set": { source: "iana" },
  "application/cpl+xml": { source: "iana", compressible: !0, extensions: ["cpl"] },
  "application/csrattrs": { source: "iana" },
  "application/csta+xml": { source: "iana", compressible: !0 },
  "application/cstadata+xml": { source: "iana", compressible: !0 },
  "application/csvm+json": { source: "iana", compressible: !0 },
  "application/cu-seeme": { source: "apache", extensions: ["cu"] },
  "application/cwt": { source: "iana" },
  "application/cybercash": { source: "iana" },
  "application/dart": { compressible: !0 },
  "application/dash+xml": { source: "iana", compressible: !0, extensions: ["mpd"] },
  "application/dash-patch+xml": { source: "iana", compressible: !0, extensions: ["mpp"] },
  "application/dashdelta": { source: "iana" },
  "application/davmount+xml": { source: "iana", compressible: !0, extensions: ["davmount"] },
  "application/dca-rft": { source: "iana" },
  "application/dcd": { source: "iana" },
  "application/dec-dx": { source: "iana" },
  "application/dialog-info+xml": { source: "iana", compressible: !0 },
  "application/dicom": { source: "iana" },
  "application/dicom+json": { source: "iana", compressible: !0 },
  "application/dicom+xml": { source: "iana", compressible: !0 },
  "application/dii": { source: "iana" },
  "application/dit": { source: "iana" },
  "application/dns": { source: "iana" },
  "application/dns+json": { source: "iana", compressible: !0 },
  "application/dns-message": { source: "iana" },
  "application/docbook+xml": { source: "apache", compressible: !0, extensions: ["dbk"] },
  "application/dots+cbor": { source: "iana" },
  "application/dskpp+xml": { source: "iana", compressible: !0 },
  "application/dssc+der": { source: "iana", extensions: ["dssc"] },
  "application/dssc+xml": { source: "iana", compressible: !0, extensions: ["xdssc"] },
  "application/dvcs": { source: "iana" },
  "application/ecmascript": { source: "iana", compressible: !0, extensions: ["es", "ecma"] },
  "application/edi-consent": { source: "iana" },
  "application/edi-x12": { source: "iana", compressible: !1 },
  "application/edifact": { source: "iana", compressible: !1 },
  "application/efi": { source: "iana" },
  "application/elm+json": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/elm+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.cap+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/emergencycalldata.comment+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.control+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.deviceinfo+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.ecall.msd": { source: "iana" },
  "application/emergencycalldata.providerinfo+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.serviceinfo+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.subscriberinfo+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.veds+xml": { source: "iana", compressible: !0 },
  "application/emma+xml": { source: "iana", compressible: !0, extensions: ["emma"] },
  "application/emotionml+xml": { source: "iana", compressible: !0, extensions: ["emotionml"] },
  "application/encaprtp": { source: "iana" },
  "application/epp+xml": { source: "iana", compressible: !0 },
  "application/epub+zip": { source: "iana", compressible: !1, extensions: ["epub"] },
  "application/eshop": { source: "iana" },
  "application/exi": { source: "iana", extensions: ["exi"] },
  "application/expect-ct-report+json": { source: "iana", compressible: !0 },
  "application/express": { source: "iana", extensions: ["exp"] },
  "application/fastinfoset": { source: "iana" },
  "application/fastsoap": { source: "iana" },
  "application/fdt+xml": { source: "iana", compressible: !0, extensions: ["fdt"] },
  "application/fhir+json": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/fhir+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/fido.trusted-apps+json": { compressible: !0 },
  "application/fits": { source: "iana" },
  "application/flexfec": { source: "iana" },
  "application/font-sfnt": { source: "iana" },
  "application/font-tdpfr": { source: "iana", extensions: ["pfr"] },
  "application/font-woff": { source: "iana", compressible: !1 },
  "application/framework-attributes+xml": { source: "iana", compressible: !0 },
  "application/geo+json": { source: "iana", compressible: !0, extensions: ["geojson"] },
  "application/geo+json-seq": { source: "iana" },
  "application/geopackage+sqlite3": { source: "iana" },
  "application/geoxacml+xml": { source: "iana", compressible: !0 },
  "application/gltf-buffer": { source: "iana" },
  "application/gml+xml": { source: "iana", compressible: !0, extensions: ["gml"] },
  "application/gpx+xml": { source: "apache", compressible: !0, extensions: ["gpx"] },
  "application/gxf": { source: "apache", extensions: ["gxf"] },
  "application/gzip": { source: "iana", compressible: !1, extensions: ["gz"] },
  "application/h224": { source: "iana" },
  "application/held+xml": { source: "iana", compressible: !0 },
  "application/hjson": { extensions: ["hjson"] },
  "application/http": { source: "iana" },
  "application/hyperstudio": { source: "iana", extensions: ["stk"] },
  "application/ibe-key-request+xml": { source: "iana", compressible: !0 },
  "application/ibe-pkg-reply+xml": { source: "iana", compressible: !0 },
  "application/ibe-pp-data": { source: "iana" },
  "application/iges": { source: "iana" },
  "application/im-iscomposing+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/index": { source: "iana" },
  "application/index.cmd": { source: "iana" },
  "application/index.obj": { source: "iana" },
  "application/index.response": { source: "iana" },
  "application/index.vnd": { source: "iana" },
  "application/inkml+xml": { source: "iana", compressible: !0, extensions: ["ink", "inkml"] },
  "application/iotp": { source: "iana" },
  "application/ipfix": { source: "iana", extensions: ["ipfix"] },
  "application/ipp": { source: "iana" },
  "application/isup": { source: "iana" },
  "application/its+xml": { source: "iana", compressible: !0, extensions: ["its"] },
  "application/java-archive": { source: "apache", compressible: !1, extensions: ["jar", "war", "ear"] },
  "application/java-serialized-object": { source: "apache", compressible: !1, extensions: ["ser"] },
  "application/java-vm": { source: "apache", compressible: !1, extensions: ["class"] },
  "application/javascript": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["js", "mjs"] },
  "application/jf2feed+json": { source: "iana", compressible: !0 },
  "application/jose": { source: "iana" },
  "application/jose+json": { source: "iana", compressible: !0 },
  "application/jrd+json": { source: "iana", compressible: !0 },
  "application/jscalendar+json": { source: "iana", compressible: !0 },
  "application/json": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["json", "map"] },
  "application/json-patch+json": { source: "iana", compressible: !0 },
  "application/json-seq": { source: "iana" },
  "application/json5": { extensions: ["json5"] },
  "application/jsonml+json": { source: "apache", compressible: !0, extensions: ["jsonml"] },
  "application/jwk+json": { source: "iana", compressible: !0 },
  "application/jwk-set+json": { source: "iana", compressible: !0 },
  "application/jwt": { source: "iana" },
  "application/kpml-request+xml": { source: "iana", compressible: !0 },
  "application/kpml-response+xml": { source: "iana", compressible: !0 },
  "application/ld+json": { source: "iana", compressible: !0, extensions: ["jsonld"] },
  "application/lgr+xml": { source: "iana", compressible: !0, extensions: ["lgr"] },
  "application/link-format": { source: "iana" },
  "application/load-control+xml": { source: "iana", compressible: !0 },
  "application/lost+xml": { source: "iana", compressible: !0, extensions: ["lostxml"] },
  "application/lostsync+xml": { source: "iana", compressible: !0 },
  "application/lpf+zip": { source: "iana", compressible: !1 },
  "application/lxf": { source: "iana" },
  "application/mac-binhex40": { source: "iana", extensions: ["hqx"] },
  "application/mac-compactpro": { source: "apache", extensions: ["cpt"] },
  "application/macwriteii": { source: "iana" },
  "application/mads+xml": { source: "iana", compressible: !0, extensions: ["mads"] },
  "application/manifest+json": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["webmanifest"] },
  "application/marc": { source: "iana", extensions: ["mrc"] },
  "application/marcxml+xml": { source: "iana", compressible: !0, extensions: ["mrcx"] },
  "application/mathematica": { source: "iana", extensions: ["ma", "nb", "mb"] },
  "application/mathml+xml": { source: "iana", compressible: !0, extensions: ["mathml"] },
  "application/mathml-content+xml": { source: "iana", compressible: !0 },
  "application/mathml-presentation+xml": { source: "iana", compressible: !0 },
  "application/mbms-associated-procedure-description+xml": { source: "iana", compressible: !0 },
  "application/mbms-deregister+xml": { source: "iana", compressible: !0 },
  "application/mbms-envelope+xml": { source: "iana", compressible: !0 },
  "application/mbms-msk+xml": { source: "iana", compressible: !0 },
  "application/mbms-msk-response+xml": { source: "iana", compressible: !0 },
  "application/mbms-protection-description+xml": { source: "iana", compressible: !0 },
  "application/mbms-reception-report+xml": { source: "iana", compressible: !0 },
  "application/mbms-register+xml": { source: "iana", compressible: !0 },
  "application/mbms-register-response+xml": { source: "iana", compressible: !0 },
  "application/mbms-schedule+xml": { source: "iana", compressible: !0 },
  "application/mbms-user-service-description+xml": { source: "iana", compressible: !0 },
  "application/mbox": { source: "iana", extensions: ["mbox"] },
  "application/media-policy-dataset+xml": { source: "iana", compressible: !0, extensions: ["mpf"] },
  "application/media_control+xml": { source: "iana", compressible: !0 },
  "application/mediaservercontrol+xml": { source: "iana", compressible: !0, extensions: ["mscml"] },
  "application/merge-patch+json": { source: "iana", compressible: !0 },
  "application/metalink+xml": { source: "apache", compressible: !0, extensions: ["metalink"] },
  "application/metalink4+xml": { source: "iana", compressible: !0, extensions: ["meta4"] },
  "application/mets+xml": { source: "iana", compressible: !0, extensions: ["mets"] },
  "application/mf4": { source: "iana" },
  "application/mikey": { source: "iana" },
  "application/mipc": { source: "iana" },
  "application/missing-blocks+cbor-seq": { source: "iana" },
  "application/mmt-aei+xml": { source: "iana", compressible: !0, extensions: ["maei"] },
  "application/mmt-usd+xml": { source: "iana", compressible: !0, extensions: ["musd"] },
  "application/mods+xml": { source: "iana", compressible: !0, extensions: ["mods"] },
  "application/moss-keys": { source: "iana" },
  "application/moss-signature": { source: "iana" },
  "application/mosskey-data": { source: "iana" },
  "application/mosskey-request": { source: "iana" },
  "application/mp21": { source: "iana", extensions: ["m21", "mp21"] },
  "application/mp4": { source: "iana", extensions: ["mp4s", "m4p"] },
  "application/mpeg4-generic": { source: "iana" },
  "application/mpeg4-iod": { source: "iana" },
  "application/mpeg4-iod-xmt": { source: "iana" },
  "application/mrb-consumer+xml": { source: "iana", compressible: !0 },
  "application/mrb-publish+xml": { source: "iana", compressible: !0 },
  "application/msc-ivr+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/msc-mixer+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/msword": { source: "iana", compressible: !1, extensions: ["doc", "dot"] },
  "application/mud+json": { source: "iana", compressible: !0 },
  "application/multipart-core": { source: "iana" },
  "application/mxf": { source: "iana", extensions: ["mxf"] },
  "application/n-quads": { source: "iana", extensions: ["nq"] },
  "application/n-triples": { source: "iana", extensions: ["nt"] },
  "application/nasdata": { source: "iana" },
  "application/news-checkgroups": { source: "iana", charset: "US-ASCII" },
  "application/news-groupinfo": { source: "iana", charset: "US-ASCII" },
  "application/news-transmission": { source: "iana" },
  "application/nlsml+xml": { source: "iana", compressible: !0 },
  "application/node": { source: "iana", extensions: ["cjs"] },
  "application/nss": { source: "iana" },
  "application/oauth-authz-req+jwt": { source: "iana" },
  "application/oblivious-dns-message": { source: "iana" },
  "application/ocsp-request": { source: "iana" },
  "application/ocsp-response": { source: "iana" },
  "application/octet-stream": { source: "iana", compressible: !1, extensions: ["bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer"] },
  "application/oda": { source: "iana", extensions: ["oda"] },
  "application/odm+xml": { source: "iana", compressible: !0 },
  "application/odx": { source: "iana" },
  "application/oebps-package+xml": { source: "iana", compressible: !0, extensions: ["opf"] },
  "application/ogg": { source: "iana", compressible: !1, extensions: ["ogx"] },
  "application/omdoc+xml": { source: "apache", compressible: !0, extensions: ["omdoc"] },
  "application/onenote": { source: "apache", extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"] },
  "application/opc-nodeset+xml": { source: "iana", compressible: !0 },
  "application/oscore": { source: "iana" },
  "application/oxps": { source: "iana", extensions: ["oxps"] },
  "application/p21": { source: "iana" },
  "application/p21+zip": { source: "iana", compressible: !1 },
  "application/p2p-overlay+xml": { source: "iana", compressible: !0, extensions: ["relo"] },
  "application/parityfec": { source: "iana" },
  "application/passport": { source: "iana" },
  "application/patch-ops-error+xml": { source: "iana", compressible: !0, extensions: ["xer"] },
  "application/pdf": { source: "iana", compressible: !1, extensions: ["pdf"] },
  "application/pdx": { source: "iana" },
  "application/pem-certificate-chain": { source: "iana" },
  "application/pgp-encrypted": { source: "iana", compressible: !1, extensions: ["pgp"] },
  "application/pgp-keys": { source: "iana", extensions: ["asc"] },
  "application/pgp-signature": { source: "iana", extensions: ["asc", "sig"] },
  "application/pics-rules": { source: "apache", extensions: ["prf"] },
  "application/pidf+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/pidf-diff+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/pkcs10": { source: "iana", extensions: ["p10"] },
  "application/pkcs12": { source: "iana" },
  "application/pkcs7-mime": { source: "iana", extensions: ["p7m", "p7c"] },
  "application/pkcs7-signature": { source: "iana", extensions: ["p7s"] },
  "application/pkcs8": { source: "iana", extensions: ["p8"] },
  "application/pkcs8-encrypted": { source: "iana" },
  "application/pkix-attr-cert": { source: "iana", extensions: ["ac"] },
  "application/pkix-cert": { source: "iana", extensions: ["cer"] },
  "application/pkix-crl": { source: "iana", extensions: ["crl"] },
  "application/pkix-pkipath": { source: "iana", extensions: ["pkipath"] },
  "application/pkixcmp": { source: "iana", extensions: ["pki"] },
  "application/pls+xml": { source: "iana", compressible: !0, extensions: ["pls"] },
  "application/poc-settings+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/postscript": { source: "iana", compressible: !0, extensions: ["ai", "eps", "ps"] },
  "application/ppsp-tracker+json": { source: "iana", compressible: !0 },
  "application/problem+json": { source: "iana", compressible: !0 },
  "application/problem+xml": { source: "iana", compressible: !0 },
  "application/provenance+xml": { source: "iana", compressible: !0, extensions: ["provx"] },
  "application/prs.alvestrand.titrax-sheet": { source: "iana" },
  "application/prs.cww": { source: "iana", extensions: ["cww"] },
  "application/prs.cyn": { source: "iana", charset: "7-BIT" },
  "application/prs.hpub+zip": { source: "iana", compressible: !1 },
  "application/prs.nprend": { source: "iana" },
  "application/prs.plucker": { source: "iana" },
  "application/prs.rdf-xml-crypt": { source: "iana" },
  "application/prs.xsf+xml": { source: "iana", compressible: !0 },
  "application/pskc+xml": { source: "iana", compressible: !0, extensions: ["pskcxml"] },
  "application/pvd+json": { source: "iana", compressible: !0 },
  "application/qsig": { source: "iana" },
  "application/raml+yaml": { compressible: !0, extensions: ["raml"] },
  "application/raptorfec": { source: "iana" },
  "application/rdap+json": { source: "iana", compressible: !0 },
  "application/rdf+xml": { source: "iana", compressible: !0, extensions: ["rdf", "owl"] },
  "application/reginfo+xml": { source: "iana", compressible: !0, extensions: ["rif"] },
  "application/relax-ng-compact-syntax": { source: "iana", extensions: ["rnc"] },
  "application/remote-printing": { source: "iana" },
  "application/reputon+json": { source: "iana", compressible: !0 },
  "application/resource-lists+xml": { source: "iana", compressible: !0, extensions: ["rl"] },
  "application/resource-lists-diff+xml": { source: "iana", compressible: !0, extensions: ["rld"] },
  "application/rfc+xml": { source: "iana", compressible: !0 },
  "application/riscos": { source: "iana" },
  "application/rlmi+xml": { source: "iana", compressible: !0 },
  "application/rls-services+xml": { source: "iana", compressible: !0, extensions: ["rs"] },
  "application/route-apd+xml": { source: "iana", compressible: !0, extensions: ["rapd"] },
  "application/route-s-tsid+xml": { source: "iana", compressible: !0, extensions: ["sls"] },
  "application/route-usd+xml": { source: "iana", compressible: !0, extensions: ["rusd"] },
  "application/rpki-ghostbusters": { source: "iana", extensions: ["gbr"] },
  "application/rpki-manifest": { source: "iana", extensions: ["mft"] },
  "application/rpki-publication": { source: "iana" },
  "application/rpki-roa": { source: "iana", extensions: ["roa"] },
  "application/rpki-updown": { source: "iana" },
  "application/rsd+xml": { source: "apache", compressible: !0, extensions: ["rsd"] },
  "application/rss+xml": { source: "apache", compressible: !0, extensions: ["rss"] },
  "application/rtf": { source: "iana", compressible: !0, extensions: ["rtf"] },
  "application/rtploopback": { source: "iana" },
  "application/rtx": { source: "iana" },
  "application/samlassertion+xml": { source: "iana", compressible: !0 },
  "application/samlmetadata+xml": { source: "iana", compressible: !0 },
  "application/sarif+json": { source: "iana", compressible: !0 },
  "application/sarif-external-properties+json": { source: "iana", compressible: !0 },
  "application/sbe": { source: "iana" },
  "application/sbml+xml": { source: "iana", compressible: !0, extensions: ["sbml"] },
  "application/scaip+xml": { source: "iana", compressible: !0 },
  "application/scim+json": { source: "iana", compressible: !0 },
  "application/scvp-cv-request": { source: "iana", extensions: ["scq"] },
  "application/scvp-cv-response": { source: "iana", extensions: ["scs"] },
  "application/scvp-vp-request": { source: "iana", extensions: ["spq"] },
  "application/scvp-vp-response": { source: "iana", extensions: ["spp"] },
  "application/sdp": { source: "iana", extensions: ["sdp"] },
  "application/secevent+jwt": { source: "iana" },
  "application/senml+cbor": { source: "iana" },
  "application/senml+json": { source: "iana", compressible: !0 },
  "application/senml+xml": { source: "iana", compressible: !0, extensions: ["senmlx"] },
  "application/senml-etch+cbor": { source: "iana" },
  "application/senml-etch+json": { source: "iana", compressible: !0 },
  "application/senml-exi": { source: "iana" },
  "application/sensml+cbor": { source: "iana" },
  "application/sensml+json": { source: "iana", compressible: !0 },
  "application/sensml+xml": { source: "iana", compressible: !0, extensions: ["sensmlx"] },
  "application/sensml-exi": { source: "iana" },
  "application/sep+xml": { source: "iana", compressible: !0 },
  "application/sep-exi": { source: "iana" },
  "application/session-info": { source: "iana" },
  "application/set-payment": { source: "iana" },
  "application/set-payment-initiation": { source: "iana", extensions: ["setpay"] },
  "application/set-registration": { source: "iana" },
  "application/set-registration-initiation": { source: "iana", extensions: ["setreg"] },
  "application/sgml": { source: "iana" },
  "application/sgml-open-catalog": { source: "iana" },
  "application/shf+xml": { source: "iana", compressible: !0, extensions: ["shf"] },
  "application/sieve": { source: "iana", extensions: ["siv", "sieve"] },
  "application/simple-filter+xml": { source: "iana", compressible: !0 },
  "application/simple-message-summary": { source: "iana" },
  "application/simplesymbolcontainer": { source: "iana" },
  "application/sipc": { source: "iana" },
  "application/slate": { source: "iana" },
  "application/smil": { source: "iana" },
  "application/smil+xml": { source: "iana", compressible: !0, extensions: ["smi", "smil"] },
  "application/smpte336m": { source: "iana" },
  "application/soap+fastinfoset": { source: "iana" },
  "application/soap+xml": { source: "iana", compressible: !0 },
  "application/sparql-query": { source: "iana", extensions: ["rq"] },
  "application/sparql-results+xml": { source: "iana", compressible: !0, extensions: ["srx"] },
  "application/spdx+json": { source: "iana", compressible: !0 },
  "application/spirits-event+xml": { source: "iana", compressible: !0 },
  "application/sql": { source: "iana" },
  "application/srgs": { source: "iana", extensions: ["gram"] },
  "application/srgs+xml": { source: "iana", compressible: !0, extensions: ["grxml"] },
  "application/sru+xml": { source: "iana", compressible: !0, extensions: ["sru"] },
  "application/ssdl+xml": { source: "apache", compressible: !0, extensions: ["ssdl"] },
  "application/ssml+xml": { source: "iana", compressible: !0, extensions: ["ssml"] },
  "application/stix+json": { source: "iana", compressible: !0 },
  "application/swid+xml": { source: "iana", compressible: !0, extensions: ["swidtag"] },
  "application/tamp-apex-update": { source: "iana" },
  "application/tamp-apex-update-confirm": { source: "iana" },
  "application/tamp-community-update": { source: "iana" },
  "application/tamp-community-update-confirm": { source: "iana" },
  "application/tamp-error": { source: "iana" },
  "application/tamp-sequence-adjust": { source: "iana" },
  "application/tamp-sequence-adjust-confirm": { source: "iana" },
  "application/tamp-status-query": { source: "iana" },
  "application/tamp-status-response": { source: "iana" },
  "application/tamp-update": { source: "iana" },
  "application/tamp-update-confirm": { source: "iana" },
  "application/tar": { compressible: !0 },
  "application/taxii+json": { source: "iana", compressible: !0 },
  "application/td+json": { source: "iana", compressible: !0 },
  "application/tei+xml": { source: "iana", compressible: !0, extensions: ["tei", "teicorpus"] },
  "application/tetra_isi": { source: "iana" },
  "application/thraud+xml": { source: "iana", compressible: !0, extensions: ["tfi"] },
  "application/timestamp-query": { source: "iana" },
  "application/timestamp-reply": { source: "iana" },
  "application/timestamped-data": { source: "iana", extensions: ["tsd"] },
  "application/tlsrpt+gzip": { source: "iana" },
  "application/tlsrpt+json": { source: "iana", compressible: !0 },
  "application/tnauthlist": { source: "iana" },
  "application/token-introspection+jwt": { source: "iana" },
  "application/toml": { compressible: !0, extensions: ["toml"] },
  "application/trickle-ice-sdpfrag": { source: "iana" },
  "application/trig": { source: "iana", extensions: ["trig"] },
  "application/ttml+xml": { source: "iana", compressible: !0, extensions: ["ttml"] },
  "application/tve-trigger": { source: "iana" },
  "application/tzif": { source: "iana" },
  "application/tzif-leap": { source: "iana" },
  "application/ubjson": { compressible: !1, extensions: ["ubj"] },
  "application/ulpfec": { source: "iana" },
  "application/urc-grpsheet+xml": { source: "iana", compressible: !0 },
  "application/urc-ressheet+xml": { source: "iana", compressible: !0, extensions: ["rsheet"] },
  "application/urc-targetdesc+xml": { source: "iana", compressible: !0, extensions: ["td"] },
  "application/urc-uisocketdesc+xml": { source: "iana", compressible: !0 },
  "application/vcard+json": { source: "iana", compressible: !0 },
  "application/vcard+xml": { source: "iana", compressible: !0 },
  "application/vemmi": { source: "iana" },
  "application/vividence.scriptfile": { source: "apache" },
  "application/vnd.1000minds.decision-model+xml": { source: "iana", compressible: !0, extensions: ["1km"] },
  "application/vnd.3gpp-prose+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp-prose-pc3ch+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp-v2x-local-service-information": { source: "iana" },
  "application/vnd.3gpp.5gnas": { source: "iana" },
  "application/vnd.3gpp.access-transfer-events+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.bsf+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.gmop+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.gtpc": { source: "iana" },
  "application/vnd.3gpp.interworking-data": { source: "iana" },
  "application/vnd.3gpp.lpp": { source: "iana" },
  "application/vnd.3gpp.mc-signalling-ear": { source: "iana" },
  "application/vnd.3gpp.mcdata-affiliation-command+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcdata-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcdata-payload": { source: "iana" },
  "application/vnd.3gpp.mcdata-service-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcdata-signalling": { source: "iana" },
  "application/vnd.3gpp.mcdata-ue-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcdata-user-profile+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-affiliation-command+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-floor-request+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-location-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-mbms-usage-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-service-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-signed+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-ue-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-ue-init-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-user-profile+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-affiliation-command+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-affiliation-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-location-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-service-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-transmission-request+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-ue-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-user-profile+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mid-call+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.ngap": { source: "iana" },
  "application/vnd.3gpp.pfcp": { source: "iana" },
  "application/vnd.3gpp.pic-bw-large": { source: "iana", extensions: ["plb"] },
  "application/vnd.3gpp.pic-bw-small": { source: "iana", extensions: ["psb"] },
  "application/vnd.3gpp.pic-bw-var": { source: "iana", extensions: ["pvb"] },
  "application/vnd.3gpp.s1ap": { source: "iana" },
  "application/vnd.3gpp.sms": { source: "iana" },
  "application/vnd.3gpp.sms+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.srvcc-ext+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.srvcc-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.state-and-event-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.ussd+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp2.bcmcsinfo+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp2.sms": { source: "iana" },
  "application/vnd.3gpp2.tcap": { source: "iana", extensions: ["tcap"] },
  "application/vnd.3lightssoftware.imagescal": { source: "iana" },
  "application/vnd.3m.post-it-notes": { source: "iana", extensions: ["pwn"] },
  "application/vnd.accpac.simply.aso": { source: "iana", extensions: ["aso"] },
  "application/vnd.accpac.simply.imp": { source: "iana", extensions: ["imp"] },
  "application/vnd.acucobol": { source: "iana", extensions: ["acu"] },
  "application/vnd.acucorp": { source: "iana", extensions: ["atc", "acutc"] },
  "application/vnd.adobe.air-application-installer-package+zip": { source: "apache", compressible: !1, extensions: ["air"] },
  "application/vnd.adobe.flash.movie": { source: "iana" },
  "application/vnd.adobe.formscentral.fcdt": { source: "iana", extensions: ["fcdt"] },
  "application/vnd.adobe.fxp": { source: "iana", extensions: ["fxp", "fxpl"] },
  "application/vnd.adobe.partial-upload": { source: "iana" },
  "application/vnd.adobe.xdp+xml": { source: "iana", compressible: !0, extensions: ["xdp"] },
  "application/vnd.adobe.xfdf": { source: "iana", extensions: ["xfdf"] },
  "application/vnd.aether.imp": { source: "iana" },
  "application/vnd.afpc.afplinedata": { source: "iana" },
  "application/vnd.afpc.afplinedata-pagedef": { source: "iana" },
  "application/vnd.afpc.cmoca-cmresource": { source: "iana" },
  "application/vnd.afpc.foca-charset": { source: "iana" },
  "application/vnd.afpc.foca-codedfont": { source: "iana" },
  "application/vnd.afpc.foca-codepage": { source: "iana" },
  "application/vnd.afpc.modca": { source: "iana" },
  "application/vnd.afpc.modca-cmtable": { source: "iana" },
  "application/vnd.afpc.modca-formdef": { source: "iana" },
  "application/vnd.afpc.modca-mediummap": { source: "iana" },
  "application/vnd.afpc.modca-objectcontainer": { source: "iana" },
  "application/vnd.afpc.modca-overlay": { source: "iana" },
  "application/vnd.afpc.modca-pagesegment": { source: "iana" },
  "application/vnd.age": { source: "iana", extensions: ["age"] },
  "application/vnd.ah-barcode": { source: "iana" },
  "application/vnd.ahead.space": { source: "iana", extensions: ["ahead"] },
  "application/vnd.airzip.filesecure.azf": { source: "iana", extensions: ["azf"] },
  "application/vnd.airzip.filesecure.azs": { source: "iana", extensions: ["azs"] },
  "application/vnd.amadeus+json": { source: "iana", compressible: !0 },
  "application/vnd.amazon.ebook": { source: "apache", extensions: ["azw"] },
  "application/vnd.amazon.mobi8-ebook": { source: "iana" },
  "application/vnd.americandynamics.acc": { source: "iana", extensions: ["acc"] },
  "application/vnd.amiga.ami": { source: "iana", extensions: ["ami"] },
  "application/vnd.amundsen.maze+xml": { source: "iana", compressible: !0 },
  "application/vnd.android.ota": { source: "iana" },
  "application/vnd.android.package-archive": { source: "apache", compressible: !1, extensions: ["apk"] },
  "application/vnd.anki": { source: "iana" },
  "application/vnd.anser-web-certificate-issue-initiation": { source: "iana", extensions: ["cii"] },
  "application/vnd.anser-web-funds-transfer-initiation": { source: "apache", extensions: ["fti"] },
  "application/vnd.antix.game-component": { source: "iana", extensions: ["atx"] },
  "application/vnd.apache.arrow.file": { source: "iana" },
  "application/vnd.apache.arrow.stream": { source: "iana" },
  "application/vnd.apache.thrift.binary": { source: "iana" },
  "application/vnd.apache.thrift.compact": { source: "iana" },
  "application/vnd.apache.thrift.json": { source: "iana" },
  "application/vnd.api+json": { source: "iana", compressible: !0 },
  "application/vnd.aplextor.warrp+json": { source: "iana", compressible: !0 },
  "application/vnd.apothekende.reservation+json": { source: "iana", compressible: !0 },
  "application/vnd.apple.installer+xml": { source: "iana", compressible: !0, extensions: ["mpkg"] },
  "application/vnd.apple.keynote": { source: "iana", extensions: ["key"] },
  "application/vnd.apple.mpegurl": { source: "iana", extensions: ["m3u8"] },
  "application/vnd.apple.numbers": { source: "iana", extensions: ["numbers"] },
  "application/vnd.apple.pages": { source: "iana", extensions: ["pages"] },
  "application/vnd.apple.pkpass": { compressible: !1, extensions: ["pkpass"] },
  "application/vnd.arastra.swi": { source: "iana" },
  "application/vnd.aristanetworks.swi": { source: "iana", extensions: ["swi"] },
  "application/vnd.artisan+json": { source: "iana", compressible: !0 },
  "application/vnd.artsquare": { source: "iana" },
  "application/vnd.astraea-software.iota": { source: "iana", extensions: ["iota"] },
  "application/vnd.audiograph": { source: "iana", extensions: ["aep"] },
  "application/vnd.autopackage": { source: "iana" },
  "application/vnd.avalon+json": { source: "iana", compressible: !0 },
  "application/vnd.avistar+xml": { source: "iana", compressible: !0 },
  "application/vnd.balsamiq.bmml+xml": { source: "iana", compressible: !0, extensions: ["bmml"] },
  "application/vnd.balsamiq.bmpr": { source: "iana" },
  "application/vnd.banana-accounting": { source: "iana" },
  "application/vnd.bbf.usp.error": { source: "iana" },
  "application/vnd.bbf.usp.msg": { source: "iana" },
  "application/vnd.bbf.usp.msg+json": { source: "iana", compressible: !0 },
  "application/vnd.bekitzur-stech+json": { source: "iana", compressible: !0 },
  "application/vnd.bint.med-content": { source: "iana" },
  "application/vnd.biopax.rdf+xml": { source: "iana", compressible: !0 },
  "application/vnd.blink-idb-value-wrapper": { source: "iana" },
  "application/vnd.blueice.multipass": { source: "iana", extensions: ["mpm"] },
  "application/vnd.bluetooth.ep.oob": { source: "iana" },
  "application/vnd.bluetooth.le.oob": { source: "iana" },
  "application/vnd.bmi": { source: "iana", extensions: ["bmi"] },
  "application/vnd.bpf": { source: "iana" },
  "application/vnd.bpf3": { source: "iana" },
  "application/vnd.businessobjects": { source: "iana", extensions: ["rep"] },
  "application/vnd.byu.uapi+json": { source: "iana", compressible: !0 },
  "application/vnd.cab-jscript": { source: "iana" },
  "application/vnd.canon-cpdl": { source: "iana" },
  "application/vnd.canon-lips": { source: "iana" },
  "application/vnd.capasystems-pg+json": { source: "iana", compressible: !0 },
  "application/vnd.cendio.thinlinc.clientconf": { source: "iana" },
  "application/vnd.century-systems.tcp_stream": { source: "iana" },
  "application/vnd.chemdraw+xml": { source: "iana", compressible: !0, extensions: ["cdxml"] },
  "application/vnd.chess-pgn": { source: "iana" },
  "application/vnd.chipnuts.karaoke-mmd": { source: "iana", extensions: ["mmd"] },
  "application/vnd.ciedi": { source: "iana" },
  "application/vnd.cinderella": { source: "iana", extensions: ["cdy"] },
  "application/vnd.cirpack.isdn-ext": { source: "iana" },
  "application/vnd.citationstyles.style+xml": { source: "iana", compressible: !0, extensions: ["csl"] },
  "application/vnd.claymore": { source: "iana", extensions: ["cla"] },
  "application/vnd.cloanto.rp9": { source: "iana", extensions: ["rp9"] },
  "application/vnd.clonk.c4group": { source: "iana", extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"] },
  "application/vnd.cluetrust.cartomobile-config": { source: "iana", extensions: ["c11amc"] },
  "application/vnd.cluetrust.cartomobile-config-pkg": { source: "iana", extensions: ["c11amz"] },
  "application/vnd.coffeescript": { source: "iana" },
  "application/vnd.collabio.xodocuments.document": { source: "iana" },
  "application/vnd.collabio.xodocuments.document-template": { source: "iana" },
  "application/vnd.collabio.xodocuments.presentation": { source: "iana" },
  "application/vnd.collabio.xodocuments.presentation-template": { source: "iana" },
  "application/vnd.collabio.xodocuments.spreadsheet": { source: "iana" },
  "application/vnd.collabio.xodocuments.spreadsheet-template": { source: "iana" },
  "application/vnd.collection+json": { source: "iana", compressible: !0 },
  "application/vnd.collection.doc+json": { source: "iana", compressible: !0 },
  "application/vnd.collection.next+json": { source: "iana", compressible: !0 },
  "application/vnd.comicbook+zip": { source: "iana", compressible: !1 },
  "application/vnd.comicbook-rar": { source: "iana" },
  "application/vnd.commerce-battelle": { source: "iana" },
  "application/vnd.commonspace": { source: "iana", extensions: ["csp"] },
  "application/vnd.contact.cmsg": { source: "iana", extensions: ["cdbcmsg"] },
  "application/vnd.coreos.ignition+json": { source: "iana", compressible: !0 },
  "application/vnd.cosmocaller": { source: "iana", extensions: ["cmc"] },
  "application/vnd.crick.clicker": { source: "iana", extensions: ["clkx"] },
  "application/vnd.crick.clicker.keyboard": { source: "iana", extensions: ["clkk"] },
  "application/vnd.crick.clicker.palette": { source: "iana", extensions: ["clkp"] },
  "application/vnd.crick.clicker.template": { source: "iana", extensions: ["clkt"] },
  "application/vnd.crick.clicker.wordbank": { source: "iana", extensions: ["clkw"] },
  "application/vnd.criticaltools.wbs+xml": { source: "iana", compressible: !0, extensions: ["wbs"] },
  "application/vnd.cryptii.pipe+json": { source: "iana", compressible: !0 },
  "application/vnd.crypto-shade-file": { source: "iana" },
  "application/vnd.cryptomator.encrypted": { source: "iana" },
  "application/vnd.cryptomator.vault": { source: "iana" },
  "application/vnd.ctc-posml": { source: "iana", extensions: ["pml"] },
  "application/vnd.ctct.ws+xml": { source: "iana", compressible: !0 },
  "application/vnd.cups-pdf": { source: "iana" },
  "application/vnd.cups-postscript": { source: "iana" },
  "application/vnd.cups-ppd": { source: "iana", extensions: ["ppd"] },
  "application/vnd.cups-raster": { source: "iana" },
  "application/vnd.cups-raw": { source: "iana" },
  "application/vnd.curl": { source: "iana" },
  "application/vnd.curl.car": { source: "apache", extensions: ["car"] },
  "application/vnd.curl.pcurl": { source: "apache", extensions: ["pcurl"] },
  "application/vnd.cyan.dean.root+xml": { source: "iana", compressible: !0 },
  "application/vnd.cybank": { source: "iana" },
  "application/vnd.cyclonedx+json": { source: "iana", compressible: !0 },
  "application/vnd.cyclonedx+xml": { source: "iana", compressible: !0 },
  "application/vnd.d2l.coursepackage1p0+zip": { source: "iana", compressible: !1 },
  "application/vnd.d3m-dataset": { source: "iana" },
  "application/vnd.d3m-problem": { source: "iana" },
  "application/vnd.dart": { source: "iana", compressible: !0, extensions: ["dart"] },
  "application/vnd.data-vision.rdz": { source: "iana", extensions: ["rdz"] },
  "application/vnd.datapackage+json": { source: "iana", compressible: !0 },
  "application/vnd.dataresource+json": { source: "iana", compressible: !0 },
  "application/vnd.dbf": { source: "iana", extensions: ["dbf"] },
  "application/vnd.debian.binary-package": { source: "iana" },
  "application/vnd.dece.data": { source: "iana", extensions: ["uvf", "uvvf", "uvd", "uvvd"] },
  "application/vnd.dece.ttml+xml": { source: "iana", compressible: !0, extensions: ["uvt", "uvvt"] },
  "application/vnd.dece.unspecified": { source: "iana", extensions: ["uvx", "uvvx"] },
  "application/vnd.dece.zip": { source: "iana", extensions: ["uvz", "uvvz"] },
  "application/vnd.denovo.fcselayout-link": { source: "iana", extensions: ["fe_launch"] },
  "application/vnd.desmume.movie": { source: "iana" },
  "application/vnd.dir-bi.plate-dl-nosuffix": { source: "iana" },
  "application/vnd.dm.delegation+xml": { source: "iana", compressible: !0 },
  "application/vnd.dna": { source: "iana", extensions: ["dna"] },
  "application/vnd.document+json": { source: "iana", compressible: !0 },
  "application/vnd.dolby.mlp": { source: "apache", extensions: ["mlp"] },
  "application/vnd.dolby.mobile.1": { source: "iana" },
  "application/vnd.dolby.mobile.2": { source: "iana" },
  "application/vnd.doremir.scorecloud-binary-document": { source: "iana" },
  "application/vnd.dpgraph": { source: "iana", extensions: ["dpg"] },
  "application/vnd.dreamfactory": { source: "iana", extensions: ["dfac"] },
  "application/vnd.drive+json": { source: "iana", compressible: !0 },
  "application/vnd.ds-keypoint": { source: "apache", extensions: ["kpxx"] },
  "application/vnd.dtg.local": { source: "iana" },
  "application/vnd.dtg.local.flash": { source: "iana" },
  "application/vnd.dtg.local.html": { source: "iana" },
  "application/vnd.dvb.ait": { source: "iana", extensions: ["ait"] },
  "application/vnd.dvb.dvbisl+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.dvbj": { source: "iana" },
  "application/vnd.dvb.esgcontainer": { source: "iana" },
  "application/vnd.dvb.ipdcdftnotifaccess": { source: "iana" },
  "application/vnd.dvb.ipdcesgaccess": { source: "iana" },
  "application/vnd.dvb.ipdcesgaccess2": { source: "iana" },
  "application/vnd.dvb.ipdcesgpdd": { source: "iana" },
  "application/vnd.dvb.ipdcroaming": { source: "iana" },
  "application/vnd.dvb.iptv.alfec-base": { source: "iana" },
  "application/vnd.dvb.iptv.alfec-enhancement": { source: "iana" },
  "application/vnd.dvb.notif-aggregate-root+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-container+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-generic+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-ia-msglist+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-ia-registration-request+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-ia-registration-response+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-init+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.pfr": { source: "iana" },
  "application/vnd.dvb.service": { source: "iana", extensions: ["svc"] },
  "application/vnd.dxr": { source: "iana" },
  "application/vnd.dynageo": { source: "iana", extensions: ["geo"] },
  "application/vnd.dzr": { source: "iana" },
  "application/vnd.easykaraoke.cdgdownload": { source: "iana" },
  "application/vnd.ecdis-update": { source: "iana" },
  "application/vnd.ecip.rlp": { source: "iana" },
  "application/vnd.eclipse.ditto+json": { source: "iana", compressible: !0 },
  "application/vnd.ecowin.chart": { source: "iana", extensions: ["mag"] },
  "application/vnd.ecowin.filerequest": { source: "iana" },
  "application/vnd.ecowin.fileupdate": { source: "iana" },
  "application/vnd.ecowin.series": { source: "iana" },
  "application/vnd.ecowin.seriesrequest": { source: "iana" },
  "application/vnd.ecowin.seriesupdate": { source: "iana" },
  "application/vnd.efi.img": { source: "iana" },
  "application/vnd.efi.iso": { source: "iana" },
  "application/vnd.emclient.accessrequest+xml": { source: "iana", compressible: !0 },
  "application/vnd.enliven": { source: "iana", extensions: ["nml"] },
  "application/vnd.enphase.envoy": { source: "iana" },
  "application/vnd.eprints.data+xml": { source: "iana", compressible: !0 },
  "application/vnd.epson.esf": { source: "iana", extensions: ["esf"] },
  "application/vnd.epson.msf": { source: "iana", extensions: ["msf"] },
  "application/vnd.epson.quickanime": { source: "iana", extensions: ["qam"] },
  "application/vnd.epson.salt": { source: "iana", extensions: ["slt"] },
  "application/vnd.epson.ssf": { source: "iana", extensions: ["ssf"] },
  "application/vnd.ericsson.quickcall": { source: "iana" },
  "application/vnd.espass-espass+zip": { source: "iana", compressible: !1 },
  "application/vnd.eszigno3+xml": { source: "iana", compressible: !0, extensions: ["es3", "et3"] },
  "application/vnd.etsi.aoc+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.asic-e+zip": { source: "iana", compressible: !1 },
  "application/vnd.etsi.asic-s+zip": { source: "iana", compressible: !1 },
  "application/vnd.etsi.cug+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvcommand+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvdiscovery+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvprofile+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvsad-bc+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvsad-cod+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvsad-npvr+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvservice+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvsync+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvueprofile+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.mcid+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.mheg5": { source: "iana" },
  "application/vnd.etsi.overload-control-policy-dataset+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.pstn+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.sci+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.simservs+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.timestamp-token": { source: "iana" },
  "application/vnd.etsi.tsl+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.tsl.der": { source: "iana" },
  "application/vnd.eu.kasparian.car+json": { source: "iana", compressible: !0 },
  "application/vnd.eudora.data": { source: "iana" },
  "application/vnd.evolv.ecig.profile": { source: "iana" },
  "application/vnd.evolv.ecig.settings": { source: "iana" },
  "application/vnd.evolv.ecig.theme": { source: "iana" },
  "application/vnd.exstream-empower+zip": { source: "iana", compressible: !1 },
  "application/vnd.exstream-package": { source: "iana" },
  "application/vnd.ezpix-album": { source: "iana", extensions: ["ez2"] },
  "application/vnd.ezpix-package": { source: "iana", extensions: ["ez3"] },
  "application/vnd.f-secure.mobile": { source: "iana" },
  "application/vnd.familysearch.gedcom+zip": { source: "iana", compressible: !1 },
  "application/vnd.fastcopy-disk-image": { source: "iana" },
  "application/vnd.fdf": { source: "iana", extensions: ["fdf"] },
  "application/vnd.fdsn.mseed": { source: "iana", extensions: ["mseed"] },
  "application/vnd.fdsn.seed": { source: "iana", extensions: ["seed", "dataless"] },
  "application/vnd.ffsns": { source: "iana" },
  "application/vnd.ficlab.flb+zip": { source: "iana", compressible: !1 },
  "application/vnd.filmit.zfc": { source: "iana" },
  "application/vnd.fints": { source: "iana" },
  "application/vnd.firemonkeys.cloudcell": { source: "iana" },
  "application/vnd.flographit": { source: "iana", extensions: ["gph"] },
  "application/vnd.fluxtime.clip": { source: "iana", extensions: ["ftc"] },
  "application/vnd.font-fontforge-sfd": { source: "iana" },
  "application/vnd.framemaker": { source: "iana", extensions: ["fm", "frame", "maker", "book"] },
  "application/vnd.frogans.fnc": { source: "iana", extensions: ["fnc"] },
  "application/vnd.frogans.ltf": { source: "iana", extensions: ["ltf"] },
  "application/vnd.fsc.weblaunch": { source: "iana", extensions: ["fsc"] },
  "application/vnd.fujifilm.fb.docuworks": { source: "iana" },
  "application/vnd.fujifilm.fb.docuworks.binder": { source: "iana" },
  "application/vnd.fujifilm.fb.docuworks.container": { source: "iana" },
  "application/vnd.fujifilm.fb.jfi+xml": { source: "iana", compressible: !0 },
  "application/vnd.fujitsu.oasys": { source: "iana", extensions: ["oas"] },
  "application/vnd.fujitsu.oasys2": { source: "iana", extensions: ["oa2"] },
  "application/vnd.fujitsu.oasys3": { source: "iana", extensions: ["oa3"] },
  "application/vnd.fujitsu.oasysgp": { source: "iana", extensions: ["fg5"] },
  "application/vnd.fujitsu.oasysprs": { source: "iana", extensions: ["bh2"] },
  "application/vnd.fujixerox.art-ex": { source: "iana" },
  "application/vnd.fujixerox.art4": { source: "iana" },
  "application/vnd.fujixerox.ddd": { source: "iana", extensions: ["ddd"] },
  "application/vnd.fujixerox.docuworks": { source: "iana", extensions: ["xdw"] },
  "application/vnd.fujixerox.docuworks.binder": { source: "iana", extensions: ["xbd"] },
  "application/vnd.fujixerox.docuworks.container": { source: "iana" },
  "application/vnd.fujixerox.hbpl": { source: "iana" },
  "application/vnd.fut-misnet": { source: "iana" },
  "application/vnd.futoin+cbor": { source: "iana" },
  "application/vnd.futoin+json": { source: "iana", compressible: !0 },
  "application/vnd.fuzzysheet": { source: "iana", extensions: ["fzs"] },
  "application/vnd.genomatix.tuxedo": { source: "iana", extensions: ["txd"] },
  "application/vnd.gentics.grd+json": { source: "iana", compressible: !0 },
  "application/vnd.geo+json": { source: "iana", compressible: !0 },
  "application/vnd.geocube+xml": { source: "iana", compressible: !0 },
  "application/vnd.geogebra.file": { source: "iana", extensions: ["ggb"] },
  "application/vnd.geogebra.slides": { source: "iana" },
  "application/vnd.geogebra.tool": { source: "iana", extensions: ["ggt"] },
  "application/vnd.geometry-explorer": { source: "iana", extensions: ["gex", "gre"] },
  "application/vnd.geonext": { source: "iana", extensions: ["gxt"] },
  "application/vnd.geoplan": { source: "iana", extensions: ["g2w"] },
  "application/vnd.geospace": { source: "iana", extensions: ["g3w"] },
  "application/vnd.gerber": { source: "iana" },
  "application/vnd.globalplatform.card-content-mgt": { source: "iana" },
  "application/vnd.globalplatform.card-content-mgt-response": { source: "iana" },
  "application/vnd.gmx": { source: "iana", extensions: ["gmx"] },
  "application/vnd.google-apps.document": { compressible: !1, extensions: ["gdoc"] },
  "application/vnd.google-apps.presentation": { compressible: !1, extensions: ["gslides"] },
  "application/vnd.google-apps.spreadsheet": { compressible: !1, extensions: ["gsheet"] },
  "application/vnd.google-earth.kml+xml": { source: "iana", compressible: !0, extensions: ["kml"] },
  "application/vnd.google-earth.kmz": { source: "iana", compressible: !1, extensions: ["kmz"] },
  "application/vnd.gov.sk.e-form+xml": { source: "iana", compressible: !0 },
  "application/vnd.gov.sk.e-form+zip": { source: "iana", compressible: !1 },
  "application/vnd.gov.sk.xmldatacontainer+xml": { source: "iana", compressible: !0 },
  "application/vnd.grafeq": { source: "iana", extensions: ["gqf", "gqs"] },
  "application/vnd.gridmp": { source: "iana" },
  "application/vnd.groove-account": { source: "iana", extensions: ["gac"] },
  "application/vnd.groove-help": { source: "iana", extensions: ["ghf"] },
  "application/vnd.groove-identity-message": { source: "iana", extensions: ["gim"] },
  "application/vnd.groove-injector": { source: "iana", extensions: ["grv"] },
  "application/vnd.groove-tool-message": { source: "iana", extensions: ["gtm"] },
  "application/vnd.groove-tool-template": { source: "iana", extensions: ["tpl"] },
  "application/vnd.groove-vcard": { source: "iana", extensions: ["vcg"] },
  "application/vnd.hal+json": { source: "iana", compressible: !0 },
  "application/vnd.hal+xml": { source: "iana", compressible: !0, extensions: ["hal"] },
  "application/vnd.handheld-entertainment+xml": { source: "iana", compressible: !0, extensions: ["zmm"] },
  "application/vnd.hbci": { source: "iana", extensions: ["hbci"] },
  "application/vnd.hc+json": { source: "iana", compressible: !0 },
  "application/vnd.hcl-bireports": { source: "iana" },
  "application/vnd.hdt": { source: "iana" },
  "application/vnd.heroku+json": { source: "iana", compressible: !0 },
  "application/vnd.hhe.lesson-player": { source: "iana", extensions: ["les"] },
  "application/vnd.hl7cda+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.hl7v2+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.hp-hpgl": { source: "iana", extensions: ["hpgl"] },
  "application/vnd.hp-hpid": { source: "iana", extensions: ["hpid"] },
  "application/vnd.hp-hps": { source: "iana", extensions: ["hps"] },
  "application/vnd.hp-jlyt": { source: "iana", extensions: ["jlt"] },
  "application/vnd.hp-pcl": { source: "iana", extensions: ["pcl"] },
  "application/vnd.hp-pclxl": { source: "iana", extensions: ["pclxl"] },
  "application/vnd.httphone": { source: "iana" },
  "application/vnd.hydrostatix.sof-data": { source: "iana", extensions: ["sfd-hdstx"] },
  "application/vnd.hyper+json": { source: "iana", compressible: !0 },
  "application/vnd.hyper-item+json": { source: "iana", compressible: !0 },
  "application/vnd.hyperdrive+json": { source: "iana", compressible: !0 },
  "application/vnd.hzn-3d-crossword": { source: "iana" },
  "application/vnd.ibm.afplinedata": { source: "iana" },
  "application/vnd.ibm.electronic-media": { source: "iana" },
  "application/vnd.ibm.minipay": { source: "iana", extensions: ["mpy"] },
  "application/vnd.ibm.modcap": { source: "iana", extensions: ["afp", "listafp", "list3820"] },
  "application/vnd.ibm.rights-management": { source: "iana", extensions: ["irm"] },
  "application/vnd.ibm.secure-container": { source: "iana", extensions: ["sc"] },
  "application/vnd.iccprofile": { source: "iana", extensions: ["icc", "icm"] },
  "application/vnd.ieee.1905": { source: "iana" },
  "application/vnd.igloader": { source: "iana", extensions: ["igl"] },
  "application/vnd.imagemeter.folder+zip": { source: "iana", compressible: !1 },
  "application/vnd.imagemeter.image+zip": { source: "iana", compressible: !1 },
  "application/vnd.immervision-ivp": { source: "iana", extensions: ["ivp"] },
  "application/vnd.immervision-ivu": { source: "iana", extensions: ["ivu"] },
  "application/vnd.ims.imsccv1p1": { source: "iana" },
  "application/vnd.ims.imsccv1p2": { source: "iana" },
  "application/vnd.ims.imsccv1p3": { source: "iana" },
  "application/vnd.ims.lis.v2.result+json": { source: "iana", compressible: !0 },
  "application/vnd.ims.lti.v2.toolconsumerprofile+json": { source: "iana", compressible: !0 },
  "application/vnd.ims.lti.v2.toolproxy+json": { source: "iana", compressible: !0 },
  "application/vnd.ims.lti.v2.toolproxy.id+json": { source: "iana", compressible: !0 },
  "application/vnd.ims.lti.v2.toolsettings+json": { source: "iana", compressible: !0 },
  "application/vnd.ims.lti.v2.toolsettings.simple+json": { source: "iana", compressible: !0 },
  "application/vnd.informedcontrol.rms+xml": { source: "iana", compressible: !0 },
  "application/vnd.informix-visionary": { source: "iana" },
  "application/vnd.infotech.project": { source: "iana" },
  "application/vnd.infotech.project+xml": { source: "iana", compressible: !0 },
  "application/vnd.innopath.wamp.notification": { source: "iana" },
  "application/vnd.insors.igm": { source: "iana", extensions: ["igm"] },
  "application/vnd.intercon.formnet": { source: "iana", extensions: ["xpw", "xpx"] },
  "application/vnd.intergeo": { source: "iana", extensions: ["i2g"] },
  "application/vnd.intertrust.digibox": { source: "iana" },
  "application/vnd.intertrust.nncp": { source: "iana" },
  "application/vnd.intu.qbo": { source: "iana", extensions: ["qbo"] },
  "application/vnd.intu.qfx": { source: "iana", extensions: ["qfx"] },
  "application/vnd.iptc.g2.catalogitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.conceptitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.knowledgeitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.newsitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.newsmessage+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.packageitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.planningitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.ipunplugged.rcprofile": { source: "iana", extensions: ["rcprofile"] },
  "application/vnd.irepository.package+xml": { source: "iana", compressible: !0, extensions: ["irp"] },
  "application/vnd.is-xpr": { source: "iana", extensions: ["xpr"] },
  "application/vnd.isac.fcs": { source: "iana", extensions: ["fcs"] },
  "application/vnd.iso11783-10+zip": { source: "iana", compressible: !1 },
  "application/vnd.jam": { source: "iana", extensions: ["jam"] },
  "application/vnd.japannet-directory-service": { source: "iana" },
  "application/vnd.japannet-jpnstore-wakeup": { source: "iana" },
  "application/vnd.japannet-payment-wakeup": { source: "iana" },
  "application/vnd.japannet-registration": { source: "iana" },
  "application/vnd.japannet-registration-wakeup": { source: "iana" },
  "application/vnd.japannet-setstore-wakeup": { source: "iana" },
  "application/vnd.japannet-verification": { source: "iana" },
  "application/vnd.japannet-verification-wakeup": { source: "iana" },
  "application/vnd.jcp.javame.midlet-rms": { source: "iana", extensions: ["rms"] },
  "application/vnd.jisp": { source: "iana", extensions: ["jisp"] },
  "application/vnd.joost.joda-archive": { source: "iana", extensions: ["joda"] },
  "application/vnd.jsk.isdn-ngn": { source: "iana" },
  "application/vnd.kahootz": { source: "iana", extensions: ["ktz", "ktr"] },
  "application/vnd.kde.karbon": { source: "iana", extensions: ["karbon"] },
  "application/vnd.kde.kchart": { source: "iana", extensions: ["chrt"] },
  "application/vnd.kde.kformula": { source: "iana", extensions: ["kfo"] },
  "application/vnd.kde.kivio": { source: "iana", extensions: ["flw"] },
  "application/vnd.kde.kontour": { source: "iana", extensions: ["kon"] },
  "application/vnd.kde.kpresenter": { source: "iana", extensions: ["kpr", "kpt"] },
  "application/vnd.kde.kspread": { source: "iana", extensions: ["ksp"] },
  "application/vnd.kde.kword": { source: "iana", extensions: ["kwd", "kwt"] },
  "application/vnd.kenameaapp": { source: "iana", extensions: ["htke"] },
  "application/vnd.kidspiration": { source: "iana", extensions: ["kia"] },
  "application/vnd.kinar": { source: "iana", extensions: ["kne", "knp"] },
  "application/vnd.koan": { source: "iana", extensions: ["skp", "skd", "skt", "skm"] },
  "application/vnd.kodak-descriptor": { source: "iana", extensions: ["sse"] },
  "application/vnd.las": { source: "iana" },
  "application/vnd.las.las+json": { source: "iana", compressible: !0 },
  "application/vnd.las.las+xml": { source: "iana", compressible: !0, extensions: ["lasxml"] },
  "application/vnd.laszip": { source: "iana" },
  "application/vnd.leap+json": { source: "iana", compressible: !0 },
  "application/vnd.liberty-request+xml": { source: "iana", compressible: !0 },
  "application/vnd.llamagraphics.life-balance.desktop": { source: "iana", extensions: ["lbd"] },
  "application/vnd.llamagraphics.life-balance.exchange+xml": { source: "iana", compressible: !0, extensions: ["lbe"] },
  "application/vnd.logipipe.circuit+zip": { source: "iana", compressible: !1 },
  "application/vnd.loom": { source: "iana" },
  "application/vnd.lotus-1-2-3": { source: "iana", extensions: ["123"] },
  "application/vnd.lotus-approach": { source: "iana", extensions: ["apr"] },
  "application/vnd.lotus-freelance": { source: "iana", extensions: ["pre"] },
  "application/vnd.lotus-notes": { source: "iana", extensions: ["nsf"] },
  "application/vnd.lotus-organizer": { source: "iana", extensions: ["org"] },
  "application/vnd.lotus-screencam": { source: "iana", extensions: ["scm"] },
  "application/vnd.lotus-wordpro": { source: "iana", extensions: ["lwp"] },
  "application/vnd.macports.portpkg": { source: "iana", extensions: ["portpkg"] },
  "application/vnd.mapbox-vector-tile": { source: "iana", extensions: ["mvt"] },
  "application/vnd.marlin.drm.actiontoken+xml": { source: "iana", compressible: !0 },
  "application/vnd.marlin.drm.conftoken+xml": { source: "iana", compressible: !0 },
  "application/vnd.marlin.drm.license+xml": { source: "iana", compressible: !0 },
  "application/vnd.marlin.drm.mdcf": { source: "iana" },
  "application/vnd.mason+json": { source: "iana", compressible: !0 },
  "application/vnd.maxar.archive.3tz+zip": { source: "iana", compressible: !1 },
  "application/vnd.maxmind.maxmind-db": { source: "iana" },
  "application/vnd.mcd": { source: "iana", extensions: ["mcd"] },
  "application/vnd.medcalcdata": { source: "iana", extensions: ["mc1"] },
  "application/vnd.mediastation.cdkey": { source: "iana", extensions: ["cdkey"] },
  "application/vnd.meridian-slingshot": { source: "iana" },
  "application/vnd.mfer": { source: "iana", extensions: ["mwf"] },
  "application/vnd.mfmp": { source: "iana", extensions: ["mfm"] },
  "application/vnd.micro+json": { source: "iana", compressible: !0 },
  "application/vnd.micrografx.flo": { source: "iana", extensions: ["flo"] },
  "application/vnd.micrografx.igx": { source: "iana", extensions: ["igx"] },
  "application/vnd.microsoft.portable-executable": { source: "iana" },
  "application/vnd.microsoft.windows.thumbnail-cache": { source: "iana" },
  "application/vnd.miele+json": { source: "iana", compressible: !0 },
  "application/vnd.mif": { source: "iana", extensions: ["mif"] },
  "application/vnd.minisoft-hp3000-save": { source: "iana" },
  "application/vnd.mitsubishi.misty-guard.trustweb": { source: "iana" },
  "application/vnd.mobius.daf": { source: "iana", extensions: ["daf"] },
  "application/vnd.mobius.dis": { source: "iana", extensions: ["dis"] },
  "application/vnd.mobius.mbk": { source: "iana", extensions: ["mbk"] },
  "application/vnd.mobius.mqy": { source: "iana", extensions: ["mqy"] },
  "application/vnd.mobius.msl": { source: "iana", extensions: ["msl"] },
  "application/vnd.mobius.plc": { source: "iana", extensions: ["plc"] },
  "application/vnd.mobius.txf": { source: "iana", extensions: ["txf"] },
  "application/vnd.mophun.application": { source: "iana", extensions: ["mpn"] },
  "application/vnd.mophun.certificate": { source: "iana", extensions: ["mpc"] },
  "application/vnd.motorola.flexsuite": { source: "iana" },
  "application/vnd.motorola.flexsuite.adsi": { source: "iana" },
  "application/vnd.motorola.flexsuite.fis": { source: "iana" },
  "application/vnd.motorola.flexsuite.gotap": { source: "iana" },
  "application/vnd.motorola.flexsuite.kmr": { source: "iana" },
  "application/vnd.motorola.flexsuite.ttc": { source: "iana" },
  "application/vnd.motorola.flexsuite.wem": { source: "iana" },
  "application/vnd.motorola.iprm": { source: "iana" },
  "application/vnd.mozilla.xul+xml": { source: "iana", compressible: !0, extensions: ["xul"] },
  "application/vnd.ms-3mfdocument": { source: "iana" },
  "application/vnd.ms-artgalry": { source: "iana", extensions: ["cil"] },
  "application/vnd.ms-asf": { source: "iana" },
  "application/vnd.ms-cab-compressed": { source: "iana", extensions: ["cab"] },
  "application/vnd.ms-color.iccprofile": { source: "apache" },
  "application/vnd.ms-excel": { source: "iana", compressible: !1, extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"] },
  "application/vnd.ms-excel.addin.macroenabled.12": { source: "iana", extensions: ["xlam"] },
  "application/vnd.ms-excel.sheet.binary.macroenabled.12": { source: "iana", extensions: ["xlsb"] },
  "application/vnd.ms-excel.sheet.macroenabled.12": { source: "iana", extensions: ["xlsm"] },
  "application/vnd.ms-excel.template.macroenabled.12": { source: "iana", extensions: ["xltm"] },
  "application/vnd.ms-fontobject": { source: "iana", compressible: !0, extensions: ["eot"] },
  "application/vnd.ms-htmlhelp": { source: "iana", extensions: ["chm"] },
  "application/vnd.ms-ims": { source: "iana", extensions: ["ims"] },
  "application/vnd.ms-lrm": { source: "iana", extensions: ["lrm"] },
  "application/vnd.ms-office.activex+xml": { source: "iana", compressible: !0 },
  "application/vnd.ms-officetheme": { source: "iana", extensions: ["thmx"] },
  "application/vnd.ms-opentype": { source: "apache", compressible: !0 },
  "application/vnd.ms-outlook": { compressible: !1, extensions: ["msg"] },
  "application/vnd.ms-package.obfuscated-opentype": { source: "apache" },
  "application/vnd.ms-pki.seccat": { source: "apache", extensions: ["cat"] },
  "application/vnd.ms-pki.stl": { source: "apache", extensions: ["stl"] },
  "application/vnd.ms-playready.initiator+xml": { source: "iana", compressible: !0 },
  "application/vnd.ms-powerpoint": { source: "iana", compressible: !1, extensions: ["ppt", "pps", "pot"] },
  "application/vnd.ms-powerpoint.addin.macroenabled.12": { source: "iana", extensions: ["ppam"] },
  "application/vnd.ms-powerpoint.presentation.macroenabled.12": { source: "iana", extensions: ["pptm"] },
  "application/vnd.ms-powerpoint.slide.macroenabled.12": { source: "iana", extensions: ["sldm"] },
  "application/vnd.ms-powerpoint.slideshow.macroenabled.12": { source: "iana", extensions: ["ppsm"] },
  "application/vnd.ms-powerpoint.template.macroenabled.12": { source: "iana", extensions: ["potm"] },
  "application/vnd.ms-printdevicecapabilities+xml": { source: "iana", compressible: !0 },
  "application/vnd.ms-printing.printticket+xml": { source: "apache", compressible: !0 },
  "application/vnd.ms-printschematicket+xml": { source: "iana", compressible: !0 },
  "application/vnd.ms-project": { source: "iana", extensions: ["mpp", "mpt"] },
  "application/vnd.ms-tnef": { source: "iana" },
  "application/vnd.ms-windows.devicepairing": { source: "iana" },
  "application/vnd.ms-windows.nwprinting.oob": { source: "iana" },
  "application/vnd.ms-windows.printerpairing": { source: "iana" },
  "application/vnd.ms-windows.wsd.oob": { source: "iana" },
  "application/vnd.ms-wmdrm.lic-chlg-req": { source: "iana" },
  "application/vnd.ms-wmdrm.lic-resp": { source: "iana" },
  "application/vnd.ms-wmdrm.meter-chlg-req": { source: "iana" },
  "application/vnd.ms-wmdrm.meter-resp": { source: "iana" },
  "application/vnd.ms-word.document.macroenabled.12": { source: "iana", extensions: ["docm"] },
  "application/vnd.ms-word.template.macroenabled.12": { source: "iana", extensions: ["dotm"] },
  "application/vnd.ms-works": { source: "iana", extensions: ["wps", "wks", "wcm", "wdb"] },
  "application/vnd.ms-wpl": { source: "iana", extensions: ["wpl"] },
  "application/vnd.ms-xpsdocument": { source: "iana", compressible: !1, extensions: ["xps"] },
  "application/vnd.msa-disk-image": { source: "iana" },
  "application/vnd.mseq": { source: "iana", extensions: ["mseq"] },
  "application/vnd.msign": { source: "iana" },
  "application/vnd.multiad.creator": { source: "iana" },
  "application/vnd.multiad.creator.cif": { source: "iana" },
  "application/vnd.music-niff": { source: "iana" },
  "application/vnd.musician": { source: "iana", extensions: ["mus"] },
  "application/vnd.muvee.style": { source: "iana", extensions: ["msty"] },
  "application/vnd.mynfc": { source: "iana", extensions: ["taglet"] },
  "application/vnd.nacamar.ybrid+json": { source: "iana", compressible: !0 },
  "application/vnd.ncd.control": { source: "iana" },
  "application/vnd.ncd.reference": { source: "iana" },
  "application/vnd.nearst.inv+json": { source: "iana", compressible: !0 },
  "application/vnd.nebumind.line": { source: "iana" },
  "application/vnd.nervana": { source: "iana" },
  "application/vnd.netfpx": { source: "iana" },
  "application/vnd.neurolanguage.nlu": { source: "iana", extensions: ["nlu"] },
  "application/vnd.nimn": { source: "iana" },
  "application/vnd.nintendo.nitro.rom": { source: "iana" },
  "application/vnd.nintendo.snes.rom": { source: "iana" },
  "application/vnd.nitf": { source: "iana", extensions: ["ntf", "nitf"] },
  "application/vnd.noblenet-directory": { source: "iana", extensions: ["nnd"] },
  "application/vnd.noblenet-sealer": { source: "iana", extensions: ["nns"] },
  "application/vnd.noblenet-web": { source: "iana", extensions: ["nnw"] },
  "application/vnd.nokia.catalogs": { source: "iana" },
  "application/vnd.nokia.conml+wbxml": { source: "iana" },
  "application/vnd.nokia.conml+xml": { source: "iana", compressible: !0 },
  "application/vnd.nokia.iptv.config+xml": { source: "iana", compressible: !0 },
  "application/vnd.nokia.isds-radio-presets": { source: "iana" },
  "application/vnd.nokia.landmark+wbxml": { source: "iana" },
  "application/vnd.nokia.landmark+xml": { source: "iana", compressible: !0 },
  "application/vnd.nokia.landmarkcollection+xml": { source: "iana", compressible: !0 },
  "application/vnd.nokia.n-gage.ac+xml": { source: "iana", compressible: !0, extensions: ["ac"] },
  "application/vnd.nokia.n-gage.data": { source: "iana", extensions: ["ngdat"] },
  "application/vnd.nokia.n-gage.symbian.install": { source: "iana", extensions: ["n-gage"] },
  "application/vnd.nokia.ncd": { source: "iana" },
  "application/vnd.nokia.pcd+wbxml": { source: "iana" },
  "application/vnd.nokia.pcd+xml": { source: "iana", compressible: !0 },
  "application/vnd.nokia.radio-preset": { source: "iana", extensions: ["rpst"] },
  "application/vnd.nokia.radio-presets": { source: "iana", extensions: ["rpss"] },
  "application/vnd.novadigm.edm": { source: "iana", extensions: ["edm"] },
  "application/vnd.novadigm.edx": { source: "iana", extensions: ["edx"] },
  "application/vnd.novadigm.ext": { source: "iana", extensions: ["ext"] },
  "application/vnd.ntt-local.content-share": { source: "iana" },
  "application/vnd.ntt-local.file-transfer": { source: "iana" },
  "application/vnd.ntt-local.ogw_remote-access": { source: "iana" },
  "application/vnd.ntt-local.sip-ta_remote": { source: "iana" },
  "application/vnd.ntt-local.sip-ta_tcp_stream": { source: "iana" },
  "application/vnd.oasis.opendocument.chart": { source: "iana", extensions: ["odc"] },
  "application/vnd.oasis.opendocument.chart-template": { source: "iana", extensions: ["otc"] },
  "application/vnd.oasis.opendocument.database": { source: "iana", extensions: ["odb"] },
  "application/vnd.oasis.opendocument.formula": { source: "iana", extensions: ["odf"] },
  "application/vnd.oasis.opendocument.formula-template": { source: "iana", extensions: ["odft"] },
  "application/vnd.oasis.opendocument.graphics": { source: "iana", compressible: !1, extensions: ["odg"] },
  "application/vnd.oasis.opendocument.graphics-template": { source: "iana", extensions: ["otg"] },
  "application/vnd.oasis.opendocument.image": { source: "iana", extensions: ["odi"] },
  "application/vnd.oasis.opendocument.image-template": { source: "iana", extensions: ["oti"] },
  "application/vnd.oasis.opendocument.presentation": { source: "iana", compressible: !1, extensions: ["odp"] },
  "application/vnd.oasis.opendocument.presentation-template": { source: "iana", extensions: ["otp"] },
  "application/vnd.oasis.opendocument.spreadsheet": { source: "iana", compressible: !1, extensions: ["ods"] },
  "application/vnd.oasis.opendocument.spreadsheet-template": { source: "iana", extensions: ["ots"] },
  "application/vnd.oasis.opendocument.text": { source: "iana", compressible: !1, extensions: ["odt"] },
  "application/vnd.oasis.opendocument.text-master": { source: "iana", extensions: ["odm"] },
  "application/vnd.oasis.opendocument.text-template": { source: "iana", extensions: ["ott"] },
  "application/vnd.oasis.opendocument.text-web": { source: "iana", extensions: ["oth"] },
  "application/vnd.obn": { source: "iana" },
  "application/vnd.ocf+cbor": { source: "iana" },
  "application/vnd.oci.image.manifest.v1+json": { source: "iana", compressible: !0 },
  "application/vnd.oftn.l10n+json": { source: "iana", compressible: !0 },
  "application/vnd.oipf.contentaccessdownload+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.contentaccessstreaming+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.cspg-hexbinary": { source: "iana" },
  "application/vnd.oipf.dae.svg+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.dae.xhtml+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.mippvcontrolmessage+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.pae.gem": { source: "iana" },
  "application/vnd.oipf.spdiscovery+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.spdlist+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.ueprofile+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.userprofile+xml": { source: "iana", compressible: !0 },
  "application/vnd.olpc-sugar": { source: "iana", extensions: ["xo"] },
  "application/vnd.oma-scws-config": { source: "iana" },
  "application/vnd.oma-scws-http-request": { source: "iana" },
  "application/vnd.oma-scws-http-response": { source: "iana" },
  "application/vnd.oma.bcast.associated-procedure-parameter+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.drm-trigger+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.imd+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.ltkm": { source: "iana" },
  "application/vnd.oma.bcast.notification+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.provisioningtrigger": { source: "iana" },
  "application/vnd.oma.bcast.sgboot": { source: "iana" },
  "application/vnd.oma.bcast.sgdd+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.sgdu": { source: "iana" },
  "application/vnd.oma.bcast.simple-symbol-container": { source: "iana" },
  "application/vnd.oma.bcast.smartcard-trigger+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.sprov+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.stkm": { source: "iana" },
  "application/vnd.oma.cab-address-book+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.cab-feature-handler+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.cab-pcc+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.cab-subs-invite+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.cab-user-prefs+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.dcd": { source: "iana" },
  "application/vnd.oma.dcdc": { source: "iana" },
  "application/vnd.oma.dd2+xml": { source: "iana", compressible: !0, extensions: ["dd2"] },
  "application/vnd.oma.drm.risd+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.group-usage-list+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.lwm2m+cbor": { source: "iana" },
  "application/vnd.oma.lwm2m+json": { source: "iana", compressible: !0 },
  "application/vnd.oma.lwm2m+tlv": { source: "iana" },
  "application/vnd.oma.pal+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.poc.detailed-progress-report+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.poc.final-report+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.poc.groups+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.poc.invocation-descriptor+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.poc.optimized-progress-report+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.push": { source: "iana" },
  "application/vnd.oma.scidm.messages+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.xcap-directory+xml": { source: "iana", compressible: !0 },
  "application/vnd.omads-email+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.omads-file+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.omads-folder+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.omaloc-supl-init": { source: "iana" },
  "application/vnd.onepager": { source: "iana" },
  "application/vnd.onepagertamp": { source: "iana" },
  "application/vnd.onepagertamx": { source: "iana" },
  "application/vnd.onepagertat": { source: "iana" },
  "application/vnd.onepagertatp": { source: "iana" },
  "application/vnd.onepagertatx": { source: "iana" },
  "application/vnd.openblox.game+xml": { source: "iana", compressible: !0, extensions: ["obgx"] },
  "application/vnd.openblox.game-binary": { source: "iana" },
  "application/vnd.openeye.oeb": { source: "iana" },
  "application/vnd.openofficeorg.extension": { source: "apache", extensions: ["oxt"] },
  "application/vnd.openstreetmap.data+xml": { source: "iana", compressible: !0, extensions: ["osm"] },
  "application/vnd.opentimestamps.ots": { source: "iana" },
  "application/vnd.openxmlformats-officedocument.custom-properties+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawing+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.extended-properties+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { source: "iana", compressible: !1, extensions: ["pptx"] },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.slide": { source: "iana", extensions: ["sldx"] },
  "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow": { source: "iana", extensions: ["ppsx"] },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.template": { source: "iana", extensions: ["potx"] },
  "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { source: "iana", compressible: !1, extensions: ["xlsx"] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": { source: "iana", extensions: ["xltx"] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.theme+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.themeoverride+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.vmldrawing": { source: "iana" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { source: "iana", compressible: !1, extensions: ["docx"] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": { source: "iana", extensions: ["dotx"] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-package.core-properties+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-package.relationships+xml": { source: "iana", compressible: !0 },
  "application/vnd.oracle.resource+json": { source: "iana", compressible: !0 },
  "application/vnd.orange.indata": { source: "iana" },
  "application/vnd.osa.netdeploy": { source: "iana" },
  "application/vnd.osgeo.mapguide.package": { source: "iana", extensions: ["mgp"] },
  "application/vnd.osgi.bundle": { source: "iana" },
  "application/vnd.osgi.dp": { source: "iana", extensions: ["dp"] },
  "application/vnd.osgi.subsystem": { source: "iana", extensions: ["esa"] },
  "application/vnd.otps.ct-kip+xml": { source: "iana", compressible: !0 },
  "application/vnd.oxli.countgraph": { source: "iana" },
  "application/vnd.pagerduty+json": { source: "iana", compressible: !0 },
  "application/vnd.palm": { source: "iana", extensions: ["pdb", "pqa", "oprc"] },
  "application/vnd.panoply": { source: "iana" },
  "application/vnd.paos.xml": { source: "iana" },
  "application/vnd.patentdive": { source: "iana" },
  "application/vnd.patientecommsdoc": { source: "iana" },
  "application/vnd.pawaafile": { source: "iana", extensions: ["paw"] },
  "application/vnd.pcos": { source: "iana" },
  "application/vnd.pg.format": { source: "iana", extensions: ["str"] },
  "application/vnd.pg.osasli": { source: "iana", extensions: ["ei6"] },
  "application/vnd.piaccess.application-licence": { source: "iana" },
  "application/vnd.picsel": { source: "iana", extensions: ["efif"] },
  "application/vnd.pmi.widget": { source: "iana", extensions: ["wg"] },
  "application/vnd.poc.group-advertisement+xml": { source: "iana", compressible: !0 },
  "application/vnd.pocketlearn": { source: "iana", extensions: ["plf"] },
  "application/vnd.powerbuilder6": { source: "iana", extensions: ["pbd"] },
  "application/vnd.powerbuilder6-s": { source: "iana" },
  "application/vnd.powerbuilder7": { source: "iana" },
  "application/vnd.powerbuilder7-s": { source: "iana" },
  "application/vnd.powerbuilder75": { source: "iana" },
  "application/vnd.powerbuilder75-s": { source: "iana" },
  "application/vnd.preminet": { source: "iana" },
  "application/vnd.previewsystems.box": { source: "iana", extensions: ["box"] },
  "application/vnd.proteus.magazine": { source: "iana", extensions: ["mgz"] },
  "application/vnd.psfs": { source: "iana" },
  "application/vnd.publishare-delta-tree": { source: "iana", extensions: ["qps"] },
  "application/vnd.pvi.ptid1": { source: "iana", extensions: ["ptid"] },
  "application/vnd.pwg-multiplexed": { source: "iana" },
  "application/vnd.pwg-xhtml-print+xml": { source: "iana", compressible: !0 },
  "application/vnd.qualcomm.brew-app-res": { source: "iana" },
  "application/vnd.quarantainenet": { source: "iana" },
  "application/vnd.quark.quarkxpress": { source: "iana", extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"] },
  "application/vnd.quobject-quoxdocument": { source: "iana" },
  "application/vnd.radisys.moml+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-audit+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-audit-conf+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-audit-conn+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-audit-dialog+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-audit-stream+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-conf+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-base+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-fax-detect+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-group+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-speech+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-transform+xml": { source: "iana", compressible: !0 },
  "application/vnd.rainstor.data": { source: "iana" },
  "application/vnd.rapid": { source: "iana" },
  "application/vnd.rar": { source: "iana", extensions: ["rar"] },
  "application/vnd.realvnc.bed": { source: "iana", extensions: ["bed"] },
  "application/vnd.recordare.musicxml": { source: "iana", extensions: ["mxl"] },
  "application/vnd.recordare.musicxml+xml": { source: "iana", compressible: !0, extensions: ["musicxml"] },
  "application/vnd.renlearn.rlprint": { source: "iana" },
  "application/vnd.resilient.logic": { source: "iana" },
  "application/vnd.restful+json": { source: "iana", compressible: !0 },
  "application/vnd.rig.cryptonote": { source: "iana", extensions: ["cryptonote"] },
  "application/vnd.rim.cod": { source: "apache", extensions: ["cod"] },
  "application/vnd.rn-realmedia": { source: "apache", extensions: ["rm"] },
  "application/vnd.rn-realmedia-vbr": { source: "apache", extensions: ["rmvb"] },
  "application/vnd.route66.link66+xml": { source: "iana", compressible: !0, extensions: ["link66"] },
  "application/vnd.rs-274x": { source: "iana" },
  "application/vnd.ruckus.download": { source: "iana" },
  "application/vnd.s3sms": { source: "iana" },
  "application/vnd.sailingtracker.track": { source: "iana", extensions: ["st"] },
  "application/vnd.sar": { source: "iana" },
  "application/vnd.sbm.cid": { source: "iana" },
  "application/vnd.sbm.mid2": { source: "iana" },
  "application/vnd.scribus": { source: "iana" },
  "application/vnd.sealed.3df": { source: "iana" },
  "application/vnd.sealed.csf": { source: "iana" },
  "application/vnd.sealed.doc": { source: "iana" },
  "application/vnd.sealed.eml": { source: "iana" },
  "application/vnd.sealed.mht": { source: "iana" },
  "application/vnd.sealed.net": { source: "iana" },
  "application/vnd.sealed.ppt": { source: "iana" },
  "application/vnd.sealed.tiff": { source: "iana" },
  "application/vnd.sealed.xls": { source: "iana" },
  "application/vnd.sealedmedia.softseal.html": { source: "iana" },
  "application/vnd.sealedmedia.softseal.pdf": { source: "iana" },
  "application/vnd.seemail": { source: "iana", extensions: ["see"] },
  "application/vnd.seis+json": { source: "iana", compressible: !0 },
  "application/vnd.sema": { source: "iana", extensions: ["sema"] },
  "application/vnd.semd": { source: "iana", extensions: ["semd"] },
  "application/vnd.semf": { source: "iana", extensions: ["semf"] },
  "application/vnd.shade-save-file": { source: "iana" },
  "application/vnd.shana.informed.formdata": { source: "iana", extensions: ["ifm"] },
  "application/vnd.shana.informed.formtemplate": { source: "iana", extensions: ["itp"] },
  "application/vnd.shana.informed.interchange": { source: "iana", extensions: ["iif"] },
  "application/vnd.shana.informed.package": { source: "iana", extensions: ["ipk"] },
  "application/vnd.shootproof+json": { source: "iana", compressible: !0 },
  "application/vnd.shopkick+json": { source: "iana", compressible: !0 },
  "application/vnd.shp": { source: "iana" },
  "application/vnd.shx": { source: "iana" },
  "application/vnd.sigrok.session": { source: "iana" },
  "application/vnd.simtech-mindmapper": { source: "iana", extensions: ["twd", "twds"] },
  "application/vnd.siren+json": { source: "iana", compressible: !0 },
  "application/vnd.smaf": { source: "iana", extensions: ["mmf"] },
  "application/vnd.smart.notebook": { source: "iana" },
  "application/vnd.smart.teacher": { source: "iana", extensions: ["teacher"] },
  "application/vnd.snesdev-page-table": { source: "iana" },
  "application/vnd.software602.filler.form+xml": { source: "iana", compressible: !0, extensions: ["fo"] },
  "application/vnd.software602.filler.form-xml-zip": { source: "iana" },
  "application/vnd.solent.sdkm+xml": { source: "iana", compressible: !0, extensions: ["sdkm", "sdkd"] },
  "application/vnd.spotfire.dxp": { source: "iana", extensions: ["dxp"] },
  "application/vnd.spotfire.sfs": { source: "iana", extensions: ["sfs"] },
  "application/vnd.sqlite3": { source: "iana" },
  "application/vnd.sss-cod": { source: "iana" },
  "application/vnd.sss-dtf": { source: "iana" },
  "application/vnd.sss-ntf": { source: "iana" },
  "application/vnd.stardivision.calc": { source: "apache", extensions: ["sdc"] },
  "application/vnd.stardivision.draw": { source: "apache", extensions: ["sda"] },
  "application/vnd.stardivision.impress": { source: "apache", extensions: ["sdd"] },
  "application/vnd.stardivision.math": { source: "apache", extensions: ["smf"] },
  "application/vnd.stardivision.writer": { source: "apache", extensions: ["sdw", "vor"] },
  "application/vnd.stardivision.writer-global": { source: "apache", extensions: ["sgl"] },
  "application/vnd.stepmania.package": { source: "iana", extensions: ["smzip"] },
  "application/vnd.stepmania.stepchart": { source: "iana", extensions: ["sm"] },
  "application/vnd.street-stream": { source: "iana" },
  "application/vnd.sun.wadl+xml": { source: "iana", compressible: !0, extensions: ["wadl"] },
  "application/vnd.sun.xml.calc": { source: "apache", extensions: ["sxc"] },
  "application/vnd.sun.xml.calc.template": { source: "apache", extensions: ["stc"] },
  "application/vnd.sun.xml.draw": { source: "apache", extensions: ["sxd"] },
  "application/vnd.sun.xml.draw.template": { source: "apache", extensions: ["std"] },
  "application/vnd.sun.xml.impress": { source: "apache", extensions: ["sxi"] },
  "application/vnd.sun.xml.impress.template": { source: "apache", extensions: ["sti"] },
  "application/vnd.sun.xml.math": { source: "apache", extensions: ["sxm"] },
  "application/vnd.sun.xml.writer": { source: "apache", extensions: ["sxw"] },
  "application/vnd.sun.xml.writer.global": { source: "apache", extensions: ["sxg"] },
  "application/vnd.sun.xml.writer.template": { source: "apache", extensions: ["stw"] },
  "application/vnd.sus-calendar": { source: "iana", extensions: ["sus", "susp"] },
  "application/vnd.svd": { source: "iana", extensions: ["svd"] },
  "application/vnd.swiftview-ics": { source: "iana" },
  "application/vnd.sycle+xml": { source: "iana", compressible: !0 },
  "application/vnd.syft+json": { source: "iana", compressible: !0 },
  "application/vnd.symbian.install": { source: "apache", extensions: ["sis", "sisx"] },
  "application/vnd.syncml+xml": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["xsm"] },
  "application/vnd.syncml.dm+wbxml": { source: "iana", charset: "UTF-8", extensions: ["bdm"] },
  "application/vnd.syncml.dm+xml": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["xdm"] },
  "application/vnd.syncml.dm.notification": { source: "iana" },
  "application/vnd.syncml.dmddf+wbxml": { source: "iana" },
  "application/vnd.syncml.dmddf+xml": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["ddf"] },
  "application/vnd.syncml.dmtnds+wbxml": { source: "iana" },
  "application/vnd.syncml.dmtnds+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.syncml.ds.notification": { source: "iana" },
  "application/vnd.tableschema+json": { source: "iana", compressible: !0 },
  "application/vnd.tao.intent-module-archive": { source: "iana", extensions: ["tao"] },
  "application/vnd.tcpdump.pcap": { source: "iana", extensions: ["pcap", "cap", "dmp"] },
  "application/vnd.think-cell.ppttc+json": { source: "iana", compressible: !0 },
  "application/vnd.tmd.mediaflex.api+xml": { source: "iana", compressible: !0 },
  "application/vnd.tml": { source: "iana" },
  "application/vnd.tmobile-livetv": { source: "iana", extensions: ["tmo"] },
  "application/vnd.tri.onesource": { source: "iana" },
  "application/vnd.trid.tpt": { source: "iana", extensions: ["tpt"] },
  "application/vnd.triscape.mxs": { source: "iana", extensions: ["mxs"] },
  "application/vnd.trueapp": { source: "iana", extensions: ["tra"] },
  "application/vnd.truedoc": { source: "iana" },
  "application/vnd.ubisoft.webplayer": { source: "iana" },
  "application/vnd.ufdl": { source: "iana", extensions: ["ufd", "ufdl"] },
  "application/vnd.uiq.theme": { source: "iana", extensions: ["utz"] },
  "application/vnd.umajin": { source: "iana", extensions: ["umj"] },
  "application/vnd.unity": { source: "iana", extensions: ["unityweb"] },
  "application/vnd.uoml+xml": { source: "iana", compressible: !0, extensions: ["uoml"] },
  "application/vnd.uplanet.alert": { source: "iana" },
  "application/vnd.uplanet.alert-wbxml": { source: "iana" },
  "application/vnd.uplanet.bearer-choice": { source: "iana" },
  "application/vnd.uplanet.bearer-choice-wbxml": { source: "iana" },
  "application/vnd.uplanet.cacheop": { source: "iana" },
  "application/vnd.uplanet.cacheop-wbxml": { source: "iana" },
  "application/vnd.uplanet.channel": { source: "iana" },
  "application/vnd.uplanet.channel-wbxml": { source: "iana" },
  "application/vnd.uplanet.list": { source: "iana" },
  "application/vnd.uplanet.list-wbxml": { source: "iana" },
  "application/vnd.uplanet.listcmd": { source: "iana" },
  "application/vnd.uplanet.listcmd-wbxml": { source: "iana" },
  "application/vnd.uplanet.signal": { source: "iana" },
  "application/vnd.uri-map": { source: "iana" },
  "application/vnd.valve.source.material": { source: "iana" },
  "application/vnd.vcx": { source: "iana", extensions: ["vcx"] },
  "application/vnd.vd-study": { source: "iana" },
  "application/vnd.vectorworks": { source: "iana" },
  "application/vnd.vel+json": { source: "iana", compressible: !0 },
  "application/vnd.verimatrix.vcas": { source: "iana" },
  "application/vnd.veritone.aion+json": { source: "iana", compressible: !0 },
  "application/vnd.veryant.thin": { source: "iana" },
  "application/vnd.ves.encrypted": { source: "iana" },
  "application/vnd.vidsoft.vidconference": { source: "iana" },
  "application/vnd.visio": { source: "iana", extensions: ["vsd", "vst", "vss", "vsw"] },
  "application/vnd.visionary": { source: "iana", extensions: ["vis"] },
  "application/vnd.vividence.scriptfile": { source: "iana" },
  "application/vnd.vsf": { source: "iana", extensions: ["vsf"] },
  "application/vnd.wap.sic": { source: "iana" },
  "application/vnd.wap.slc": { source: "iana" },
  "application/vnd.wap.wbxml": { source: "iana", charset: "UTF-8", extensions: ["wbxml"] },
  "application/vnd.wap.wmlc": { source: "iana", extensions: ["wmlc"] },
  "application/vnd.wap.wmlscriptc": { source: "iana", extensions: ["wmlsc"] },
  "application/vnd.webturbo": { source: "iana", extensions: ["wtb"] },
  "application/vnd.wfa.dpp": { source: "iana" },
  "application/vnd.wfa.p2p": { source: "iana" },
  "application/vnd.wfa.wsc": { source: "iana" },
  "application/vnd.windows.devicepairing": { source: "iana" },
  "application/vnd.wmc": { source: "iana" },
  "application/vnd.wmf.bootstrap": { source: "iana" },
  "application/vnd.wolfram.mathematica": { source: "iana" },
  "application/vnd.wolfram.mathematica.package": { source: "iana" },
  "application/vnd.wolfram.player": { source: "iana", extensions: ["nbp"] },
  "application/vnd.wordperfect": { source: "iana", extensions: ["wpd"] },
  "application/vnd.wqd": { source: "iana", extensions: ["wqd"] },
  "application/vnd.wrq-hp3000-labelled": { source: "iana" },
  "application/vnd.wt.stf": { source: "iana", extensions: ["stf"] },
  "application/vnd.wv.csp+wbxml": { source: "iana" },
  "application/vnd.wv.csp+xml": { source: "iana", compressible: !0 },
  "application/vnd.wv.ssp+xml": { source: "iana", compressible: !0 },
  "application/vnd.xacml+json": { source: "iana", compressible: !0 },
  "application/vnd.xara": { source: "iana", extensions: ["xar"] },
  "application/vnd.xfdl": { source: "iana", extensions: ["xfdl"] },
  "application/vnd.xfdl.webform": { source: "iana" },
  "application/vnd.xmi+xml": { source: "iana", compressible: !0 },
  "application/vnd.xmpie.cpkg": { source: "iana" },
  "application/vnd.xmpie.dpkg": { source: "iana" },
  "application/vnd.xmpie.plan": { source: "iana" },
  "application/vnd.xmpie.ppkg": { source: "iana" },
  "application/vnd.xmpie.xlim": { source: "iana" },
  "application/vnd.yamaha.hv-dic": { source: "iana", extensions: ["hvd"] },
  "application/vnd.yamaha.hv-script": { source: "iana", extensions: ["hvs"] },
  "application/vnd.yamaha.hv-voice": { source: "iana", extensions: ["hvp"] },
  "application/vnd.yamaha.openscoreformat": { source: "iana", extensions: ["osf"] },
  "application/vnd.yamaha.openscoreformat.osfpvg+xml": { source: "iana", compressible: !0, extensions: ["osfpvg"] },
  "application/vnd.yamaha.remote-setup": { source: "iana" },
  "application/vnd.yamaha.smaf-audio": { source: "iana", extensions: ["saf"] },
  "application/vnd.yamaha.smaf-phrase": { source: "iana", extensions: ["spf"] },
  "application/vnd.yamaha.through-ngn": { source: "iana" },
  "application/vnd.yamaha.tunnel-udpencap": { source: "iana" },
  "application/vnd.yaoweme": { source: "iana" },
  "application/vnd.yellowriver-custom-menu": { source: "iana", extensions: ["cmp"] },
  "application/vnd.youtube.yt": { source: "iana" },
  "application/vnd.zul": { source: "iana", extensions: ["zir", "zirz"] },
  "application/vnd.zzazz.deck+xml": { source: "iana", compressible: !0, extensions: ["zaz"] },
  "application/voicexml+xml": { source: "iana", compressible: !0, extensions: ["vxml"] },
  "application/voucher-cms+json": { source: "iana", compressible: !0 },
  "application/vq-rtcpxr": { source: "iana" },
  "application/wasm": { source: "iana", compressible: !0, extensions: ["wasm"] },
  "application/watcherinfo+xml": { source: "iana", compressible: !0, extensions: ["wif"] },
  "application/webpush-options+json": { source: "iana", compressible: !0 },
  "application/whoispp-query": { source: "iana" },
  "application/whoispp-response": { source: "iana" },
  "application/widget": { source: "iana", extensions: ["wgt"] },
  "application/winhlp": { source: "apache", extensions: ["hlp"] },
  "application/wita": { source: "iana" },
  "application/wordperfect5.1": { source: "iana" },
  "application/wsdl+xml": { source: "iana", compressible: !0, extensions: ["wsdl"] },
  "application/wspolicy+xml": { source: "iana", compressible: !0, extensions: ["wspolicy"] },
  "application/x-7z-compressed": { source: "apache", compressible: !1, extensions: ["7z"] },
  "application/x-abiword": { source: "apache", extensions: ["abw"] },
  "application/x-ace-compressed": { source: "apache", extensions: ["ace"] },
  "application/x-amf": { source: "apache" },
  "application/x-apple-diskimage": { source: "apache", extensions: ["dmg"] },
  "application/x-arj": { compressible: !1, extensions: ["arj"] },
  "application/x-authorware-bin": { source: "apache", extensions: ["aab", "x32", "u32", "vox"] },
  "application/x-authorware-map": { source: "apache", extensions: ["aam"] },
  "application/x-authorware-seg": { source: "apache", extensions: ["aas"] },
  "application/x-bcpio": { source: "apache", extensions: ["bcpio"] },
  "application/x-bdoc": { compressible: !1, extensions: ["bdoc"] },
  "application/x-bittorrent": { source: "apache", extensions: ["torrent"] },
  "application/x-blorb": { source: "apache", extensions: ["blb", "blorb"] },
  "application/x-bzip": { source: "apache", compressible: !1, extensions: ["bz"] },
  "application/x-bzip2": { source: "apache", compressible: !1, extensions: ["bz2", "boz"] },
  "application/x-cbr": { source: "apache", extensions: ["cbr", "cba", "cbt", "cbz", "cb7"] },
  "application/x-cdlink": { source: "apache", extensions: ["vcd"] },
  "application/x-cfs-compressed": { source: "apache", extensions: ["cfs"] },
  "application/x-chat": { source: "apache", extensions: ["chat"] },
  "application/x-chess-pgn": { source: "apache", extensions: ["pgn"] },
  "application/x-chrome-extension": { extensions: ["crx"] },
  "application/x-cocoa": { source: "nginx", extensions: ["cco"] },
  "application/x-compress": { source: "apache" },
  "application/x-conference": { source: "apache", extensions: ["nsc"] },
  "application/x-cpio": { source: "apache", extensions: ["cpio"] },
  "application/x-csh": { source: "apache", extensions: ["csh"] },
  "application/x-deb": { compressible: !1 },
  "application/x-debian-package": { source: "apache", extensions: ["deb", "udeb"] },
  "application/x-dgc-compressed": { source: "apache", extensions: ["dgc"] },
  "application/x-director": { source: "apache", extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"] },
  "application/x-doom": { source: "apache", extensions: ["wad"] },
  "application/x-dtbncx+xml": { source: "apache", compressible: !0, extensions: ["ncx"] },
  "application/x-dtbook+xml": { source: "apache", compressible: !0, extensions: ["dtb"] },
  "application/x-dtbresource+xml": { source: "apache", compressible: !0, extensions: ["res"] },
  "application/x-dvi": { source: "apache", compressible: !1, extensions: ["dvi"] },
  "application/x-envoy": { source: "apache", extensions: ["evy"] },
  "application/x-eva": { source: "apache", extensions: ["eva"] },
  "application/x-font-bdf": { source: "apache", extensions: ["bdf"] },
  "application/x-font-dos": { source: "apache" },
  "application/x-font-framemaker": { source: "apache" },
  "application/x-font-ghostscript": { source: "apache", extensions: ["gsf"] },
  "application/x-font-libgrx": { source: "apache" },
  "application/x-font-linux-psf": { source: "apache", extensions: ["psf"] },
  "application/x-font-pcf": { source: "apache", extensions: ["pcf"] },
  "application/x-font-snf": { source: "apache", extensions: ["snf"] },
  "application/x-font-speedo": { source: "apache" },
  "application/x-font-sunos-news": { source: "apache" },
  "application/x-font-type1": { source: "apache", extensions: ["pfa", "pfb", "pfm", "afm"] },
  "application/x-font-vfont": { source: "apache" },
  "application/x-freearc": { source: "apache", extensions: ["arc"] },
  "application/x-futuresplash": { source: "apache", extensions: ["spl"] },
  "application/x-gca-compressed": { source: "apache", extensions: ["gca"] },
  "application/x-glulx": { source: "apache", extensions: ["ulx"] },
  "application/x-gnumeric": { source: "apache", extensions: ["gnumeric"] },
  "application/x-gramps-xml": { source: "apache", extensions: ["gramps"] },
  "application/x-gtar": { source: "apache", extensions: ["gtar"] },
  "application/x-gzip": { source: "apache" },
  "application/x-hdf": { source: "apache", extensions: ["hdf"] },
  "application/x-httpd-php": { compressible: !0, extensions: ["php"] },
  "application/x-install-instructions": { source: "apache", extensions: ["install"] },
  "application/x-iso9660-image": { source: "apache", extensions: ["iso"] },
  "application/x-iwork-keynote-sffkey": { extensions: ["key"] },
  "application/x-iwork-numbers-sffnumbers": { extensions: ["numbers"] },
  "application/x-iwork-pages-sffpages": { extensions: ["pages"] },
  "application/x-java-archive-diff": { source: "nginx", extensions: ["jardiff"] },
  "application/x-java-jnlp-file": { source: "apache", compressible: !1, extensions: ["jnlp"] },
  "application/x-javascript": { compressible: !0 },
  "application/x-keepass2": { extensions: ["kdbx"] },
  "application/x-latex": { source: "apache", compressible: !1, extensions: ["latex"] },
  "application/x-lua-bytecode": { extensions: ["luac"] },
  "application/x-lzh-compressed": { source: "apache", extensions: ["lzh", "lha"] },
  "application/x-makeself": { source: "nginx", extensions: ["run"] },
  "application/x-mie": { source: "apache", extensions: ["mie"] },
  "application/x-mobipocket-ebook": { source: "apache", extensions: ["prc", "mobi"] },
  "application/x-mpegurl": { compressible: !1 },
  "application/x-ms-application": { source: "apache", extensions: ["application"] },
  "application/x-ms-shortcut": { source: "apache", extensions: ["lnk"] },
  "application/x-ms-wmd": { source: "apache", extensions: ["wmd"] },
  "application/x-ms-wmz": { source: "apache", extensions: ["wmz"] },
  "application/x-ms-xbap": { source: "apache", extensions: ["xbap"] },
  "application/x-msaccess": { source: "apache", extensions: ["mdb"] },
  "application/x-msbinder": { source: "apache", extensions: ["obd"] },
  "application/x-mscardfile": { source: "apache", extensions: ["crd"] },
  "application/x-msclip": { source: "apache", extensions: ["clp"] },
  "application/x-msdos-program": { extensions: ["exe"] },
  "application/x-msdownload": { source: "apache", extensions: ["exe", "dll", "com", "bat", "msi"] },
  "application/x-msmediaview": { source: "apache", extensions: ["mvb", "m13", "m14"] },
  "application/x-msmetafile": { source: "apache", extensions: ["wmf", "wmz", "emf", "emz"] },
  "application/x-msmoney": { source: "apache", extensions: ["mny"] },
  "application/x-mspublisher": { source: "apache", extensions: ["pub"] },
  "application/x-msschedule": { source: "apache", extensions: ["scd"] },
  "application/x-msterminal": { source: "apache", extensions: ["trm"] },
  "application/x-mswrite": { source: "apache", extensions: ["wri"] },
  "application/x-netcdf": { source: "apache", extensions: ["nc", "cdf"] },
  "application/x-ns-proxy-autoconfig": { compressible: !0, extensions: ["pac"] },
  "application/x-nzb": { source: "apache", extensions: ["nzb"] },
  "application/x-perl": { source: "nginx", extensions: ["pl", "pm"] },
  "application/x-pilot": { source: "nginx", extensions: ["prc", "pdb"] },
  "application/x-pkcs12": { source: "apache", compressible: !1, extensions: ["p12", "pfx"] },
  "application/x-pkcs7-certificates": { source: "apache", extensions: ["p7b", "spc"] },
  "application/x-pkcs7-certreqresp": { source: "apache", extensions: ["p7r"] },
  "application/x-pki-message": { source: "iana" },
  "application/x-rar-compressed": { source: "apache", compressible: !1, extensions: ["rar"] },
  "application/x-redhat-package-manager": { source: "nginx", extensions: ["rpm"] },
  "application/x-research-info-systems": { source: "apache", extensions: ["ris"] },
  "application/x-sea": { source: "nginx", extensions: ["sea"] },
  "application/x-sh": { source: "apache", compressible: !0, extensions: ["sh"] },
  "application/x-shar": { source: "apache", extensions: ["shar"] },
  "application/x-shockwave-flash": { source: "apache", compressible: !1, extensions: ["swf"] },
  "application/x-silverlight-app": { source: "apache", extensions: ["xap"] },
  "application/x-sql": { source: "apache", extensions: ["sql"] },
  "application/x-stuffit": { source: "apache", compressible: !1, extensions: ["sit"] },
  "application/x-stuffitx": { source: "apache", extensions: ["sitx"] },
  "application/x-subrip": { source: "apache", extensions: ["srt"] },
  "application/x-sv4cpio": { source: "apache", extensions: ["sv4cpio"] },
  "application/x-sv4crc": { source: "apache", extensions: ["sv4crc"] },
  "application/x-t3vm-image": { source: "apache", extensions: ["t3"] },
  "application/x-tads": { source: "apache", extensions: ["gam"] },
  "application/x-tar": { source: "apache", compressible: !0, extensions: ["tar"] },
  "application/x-tcl": { source: "apache", extensions: ["tcl", "tk"] },
  "application/x-tex": { source: "apache", extensions: ["tex"] },
  "application/x-tex-tfm": { source: "apache", extensions: ["tfm"] },
  "application/x-texinfo": { source: "apache", extensions: ["texinfo", "texi"] },
  "application/x-tgif": { source: "apache", extensions: ["obj"] },
  "application/x-ustar": { source: "apache", extensions: ["ustar"] },
  "application/x-virtualbox-hdd": { compressible: !0, extensions: ["hdd"] },
  "application/x-virtualbox-ova": { compressible: !0, extensions: ["ova"] },
  "application/x-virtualbox-ovf": { compressible: !0, extensions: ["ovf"] },
  "application/x-virtualbox-vbox": { compressible: !0, extensions: ["vbox"] },
  "application/x-virtualbox-vbox-extpack": { compressible: !1, extensions: ["vbox-extpack"] },
  "application/x-virtualbox-vdi": { compressible: !0, extensions: ["vdi"] },
  "application/x-virtualbox-vhd": { compressible: !0, extensions: ["vhd"] },
  "application/x-virtualbox-vmdk": { compressible: !0, extensions: ["vmdk"] },
  "application/x-wais-source": { source: "apache", extensions: ["src"] },
  "application/x-web-app-manifest+json": { compressible: !0, extensions: ["webapp"] },
  "application/x-www-form-urlencoded": { source: "iana", compressible: !0 },
  "application/x-x509-ca-cert": { source: "iana", extensions: ["der", "crt", "pem"] },
  "application/x-x509-ca-ra-cert": { source: "iana" },
  "application/x-x509-next-ca-cert": { source: "iana" },
  "application/x-xfig": { source: "apache", extensions: ["fig"] },
  "application/x-xliff+xml": { source: "apache", compressible: !0, extensions: ["xlf"] },
  "application/x-xpinstall": { source: "apache", compressible: !1, extensions: ["xpi"] },
  "application/x-xz": { source: "apache", extensions: ["xz"] },
  "application/x-zmachine": { source: "apache", extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"] },
  "application/x400-bp": { source: "iana" },
  "application/xacml+xml": { source: "iana", compressible: !0 },
  "application/xaml+xml": { source: "apache", compressible: !0, extensions: ["xaml"] },
  "application/xcap-att+xml": { source: "iana", compressible: !0, extensions: ["xav"] },
  "application/xcap-caps+xml": { source: "iana", compressible: !0, extensions: ["xca"] },
  "application/xcap-diff+xml": { source: "iana", compressible: !0, extensions: ["xdf"] },
  "application/xcap-el+xml": { source: "iana", compressible: !0, extensions: ["xel"] },
  "application/xcap-error+xml": { source: "iana", compressible: !0 },
  "application/xcap-ns+xml": { source: "iana", compressible: !0, extensions: ["xns"] },
  "application/xcon-conference-info+xml": { source: "iana", compressible: !0 },
  "application/xcon-conference-info-diff+xml": { source: "iana", compressible: !0 },
  "application/xenc+xml": { source: "iana", compressible: !0, extensions: ["xenc"] },
  "application/xhtml+xml": { source: "iana", compressible: !0, extensions: ["xhtml", "xht"] },
  "application/xhtml-voice+xml": { source: "apache", compressible: !0 },
  "application/xliff+xml": { source: "iana", compressible: !0, extensions: ["xlf"] },
  "application/xml": { source: "iana", compressible: !0, extensions: ["xml", "xsl", "xsd", "rng"] },
  "application/xml-dtd": { source: "iana", compressible: !0, extensions: ["dtd"] },
  "application/xml-external-parsed-entity": { source: "iana" },
  "application/xml-patch+xml": { source: "iana", compressible: !0 },
  "application/xmpp+xml": { source: "iana", compressible: !0 },
  "application/xop+xml": { source: "iana", compressible: !0, extensions: ["xop"] },
  "application/xproc+xml": { source: "apache", compressible: !0, extensions: ["xpl"] },
  "application/xslt+xml": { source: "iana", compressible: !0, extensions: ["xsl", "xslt"] },
  "application/xspf+xml": { source: "apache", compressible: !0, extensions: ["xspf"] },
  "application/xv+xml": { source: "iana", compressible: !0, extensions: ["mxml", "xhvml", "xvml", "xvm"] },
  "application/yang": { source: "iana", extensions: ["yang"] },
  "application/yang-data+json": { source: "iana", compressible: !0 },
  "application/yang-data+xml": { source: "iana", compressible: !0 },
  "application/yang-patch+json": { source: "iana", compressible: !0 },
  "application/yang-patch+xml": { source: "iana", compressible: !0 },
  "application/yin+xml": { source: "iana", compressible: !0, extensions: ["yin"] },
  "application/zip": { source: "iana", compressible: !1, extensions: ["zip"] },
  "application/zlib": { source: "iana" },
  "application/zstd": { source: "iana" },
  "audio/1d-interleaved-parityfec": { source: "iana" },
  "audio/32kadpcm": { source: "iana" },
  "audio/3gpp": { source: "iana", compressible: !1, extensions: ["3gpp"] },
  "audio/3gpp2": { source: "iana" },
  "audio/aac": { source: "iana" },
  "audio/ac3": { source: "iana" },
  "audio/adpcm": { source: "apache", extensions: ["adp"] },
  "audio/amr": { source: "iana", extensions: ["amr"] },
  "audio/amr-wb": { source: "iana" },
  "audio/amr-wb+": { source: "iana" },
  "audio/aptx": { source: "iana" },
  "audio/asc": { source: "iana" },
  "audio/atrac-advanced-lossless": { source: "iana" },
  "audio/atrac-x": { source: "iana" },
  "audio/atrac3": { source: "iana" },
  "audio/basic": { source: "iana", compressible: !1, extensions: ["au", "snd"] },
  "audio/bv16": { source: "iana" },
  "audio/bv32": { source: "iana" },
  "audio/clearmode": { source: "iana" },
  "audio/cn": { source: "iana" },
  "audio/dat12": { source: "iana" },
  "audio/dls": { source: "iana" },
  "audio/dsr-es201108": { source: "iana" },
  "audio/dsr-es202050": { source: "iana" },
  "audio/dsr-es202211": { source: "iana" },
  "audio/dsr-es202212": { source: "iana" },
  "audio/dv": { source: "iana" },
  "audio/dvi4": { source: "iana" },
  "audio/eac3": { source: "iana" },
  "audio/encaprtp": { source: "iana" },
  "audio/evrc": { source: "iana" },
  "audio/evrc-qcp": { source: "iana" },
  "audio/evrc0": { source: "iana" },
  "audio/evrc1": { source: "iana" },
  "audio/evrcb": { source: "iana" },
  "audio/evrcb0": { source: "iana" },
  "audio/evrcb1": { source: "iana" },
  "audio/evrcnw": { source: "iana" },
  "audio/evrcnw0": { source: "iana" },
  "audio/evrcnw1": { source: "iana" },
  "audio/evrcwb": { source: "iana" },
  "audio/evrcwb0": { source: "iana" },
  "audio/evrcwb1": { source: "iana" },
  "audio/evs": { source: "iana" },
  "audio/flexfec": { source: "iana" },
  "audio/fwdred": { source: "iana" },
  "audio/g711-0": { source: "iana" },
  "audio/g719": { source: "iana" },
  "audio/g722": { source: "iana" },
  "audio/g7221": { source: "iana" },
  "audio/g723": { source: "iana" },
  "audio/g726-16": { source: "iana" },
  "audio/g726-24": { source: "iana" },
  "audio/g726-32": { source: "iana" },
  "audio/g726-40": { source: "iana" },
  "audio/g728": { source: "iana" },
  "audio/g729": { source: "iana" },
  "audio/g7291": { source: "iana" },
  "audio/g729d": { source: "iana" },
  "audio/g729e": { source: "iana" },
  "audio/gsm": { source: "iana" },
  "audio/gsm-efr": { source: "iana" },
  "audio/gsm-hr-08": { source: "iana" },
  "audio/ilbc": { source: "iana" },
  "audio/ip-mr_v2.5": { source: "iana" },
  "audio/isac": { source: "apache" },
  "audio/l16": { source: "iana" },
  "audio/l20": { source: "iana" },
  "audio/l24": { source: "iana", compressible: !1 },
  "audio/l8": { source: "iana" },
  "audio/lpc": { source: "iana" },
  "audio/melp": { source: "iana" },
  "audio/melp1200": { source: "iana" },
  "audio/melp2400": { source: "iana" },
  "audio/melp600": { source: "iana" },
  "audio/mhas": { source: "iana" },
  "audio/midi": { source: "apache", extensions: ["mid", "midi", "kar", "rmi"] },
  "audio/mobile-xmf": { source: "iana", extensions: ["mxmf"] },
  "audio/mp3": { compressible: !1, extensions: ["mp3"] },
  "audio/mp4": { source: "iana", compressible: !1, extensions: ["m4a", "mp4a"] },
  "audio/mp4a-latm": { source: "iana" },
  "audio/mpa": { source: "iana" },
  "audio/mpa-robust": { source: "iana" },
  "audio/mpeg": { source: "iana", compressible: !1, extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"] },
  "audio/mpeg4-generic": { source: "iana" },
  "audio/musepack": { source: "apache" },
  "audio/ogg": { source: "iana", compressible: !1, extensions: ["oga", "ogg", "spx", "opus"] },
  "audio/opus": { source: "iana" },
  "audio/parityfec": { source: "iana" },
  "audio/pcma": { source: "iana" },
  "audio/pcma-wb": { source: "iana" },
  "audio/pcmu": { source: "iana" },
  "audio/pcmu-wb": { source: "iana" },
  "audio/prs.sid": { source: "iana" },
  "audio/qcelp": { source: "iana" },
  "audio/raptorfec": { source: "iana" },
  "audio/red": { source: "iana" },
  "audio/rtp-enc-aescm128": { source: "iana" },
  "audio/rtp-midi": { source: "iana" },
  "audio/rtploopback": { source: "iana" },
  "audio/rtx": { source: "iana" },
  "audio/s3m": { source: "apache", extensions: ["s3m"] },
  "audio/scip": { source: "iana" },
  "audio/silk": { source: "apache", extensions: ["sil"] },
  "audio/smv": { source: "iana" },
  "audio/smv-qcp": { source: "iana" },
  "audio/smv0": { source: "iana" },
  "audio/sofa": { source: "iana" },
  "audio/sp-midi": { source: "iana" },
  "audio/speex": { source: "iana" },
  "audio/t140c": { source: "iana" },
  "audio/t38": { source: "iana" },
  "audio/telephone-event": { source: "iana" },
  "audio/tetra_acelp": { source: "iana" },
  "audio/tetra_acelp_bb": { source: "iana" },
  "audio/tone": { source: "iana" },
  "audio/tsvcis": { source: "iana" },
  "audio/uemclip": { source: "iana" },
  "audio/ulpfec": { source: "iana" },
  "audio/usac": { source: "iana" },
  "audio/vdvi": { source: "iana" },
  "audio/vmr-wb": { source: "iana" },
  "audio/vnd.3gpp.iufp": { source: "iana" },
  "audio/vnd.4sb": { source: "iana" },
  "audio/vnd.audiokoz": { source: "iana" },
  "audio/vnd.celp": { source: "iana" },
  "audio/vnd.cisco.nse": { source: "iana" },
  "audio/vnd.cmles.radio-events": { source: "iana" },
  "audio/vnd.cns.anp1": { source: "iana" },
  "audio/vnd.cns.inf1": { source: "iana" },
  "audio/vnd.dece.audio": { source: "iana", extensions: ["uva", "uvva"] },
  "audio/vnd.digital-winds": { source: "iana", extensions: ["eol"] },
  "audio/vnd.dlna.adts": { source: "iana" },
  "audio/vnd.dolby.heaac.1": { source: "iana" },
  "audio/vnd.dolby.heaac.2": { source: "iana" },
  "audio/vnd.dolby.mlp": { source: "iana" },
  "audio/vnd.dolby.mps": { source: "iana" },
  "audio/vnd.dolby.pl2": { source: "iana" },
  "audio/vnd.dolby.pl2x": { source: "iana" },
  "audio/vnd.dolby.pl2z": { source: "iana" },
  "audio/vnd.dolby.pulse.1": { source: "iana" },
  "audio/vnd.dra": { source: "iana", extensions: ["dra"] },
  "audio/vnd.dts": { source: "iana", extensions: ["dts"] },
  "audio/vnd.dts.hd": { source: "iana", extensions: ["dtshd"] },
  "audio/vnd.dts.uhd": { source: "iana" },
  "audio/vnd.dvb.file": { source: "iana" },
  "audio/vnd.everad.plj": { source: "iana" },
  "audio/vnd.hns.audio": { source: "iana" },
  "audio/vnd.lucent.voice": { source: "iana", extensions: ["lvp"] },
  "audio/vnd.ms-playready.media.pya": { source: "iana", extensions: ["pya"] },
  "audio/vnd.nokia.mobile-xmf": { source: "iana" },
  "audio/vnd.nortel.vbk": { source: "iana" },
  "audio/vnd.nuera.ecelp4800": { source: "iana", extensions: ["ecelp4800"] },
  "audio/vnd.nuera.ecelp7470": { source: "iana", extensions: ["ecelp7470"] },
  "audio/vnd.nuera.ecelp9600": { source: "iana", extensions: ["ecelp9600"] },
  "audio/vnd.octel.sbc": { source: "iana" },
  "audio/vnd.presonus.multitrack": { source: "iana" },
  "audio/vnd.qcelp": { source: "iana" },
  "audio/vnd.rhetorex.32kadpcm": { source: "iana" },
  "audio/vnd.rip": { source: "iana", extensions: ["rip"] },
  "audio/vnd.rn-realaudio": { compressible: !1 },
  "audio/vnd.sealedmedia.softseal.mpeg": { source: "iana" },
  "audio/vnd.vmx.cvsd": { source: "iana" },
  "audio/vnd.wave": { compressible: !1 },
  "audio/vorbis": { source: "iana", compressible: !1 },
  "audio/vorbis-config": { source: "iana" },
  "audio/wav": { compressible: !1, extensions: ["wav"] },
  "audio/wave": { compressible: !1, extensions: ["wav"] },
  "audio/webm": { source: "apache", compressible: !1, extensions: ["weba"] },
  "audio/x-aac": { source: "apache", compressible: !1, extensions: ["aac"] },
  "audio/x-aiff": { source: "apache", extensions: ["aif", "aiff", "aifc"] },
  "audio/x-caf": { source: "apache", compressible: !1, extensions: ["caf"] },
  "audio/x-flac": { source: "apache", extensions: ["flac"] },
  "audio/x-m4a": { source: "nginx", extensions: ["m4a"] },
  "audio/x-matroska": { source: "apache", extensions: ["mka"] },
  "audio/x-mpegurl": { source: "apache", extensions: ["m3u"] },
  "audio/x-ms-wax": { source: "apache", extensions: ["wax"] },
  "audio/x-ms-wma": { source: "apache", extensions: ["wma"] },
  "audio/x-pn-realaudio": { source: "apache", extensions: ["ram", "ra"] },
  "audio/x-pn-realaudio-plugin": { source: "apache", extensions: ["rmp"] },
  "audio/x-realaudio": { source: "nginx", extensions: ["ra"] },
  "audio/x-tta": { source: "apache" },
  "audio/x-wav": { source: "apache", extensions: ["wav"] },
  "audio/xm": { source: "apache", extensions: ["xm"] },
  "chemical/x-cdx": { source: "apache", extensions: ["cdx"] },
  "chemical/x-cif": { source: "apache", extensions: ["cif"] },
  "chemical/x-cmdf": { source: "apache", extensions: ["cmdf"] },
  "chemical/x-cml": { source: "apache", extensions: ["cml"] },
  "chemical/x-csml": { source: "apache", extensions: ["csml"] },
  "chemical/x-pdb": { source: "apache" },
  "chemical/x-xyz": { source: "apache", extensions: ["xyz"] },
  "font/collection": { source: "iana", extensions: ["ttc"] },
  "font/otf": { source: "iana", compressible: !0, extensions: ["otf"] },
  "font/sfnt": { source: "iana" },
  "font/ttf": { source: "iana", compressible: !0, extensions: ["ttf"] },
  "font/woff": { source: "iana", extensions: ["woff"] },
  "font/woff2": { source: "iana", extensions: ["woff2"] },
  "image/aces": { source: "iana", extensions: ["exr"] },
  "image/apng": { compressible: !1, extensions: ["apng"] },
  "image/avci": { source: "iana", extensions: ["avci"] },
  "image/avcs": { source: "iana", extensions: ["avcs"] },
  "image/avif": { source: "iana", compressible: !1, extensions: ["avif"] },
  "image/bmp": { source: "iana", compressible: !0, extensions: ["bmp"] },
  "image/cgm": { source: "iana", extensions: ["cgm"] },
  "image/dicom-rle": { source: "iana", extensions: ["drle"] },
  "image/emf": { source: "iana", extensions: ["emf"] },
  "image/fits": { source: "iana", extensions: ["fits"] },
  "image/g3fax": { source: "iana", extensions: ["g3"] },
  "image/gif": { source: "iana", compressible: !1, extensions: ["gif"] },
  "image/heic": { source: "iana", extensions: ["heic"] },
  "image/heic-sequence": { source: "iana", extensions: ["heics"] },
  "image/heif": { source: "iana", extensions: ["heif"] },
  "image/heif-sequence": { source: "iana", extensions: ["heifs"] },
  "image/hej2k": { source: "iana", extensions: ["hej2"] },
  "image/hsj2": { source: "iana", extensions: ["hsj2"] },
  "image/ief": { source: "iana", extensions: ["ief"] },
  "image/jls": { source: "iana", extensions: ["jls"] },
  "image/jp2": { source: "iana", compressible: !1, extensions: ["jp2", "jpg2"] },
  "image/jpeg": { source: "iana", compressible: !1, extensions: ["jpeg", "jpg", "jpe"] },
  "image/jph": { source: "iana", extensions: ["jph"] },
  "image/jphc": { source: "iana", extensions: ["jhc"] },
  "image/jpm": { source: "iana", compressible: !1, extensions: ["jpm"] },
  "image/jpx": { source: "iana", compressible: !1, extensions: ["jpx", "jpf"] },
  "image/jxr": { source: "iana", extensions: ["jxr"] },
  "image/jxra": { source: "iana", extensions: ["jxra"] },
  "image/jxrs": { source: "iana", extensions: ["jxrs"] },
  "image/jxs": { source: "iana", extensions: ["jxs"] },
  "image/jxsc": { source: "iana", extensions: ["jxsc"] },
  "image/jxsi": { source: "iana", extensions: ["jxsi"] },
  "image/jxss": { source: "iana", extensions: ["jxss"] },
  "image/ktx": { source: "iana", extensions: ["ktx"] },
  "image/ktx2": { source: "iana", extensions: ["ktx2"] },
  "image/naplps": { source: "iana" },
  "image/pjpeg": { compressible: !1 },
  "image/png": { source: "iana", compressible: !1, extensions: ["png"] },
  "image/prs.btif": { source: "iana", extensions: ["btif"] },
  "image/prs.pti": { source: "iana", extensions: ["pti"] },
  "image/pwg-raster": { source: "iana" },
  "image/sgi": { source: "apache", extensions: ["sgi"] },
  "image/svg+xml": { source: "iana", compressible: !0, extensions: ["svg", "svgz"] },
  "image/t38": { source: "iana", extensions: ["t38"] },
  "image/tiff": { source: "iana", compressible: !1, extensions: ["tif", "tiff"] },
  "image/tiff-fx": { source: "iana", extensions: ["tfx"] },
  "image/vnd.adobe.photoshop": { source: "iana", compressible: !0, extensions: ["psd"] },
  "image/vnd.airzip.accelerator.azv": { source: "iana", extensions: ["azv"] },
  "image/vnd.cns.inf2": { source: "iana" },
  "image/vnd.dece.graphic": { source: "iana", extensions: ["uvi", "uvvi", "uvg", "uvvg"] },
  "image/vnd.djvu": { source: "iana", extensions: ["djvu", "djv"] },
  "image/vnd.dvb.subtitle": { source: "iana", extensions: ["sub"] },
  "image/vnd.dwg": { source: "iana", extensions: ["dwg"] },
  "image/vnd.dxf": { source: "iana", extensions: ["dxf"] },
  "image/vnd.fastbidsheet": { source: "iana", extensions: ["fbs"] },
  "image/vnd.fpx": { source: "iana", extensions: ["fpx"] },
  "image/vnd.fst": { source: "iana", extensions: ["fst"] },
  "image/vnd.fujixerox.edmics-mmr": { source: "iana", extensions: ["mmr"] },
  "image/vnd.fujixerox.edmics-rlc": { source: "iana", extensions: ["rlc"] },
  "image/vnd.globalgraphics.pgb": { source: "iana" },
  "image/vnd.microsoft.icon": { source: "iana", compressible: !0, extensions: ["ico"] },
  "image/vnd.mix": { source: "iana" },
  "image/vnd.mozilla.apng": { source: "iana" },
  "image/vnd.ms-dds": { compressible: !0, extensions: ["dds"] },
  "image/vnd.ms-modi": { source: "iana", extensions: ["mdi"] },
  "image/vnd.ms-photo": { source: "apache", extensions: ["wdp"] },
  "image/vnd.net-fpx": { source: "iana", extensions: ["npx"] },
  "image/vnd.pco.b16": { source: "iana", extensions: ["b16"] },
  "image/vnd.radiance": { source: "iana" },
  "image/vnd.sealed.png": { source: "iana" },
  "image/vnd.sealedmedia.softseal.gif": { source: "iana" },
  "image/vnd.sealedmedia.softseal.jpg": { source: "iana" },
  "image/vnd.svf": { source: "iana" },
  "image/vnd.tencent.tap": { source: "iana", extensions: ["tap"] },
  "image/vnd.valve.source.texture": { source: "iana", extensions: ["vtf"] },
  "image/vnd.wap.wbmp": { source: "iana", extensions: ["wbmp"] },
  "image/vnd.xiff": { source: "iana", extensions: ["xif"] },
  "image/vnd.zbrush.pcx": { source: "iana", extensions: ["pcx"] },
  "image/webp": { source: "apache", extensions: ["webp"] },
  "image/wmf": { source: "iana", extensions: ["wmf"] },
  "image/x-3ds": { source: "apache", extensions: ["3ds"] },
  "image/x-cmu-raster": { source: "apache", extensions: ["ras"] },
  "image/x-cmx": { source: "apache", extensions: ["cmx"] },
  "image/x-freehand": { source: "apache", extensions: ["fh", "fhc", "fh4", "fh5", "fh7"] },
  "image/x-icon": { source: "apache", compressible: !0, extensions: ["ico"] },
  "image/x-jng": { source: "nginx", extensions: ["jng"] },
  "image/x-mrsid-image": { source: "apache", extensions: ["sid"] },
  "image/x-ms-bmp": { source: "nginx", compressible: !0, extensions: ["bmp"] },
  "image/x-pcx": { source: "apache", extensions: ["pcx"] },
  "image/x-pict": { source: "apache", extensions: ["pic", "pct"] },
  "image/x-portable-anymap": { source: "apache", extensions: ["pnm"] },
  "image/x-portable-bitmap": { source: "apache", extensions: ["pbm"] },
  "image/x-portable-graymap": { source: "apache", extensions: ["pgm"] },
  "image/x-portable-pixmap": { source: "apache", extensions: ["ppm"] },
  "image/x-rgb": { source: "apache", extensions: ["rgb"] },
  "image/x-tga": { source: "apache", extensions: ["tga"] },
  "image/x-xbitmap": { source: "apache", extensions: ["xbm"] },
  "image/x-xcf": { compressible: !1 },
  "image/x-xpixmap": { source: "apache", extensions: ["xpm"] },
  "image/x-xwindowdump": { source: "apache", extensions: ["xwd"] },
  "message/cpim": { source: "iana" },
  "message/delivery-status": { source: "iana" },
  "message/disposition-notification": { source: "iana", extensions: ["disposition-notification"] },
  "message/external-body": { source: "iana" },
  "message/feedback-report": { source: "iana" },
  "message/global": { source: "iana", extensions: ["u8msg"] },
  "message/global-delivery-status": { source: "iana", extensions: ["u8dsn"] },
  "message/global-disposition-notification": { source: "iana", extensions: ["u8mdn"] },
  "message/global-headers": { source: "iana", extensions: ["u8hdr"] },
  "message/http": { source: "iana", compressible: !1 },
  "message/imdn+xml": { source: "iana", compressible: !0 },
  "message/news": { source: "iana" },
  "message/partial": { source: "iana", compressible: !1 },
  "message/rfc822": { source: "iana", compressible: !0, extensions: ["eml", "mime"] },
  "message/s-http": { source: "iana" },
  "message/sip": { source: "iana" },
  "message/sipfrag": { source: "iana" },
  "message/tracking-status": { source: "iana" },
  "message/vnd.si.simp": { source: "iana" },
  "message/vnd.wfa.wsc": { source: "iana", extensions: ["wsc"] },
  "model/3mf": { source: "iana", extensions: ["3mf"] },
  "model/e57": { source: "iana" },
  "model/gltf+json": { source: "iana", compressible: !0, extensions: ["gltf"] },
  "model/gltf-binary": { source: "iana", compressible: !0, extensions: ["glb"] },
  "model/iges": { source: "iana", compressible: !1, extensions: ["igs", "iges"] },
  "model/mesh": { source: "iana", compressible: !1, extensions: ["msh", "mesh", "silo"] },
  "model/mtl": { source: "iana", extensions: ["mtl"] },
  "model/obj": { source: "iana", extensions: ["obj"] },
  "model/step": { source: "iana" },
  "model/step+xml": { source: "iana", compressible: !0, extensions: ["stpx"] },
  "model/step+zip": { source: "iana", compressible: !1, extensions: ["stpz"] },
  "model/step-xml+zip": { source: "iana", compressible: !1, extensions: ["stpxz"] },
  "model/stl": { source: "iana", extensions: ["stl"] },
  "model/vnd.collada+xml": { source: "iana", compressible: !0, extensions: ["dae"] },
  "model/vnd.dwf": { source: "iana", extensions: ["dwf"] },
  "model/vnd.flatland.3dml": { source: "iana" },
  "model/vnd.gdl": { source: "iana", extensions: ["gdl"] },
  "model/vnd.gs-gdl": { source: "apache" },
  "model/vnd.gs.gdl": { source: "iana" },
  "model/vnd.gtw": { source: "iana", extensions: ["gtw"] },
  "model/vnd.moml+xml": { source: "iana", compressible: !0 },
  "model/vnd.mts": { source: "iana", extensions: ["mts"] },
  "model/vnd.opengex": { source: "iana", extensions: ["ogex"] },
  "model/vnd.parasolid.transmit.binary": { source: "iana", extensions: ["x_b"] },
  "model/vnd.parasolid.transmit.text": { source: "iana", extensions: ["x_t"] },
  "model/vnd.pytha.pyox": { source: "iana" },
  "model/vnd.rosette.annotated-data-model": { source: "iana" },
  "model/vnd.sap.vds": { source: "iana", extensions: ["vds"] },
  "model/vnd.usdz+zip": { source: "iana", compressible: !1, extensions: ["usdz"] },
  "model/vnd.valve.source.compiled-map": { source: "iana", extensions: ["bsp"] },
  "model/vnd.vtu": { source: "iana", extensions: ["vtu"] },
  "model/vrml": { source: "iana", compressible: !1, extensions: ["wrl", "vrml"] },
  "model/x3d+binary": { source: "apache", compressible: !1, extensions: ["x3db", "x3dbz"] },
  "model/x3d+fastinfoset": { source: "iana", extensions: ["x3db"] },
  "model/x3d+vrml": { source: "apache", compressible: !1, extensions: ["x3dv", "x3dvz"] },
  "model/x3d+xml": { source: "iana", compressible: !0, extensions: ["x3d", "x3dz"] },
  "model/x3d-vrml": { source: "iana", extensions: ["x3dv"] },
  "multipart/alternative": { source: "iana", compressible: !1 },
  "multipart/appledouble": { source: "iana" },
  "multipart/byteranges": { source: "iana" },
  "multipart/digest": { source: "iana" },
  "multipart/encrypted": { source: "iana", compressible: !1 },
  "multipart/form-data": { source: "iana", compressible: !1 },
  "multipart/header-set": { source: "iana" },
  "multipart/mixed": { source: "iana" },
  "multipart/multilingual": { source: "iana" },
  "multipart/parallel": { source: "iana" },
  "multipart/related": { source: "iana", compressible: !1 },
  "multipart/report": { source: "iana" },
  "multipart/signed": { source: "iana", compressible: !1 },
  "multipart/vnd.bint.med-plus": { source: "iana" },
  "multipart/voice-message": { source: "iana" },
  "multipart/x-mixed-replace": { source: "iana" },
  "text/1d-interleaved-parityfec": { source: "iana" },
  "text/cache-manifest": { source: "iana", compressible: !0, extensions: ["appcache", "manifest"] },
  "text/calendar": { source: "iana", extensions: ["ics", "ifb"] },
  "text/calender": { compressible: !0 },
  "text/cmd": { compressible: !0 },
  "text/coffeescript": { extensions: ["coffee", "litcoffee"] },
  "text/cql": { source: "iana" },
  "text/cql-expression": { source: "iana" },
  "text/cql-identifier": { source: "iana" },
  "text/css": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["css"] },
  "text/csv": { source: "iana", compressible: !0, extensions: ["csv"] },
  "text/csv-schema": { source: "iana" },
  "text/directory": { source: "iana" },
  "text/dns": { source: "iana" },
  "text/ecmascript": { source: "iana" },
  "text/encaprtp": { source: "iana" },
  "text/enriched": { source: "iana" },
  "text/fhirpath": { source: "iana" },
  "text/flexfec": { source: "iana" },
  "text/fwdred": { source: "iana" },
  "text/gff3": { source: "iana" },
  "text/grammar-ref-list": { source: "iana" },
  "text/html": { source: "iana", compressible: !0, extensions: ["html", "htm", "shtml"] },
  "text/jade": { extensions: ["jade"] },
  "text/javascript": { source: "iana", compressible: !0 },
  "text/jcr-cnd": { source: "iana" },
  "text/jsx": { compressible: !0, extensions: ["jsx"] },
  "text/less": { compressible: !0, extensions: ["less"] },
  "text/markdown": { source: "iana", compressible: !0, extensions: ["markdown", "md"] },
  "text/mathml": { source: "nginx", extensions: ["mml"] },
  "text/mdx": { compressible: !0, extensions: ["mdx"] },
  "text/mizar": { source: "iana" },
  "text/n3": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["n3"] },
  "text/parameters": { source: "iana", charset: "UTF-8" },
  "text/parityfec": { source: "iana" },
  "text/plain": { source: "iana", compressible: !0, extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"] },
  "text/provenance-notation": { source: "iana", charset: "UTF-8" },
  "text/prs.fallenstein.rst": { source: "iana" },
  "text/prs.lines.tag": { source: "iana", extensions: ["dsc"] },
  "text/prs.prop.logic": { source: "iana" },
  "text/raptorfec": { source: "iana" },
  "text/red": { source: "iana" },
  "text/rfc822-headers": { source: "iana" },
  "text/richtext": { source: "iana", compressible: !0, extensions: ["rtx"] },
  "text/rtf": { source: "iana", compressible: !0, extensions: ["rtf"] },
  "text/rtp-enc-aescm128": { source: "iana" },
  "text/rtploopback": { source: "iana" },
  "text/rtx": { source: "iana" },
  "text/sgml": { source: "iana", extensions: ["sgml", "sgm"] },
  "text/shaclc": { source: "iana" },
  "text/shex": { source: "iana", extensions: ["shex"] },
  "text/slim": { extensions: ["slim", "slm"] },
  "text/spdx": { source: "iana", extensions: ["spdx"] },
  "text/strings": { source: "iana" },
  "text/stylus": { extensions: ["stylus", "styl"] },
  "text/t140": { source: "iana" },
  "text/tab-separated-values": { source: "iana", compressible: !0, extensions: ["tsv"] },
  "text/troff": { source: "iana", extensions: ["t", "tr", "roff", "man", "me", "ms"] },
  "text/turtle": { source: "iana", charset: "UTF-8", extensions: ["ttl"] },
  "text/ulpfec": { source: "iana" },
  "text/uri-list": { source: "iana", compressible: !0, extensions: ["uri", "uris", "urls"] },
  "text/vcard": { source: "iana", compressible: !0, extensions: ["vcard"] },
  "text/vnd.a": { source: "iana" },
  "text/vnd.abc": { source: "iana" },
  "text/vnd.ascii-art": { source: "iana" },
  "text/vnd.curl": { source: "iana", extensions: ["curl"] },
  "text/vnd.curl.dcurl": { source: "apache", extensions: ["dcurl"] },
  "text/vnd.curl.mcurl": { source: "apache", extensions: ["mcurl"] },
  "text/vnd.curl.scurl": { source: "apache", extensions: ["scurl"] },
  "text/vnd.debian.copyright": { source: "iana", charset: "UTF-8" },
  "text/vnd.dmclientscript": { source: "iana" },
  "text/vnd.dvb.subtitle": { source: "iana", extensions: ["sub"] },
  "text/vnd.esmertec.theme-descriptor": { source: "iana", charset: "UTF-8" },
  "text/vnd.familysearch.gedcom": { source: "iana", extensions: ["ged"] },
  "text/vnd.ficlab.flt": { source: "iana" },
  "text/vnd.fly": { source: "iana", extensions: ["fly"] },
  "text/vnd.fmi.flexstor": { source: "iana", extensions: ["flx"] },
  "text/vnd.gml": { source: "iana" },
  "text/vnd.graphviz": { source: "iana", extensions: ["gv"] },
  "text/vnd.hans": { source: "iana" },
  "text/vnd.hgl": { source: "iana" },
  "text/vnd.in3d.3dml": { source: "iana", extensions: ["3dml"] },
  "text/vnd.in3d.spot": { source: "iana", extensions: ["spot"] },
  "text/vnd.iptc.newsml": { source: "iana" },
  "text/vnd.iptc.nitf": { source: "iana" },
  "text/vnd.latex-z": { source: "iana" },
  "text/vnd.motorola.reflex": { source: "iana" },
  "text/vnd.ms-mediapackage": { source: "iana" },
  "text/vnd.net2phone.commcenter.command": { source: "iana" },
  "text/vnd.radisys.msml-basic-layout": { source: "iana" },
  "text/vnd.senx.warpscript": { source: "iana" },
  "text/vnd.si.uricatalogue": { source: "iana" },
  "text/vnd.sosi": { source: "iana" },
  "text/vnd.sun.j2me.app-descriptor": { source: "iana", charset: "UTF-8", extensions: ["jad"] },
  "text/vnd.trolltech.linguist": { source: "iana", charset: "UTF-8" },
  "text/vnd.wap.si": { source: "iana" },
  "text/vnd.wap.sl": { source: "iana" },
  "text/vnd.wap.wml": { source: "iana", extensions: ["wml"] },
  "text/vnd.wap.wmlscript": { source: "iana", extensions: ["wmls"] },
  "text/vtt": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["vtt"] },
  "text/x-asm": { source: "apache", extensions: ["s", "asm"] },
  "text/x-c": { source: "apache", extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"] },
  "text/x-component": { source: "nginx", extensions: ["htc"] },
  "text/x-fortran": { source: "apache", extensions: ["f", "for", "f77", "f90"] },
  "text/x-gwt-rpc": { compressible: !0 },
  "text/x-handlebars-template": { extensions: ["hbs"] },
  "text/x-java-source": { source: "apache", extensions: ["java"] },
  "text/x-jquery-tmpl": { compressible: !0 },
  "text/x-lua": { extensions: ["lua"] },
  "text/x-markdown": { compressible: !0, extensions: ["mkd"] },
  "text/x-nfo": { source: "apache", extensions: ["nfo"] },
  "text/x-opml": { source: "apache", extensions: ["opml"] },
  "text/x-org": { compressible: !0, extensions: ["org"] },
  "text/x-pascal": { source: "apache", extensions: ["p", "pas"] },
  "text/x-processing": { compressible: !0, extensions: ["pde"] },
  "text/x-sass": { extensions: ["sass"] },
  "text/x-scss": { extensions: ["scss"] },
  "text/x-setext": { source: "apache", extensions: ["etx"] },
  "text/x-sfv": { source: "apache", extensions: ["sfv"] },
  "text/x-suse-ymp": { compressible: !0, extensions: ["ymp"] },
  "text/x-uuencode": { source: "apache", extensions: ["uu"] },
  "text/x-vcalendar": { source: "apache", extensions: ["vcs"] },
  "text/x-vcard": { source: "apache", extensions: ["vcf"] },
  "text/xml": { source: "iana", compressible: !0, extensions: ["xml"] },
  "text/xml-external-parsed-entity": { source: "iana" },
  "text/yaml": { compressible: !0, extensions: ["yaml", "yml"] },
  "video/1d-interleaved-parityfec": { source: "iana" },
  "video/3gpp": { source: "iana", extensions: ["3gp", "3gpp"] },
  "video/3gpp-tt": { source: "iana" },
  "video/3gpp2": { source: "iana", extensions: ["3g2"] },
  "video/av1": { source: "iana" },
  "video/bmpeg": { source: "iana" },
  "video/bt656": { source: "iana" },
  "video/celb": { source: "iana" },
  "video/dv": { source: "iana" },
  "video/encaprtp": { source: "iana" },
  "video/ffv1": { source: "iana" },
  "video/flexfec": { source: "iana" },
  "video/h261": { source: "iana", extensions: ["h261"] },
  "video/h263": { source: "iana", extensions: ["h263"] },
  "video/h263-1998": { source: "iana" },
  "video/h263-2000": { source: "iana" },
  "video/h264": { source: "iana", extensions: ["h264"] },
  "video/h264-rcdo": { source: "iana" },
  "video/h264-svc": { source: "iana" },
  "video/h265": { source: "iana" },
  "video/iso.segment": { source: "iana", extensions: ["m4s"] },
  "video/jpeg": { source: "iana", extensions: ["jpgv"] },
  "video/jpeg2000": { source: "iana" },
  "video/jpm": { source: "apache", extensions: ["jpm", "jpgm"] },
  "video/jxsv": { source: "iana" },
  "video/mj2": { source: "iana", extensions: ["mj2", "mjp2"] },
  "video/mp1s": { source: "iana" },
  "video/mp2p": { source: "iana" },
  "video/mp2t": { source: "iana", extensions: ["ts"] },
  "video/mp4": { source: "iana", compressible: !1, extensions: ["mp4", "mp4v", "mpg4"] },
  "video/mp4v-es": { source: "iana" },
  "video/mpeg": { source: "iana", compressible: !1, extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"] },
  "video/mpeg4-generic": { source: "iana" },
  "video/mpv": { source: "iana" },
  "video/nv": { source: "iana" },
  "video/ogg": { source: "iana", compressible: !1, extensions: ["ogv"] },
  "video/parityfec": { source: "iana" },
  "video/pointer": { source: "iana" },
  "video/quicktime": { source: "iana", compressible: !1, extensions: ["qt", "mov"] },
  "video/raptorfec": { source: "iana" },
  "video/raw": { source: "iana" },
  "video/rtp-enc-aescm128": { source: "iana" },
  "video/rtploopback": { source: "iana" },
  "video/rtx": { source: "iana" },
  "video/scip": { source: "iana" },
  "video/smpte291": { source: "iana" },
  "video/smpte292m": { source: "iana" },
  "video/ulpfec": { source: "iana" },
  "video/vc1": { source: "iana" },
  "video/vc2": { source: "iana" },
  "video/vnd.cctv": { source: "iana" },
  "video/vnd.dece.hd": { source: "iana", extensions: ["uvh", "uvvh"] },
  "video/vnd.dece.mobile": { source: "iana", extensions: ["uvm", "uvvm"] },
  "video/vnd.dece.mp4": { source: "iana" },
  "video/vnd.dece.pd": { source: "iana", extensions: ["uvp", "uvvp"] },
  "video/vnd.dece.sd": { source: "iana", extensions: ["uvs", "uvvs"] },
  "video/vnd.dece.video": { source: "iana", extensions: ["uvv", "uvvv"] },
  "video/vnd.directv.mpeg": { source: "iana" },
  "video/vnd.directv.mpeg-tts": { source: "iana" },
  "video/vnd.dlna.mpeg-tts": { source: "iana" },
  "video/vnd.dvb.file": { source: "iana", extensions: ["dvb"] },
  "video/vnd.fvt": { source: "iana", extensions: ["fvt"] },
  "video/vnd.hns.video": { source: "iana" },
  "video/vnd.iptvforum.1dparityfec-1010": { source: "iana" },
  "video/vnd.iptvforum.1dparityfec-2005": { source: "iana" },
  "video/vnd.iptvforum.2dparityfec-1010": { source: "iana" },
  "video/vnd.iptvforum.2dparityfec-2005": { source: "iana" },
  "video/vnd.iptvforum.ttsavc": { source: "iana" },
  "video/vnd.iptvforum.ttsmpeg2": { source: "iana" },
  "video/vnd.motorola.video": { source: "iana" },
  "video/vnd.motorola.videop": { source: "iana" },
  "video/vnd.mpegurl": { source: "iana", extensions: ["mxu", "m4u"] },
  "video/vnd.ms-playready.media.pyv": { source: "iana", extensions: ["pyv"] },
  "video/vnd.nokia.interleaved-multimedia": { source: "iana" },
  "video/vnd.nokia.mp4vr": { source: "iana" },
  "video/vnd.nokia.videovoip": { source: "iana" },
  "video/vnd.objectvideo": { source: "iana" },
  "video/vnd.radgamettools.bink": { source: "iana" },
  "video/vnd.radgamettools.smacker": { source: "iana" },
  "video/vnd.sealed.mpeg1": { source: "iana" },
  "video/vnd.sealed.mpeg4": { source: "iana" },
  "video/vnd.sealed.swf": { source: "iana" },
  "video/vnd.sealedmedia.softseal.mov": { source: "iana" },
  "video/vnd.uvvu.mp4": { source: "iana", extensions: ["uvu", "uvvu"] },
  "video/vnd.vivo": { source: "iana", extensions: ["viv"] },
  "video/vnd.youtube.yt": { source: "iana" },
  "video/vp8": { source: "iana" },
  "video/vp9": { source: "iana" },
  "video/webm": { source: "apache", compressible: !1, extensions: ["webm"] },
  "video/x-f4v": { source: "apache", extensions: ["f4v"] },
  "video/x-fli": { source: "apache", extensions: ["fli"] },
  "video/x-flv": { source: "apache", compressible: !1, extensions: ["flv"] },
  "video/x-m4v": { source: "apache", extensions: ["m4v"] },
  "video/x-matroska": { source: "apache", compressible: !1, extensions: ["mkv", "mk3d", "mks"] },
  "video/x-mng": { source: "apache", extensions: ["mng"] },
  "video/x-ms-asf": { source: "apache", extensions: ["asf", "asx"] },
  "video/x-ms-vob": { source: "apache", extensions: ["vob"] },
  "video/x-ms-wm": { source: "apache", extensions: ["wm"] },
  "video/x-ms-wmv": { source: "apache", compressible: !1, extensions: ["wmv"] },
  "video/x-ms-wmx": { source: "apache", extensions: ["wmx"] },
  "video/x-ms-wvx": { source: "apache", extensions: ["wvx"] },
  "video/x-msvideo": { source: "apache", extensions: ["avi"] },
  "video/x-sgi-movie": { source: "apache", extensions: ["movie"] },
  "video/x-smv": { source: "apache", extensions: ["smv"] },
  "x-conference/x-cooltalk": { source: "apache", extensions: ["ice"] },
  "x-shader/x-fragment": { compressible: !0 },
  "x-shader/x-vertex": { compressible: !0 }
};
/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2022 Douglas Christopher Wilson
 * MIT Licensed
 */
var vi, Wa;
function Lo() {
  return Wa || (Wa = 1, vi = Co), vi;
}
/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
var Ga;
function Ao() {
  return Ga || (Ga = 1, function(o) {
    var t = Lo(), n = z.extname, c = /^\s*([^;\s]*)(?:;|\s|$)/, p = /^text\//i;
    o.charset = a, o.charsets = { lookup: a }, o.contentType = e, o.extension = i, o.extensions = /* @__PURE__ */ Object.create(null), o.lookup = s, o.types = /* @__PURE__ */ Object.create(null), r(o.extensions, o.types);
    function a(l) {
      if (!l || typeof l != "string")
        return !1;
      var m = c.exec(l), f = m && t[m[1].toLowerCase()];
      return f && f.charset ? f.charset : m && p.test(m[1]) ? "UTF-8" : !1;
    }
    function e(l) {
      if (!l || typeof l != "string")
        return !1;
      var m = l.indexOf("/") === -1 ? o.lookup(l) : l;
      if (!m)
        return !1;
      if (m.indexOf("charset") === -1) {
        var f = o.charset(m);
        f && (m += "; charset=" + f.toLowerCase());
      }
      return m;
    }
    function i(l) {
      if (!l || typeof l != "string")
        return !1;
      var m = c.exec(l), f = m && o.extensions[m[1].toLowerCase()];
      return !f || !f.length ? !1 : f[0];
    }
    function s(l) {
      if (!l || typeof l != "string")
        return !1;
      var m = n("x." + l).toLowerCase().substr(1);
      return m && o.types[m] || !1;
    }
    function r(l, m) {
      var f = ["nginx", "apache", void 0, "iana"];
      Object.keys(t).forEach(function(E) {
        var _ = t[E], y = _.extensions;
        if (!(!y || !y.length)) {
          l[E] = y;
          for (var g = 0; g < y.length; g++) {
            var b = y[g];
            if (m[b]) {
              var j = f.indexOf(t[m[b]].source), S = f.indexOf(_.source);
              if (m[b] !== "application/octet-stream" && (j > S || j === S && m[b].substr(0, 12) === "application/"))
                continue;
            }
            m[b] = E;
          }
        }
      });
    }
  }(hi)), hi;
}
var Do = Ao();
const No = /* @__PURE__ */ Ge(Do);
function Fo(o) {
  D.handle("util:fillPathToConfig", async (t, n) => {
    try {
      const { mcpServers: c } = JSON.parse(n), p = Object.keys(c).reduce((a, e) => {
        const { args: i } = c[e];
        if (!i)
          return a;
        const s = i.find((f) => f.endsWith("js") || f.endsWith("ts"));
        if (!s || U.existsSync(s))
          return a;
        const l = i.reduce((f, w, E) => s === w ? E : f, -1);
        U.existsSync(P.join(Te, s)) && (i[l] = P.join(Te, s));
        const m = P.parse(s).base;
        return U.existsSync(P.join(Te, m)) && (i[l] = P.join(Te, m)), a[e] = {
          ...c[e],
          args: i
        }, a;
      }, c);
      return JSON.stringify({ mcpServers: p });
    } catch {
      return n;
    }
  }), D.handle("util:download", async (t, { url: n }) => {
    let c = Io(n);
    await fetch(n, { method: "HEAD" }).then((a) => {
      const e = a.headers.get("content-disposition");
      if (e) {
        const i = e.match(/filename="([^"]+)"/);
        i && (c = i[1]);
      }
    }).catch(() => {
      console.error("Failed to get filename from url");
    }), c = c || "file";
    const p = await Jn.showSaveDialog({
      properties: ["createDirectory", "showOverwriteConfirmation"],
      defaultPath: c
    });
    if (!p.canceled)
      try {
        await fs(o, n, { directory: P.dirname(p.filePath), filename: P.basename(p.filePath) });
      } catch (a) {
        a instanceof xs ? console.info("item.cancel() was called") : console.error(a);
      }
  }), D.handle("util:copyimage", async (t, n) => {
    const c = async (e) => {
      const i = await fetch(e);
      if (!i.ok)
        throw new Error(`HTTP error: ${i.status}`);
      const s = await i.arrayBuffer(), r = ii.createFromBuffer(Buffer.from(s));
      if (r.isEmpty())
        throw new Error("Failed to create image from buffer");
      return r;
    }, p = "local-file:///";
    let a = null;
    if (typeof n == "string" ? a = n.startsWith(p) ? ii.createFromPath(n.substring(p.length)) : await c(n) : a = ii.createFromBuffer(Buffer.from(n)), a.isEmpty())
      throw new Error("Failed to create image from buffer");
    Xn.writeImage(a);
  }), D.handle("util:getModelSettings", async (t) => U.existsSync(P.join(Oe, "model_settings.json")) ? U.readJson(P.join(Oe, "model_settings.json")) : null), D.handle("util:setModelSettings", async (t, n) => U.writeJson(P.join(Oe, "model_settings.json"), n, { spaces: 2 })), D.handle("util:refreshConfig", async () => Je()), D.handle("util:getInstallHostDependenciesLog", async () => $s()), D.handle("util:getClientInfo", async () => ({
    version: M.getVersion(),
    client_id: Zi
  })), D.handle("util:checkCommandExist", async (t, n) => !!Oo.sync(n, { nothrow: !0 })), D.handle("util:readLocalFile", async (t, n) => {
    try {
      return {
        data: await U.readFile(n),
        name: P.basename(n),
        mimeType: No.lookup(n) || "application/octet-stream"
      };
    } catch (c) {
      throw console.error("Failed to read local file:", n, c), c;
    }
  });
}
function Io(o) {
  try {
    return new URL(o).pathname.split("/").pop();
  } catch {
    return null;
  }
}
function Mo(o) {
  D.handle("llm:openaiModelList", async (t, n) => {
    try {
      return {
        results: (await new ha({ apiKey: n }).models.list()).data.sort((a, e) => e.created - a.created).map((a) => a.id),
        error: null
      };
    } catch (c) {
      return { results: [], error: c.message };
    }
  }), D.handle("llm:azureOpenaiModelList", async (t, n, c, p, a) => {
    try {
      return {
        results: (await new ws({ apiKey: n, endpoint: c, deployment: p, apiVersion: a }).models.list()).data.sort((s, r) => r.created - s.created).map((s) => s.id),
        error: null
      };
    } catch (e) {
      return { results: [], error: e.message };
    }
  }), D.handle("llm:anthropicModelList", async (t, n, c) => {
    try {
      return {
        results: (await new bs({ apiKey: n, baseURL: c }).models.list()).data.sort((e, i) => {
          const s = new Date(e.created_at);
          return new Date(i.created_at).getTime() - s.getTime();
        }).map((e) => e.id),
        error: null
      };
    } catch (p) {
      return { results: [], error: p.message };
    }
  }), D.handle("llm:ollamaModelList", async (t, n) => {
    try {
      return {
        results: (await new ys({ host: n }).list()).models.sort((a, e) => {
          const i = new Date(a.modified_at);
          return new Date(e.modified_at).getTime() - i.getTime();
        }).map((a) => a.name),
        error: null
      };
    } catch (c) {
      return { results: [], error: c.message };
    }
  }), D.handle("llm:openaiCompatibleModelList", async (t, n, c) => {
    try {
      return {
        results: (await new ha({ apiKey: n, baseURL: c }).models.list()).data.sort((e, i) => i.created - e.created).map((e) => e.id),
        error: null
      };
    } catch (p) {
      return { results: [], error: p.message };
    }
  }), D.handle("llm:googleGenaiModelList", async (t, n) => {
    try {
      const c = `https://generativelanguage.googleapis.com/v1beta/models?key=${n}`;
      return { results: (await (await fetch(c)).json()).models.map((e) => e.name), error: null };
    } catch (c) {
      return { results: [], error: c.message };
    }
  }), D.handle("llm:mistralaiModelList", async (t, n) => {
    var c;
    try {
      return {
        results: (c = (await new _s({ apiKey: n }).models.list()).data) == null ? void 0 : c.sort((e, i) => (i.created || 0) - (e.created || 0)).map((e) => e.id),
        error: null
      };
    } catch (p) {
      return { results: [], error: p.message };
    }
  }), D.handle("llm:bedrockModelList", async (t, n, c, p, a) => {
    try {
      let e = "";
      a.startsWith("us-") ? e = "us." : a.startsWith("eu-") ? e = "eu." : a.startsWith("ap-") ? e = "apac." : a.includes("-") && (e = a.split("-")[0] + ".");
      const i = new ks({
        region: a,
        credentials: {
          accessKeyId: n,
          secretAccessKey: c,
          sessionToken: p
        }
      }), s = new Es({}), l = (await i.send(s)).modelSummaries;
      return { results: (l == null ? void 0 : l.map((m) => `${e}${m.modelId}`)) ?? [], error: null };
    } catch (e) {
      return { results: [], error: e.message };
    }
  });
}
const Ro = Gi.buildFromTemplate([
  { role: "copy" },
  { role: "selectAll" }
]), qo = Gi.buildFromTemplate([
  { role: "copy" },
  { role: "paste" },
  { role: "cut" },
  { role: "selectAll" }
]);
function Uo(o) {
  D.handle("show-selection-context-menu", () => {
    Ro.popup();
  }), D.handle("show-input-context-menu", () => {
    qo.popup();
  });
}
const zo = `${ge}/signin`, $o = `${ge}/signup`;
function Bo(o) {
  D.handle("oap:login", async (t, n) => {
    const c = `${n ? $o : zo}?client=dive&name=${Be.hostname()}&system=${process.platform}`;
    Hi.openExternal(c);
  }), D.handle("oap:logout", async () => {
    Q.logout();
  }), D.handle("oap:getToken", async () => await qe()), D.handle("oap:searchMCPServer", async (t, n) => await Q.searchMCPServer(n)), D.handle("oap:modelDescription", async (t, n) => await Q.modelDescription(n)), D.handle("oap:applyMCPServer", async (t, n) => await Q.applyMCPServer(n)), D.handle("oap:getMCPTags", async () => await Q.getMCPTags()), D.handle("oap:getMCPServers", async () => await Q.getMCPServers()), D.handle("oap:getMe", async () => await Q.getMe()), D.handle("oap:getUsage", async () => await Q.getUsage()), D.handle("oap:limiterCheck", async (t, n) => await Q.limiterCheck(n));
}
function Wo(o) {
  D.handle("lipc:elicitation", async (t, n, c) => {
  });
}
function Go(o) {
  lo(), vo(o), Fo(o), Mo(), Uo(), Bo(), Wo();
}
Ue.registerSchemesAsPrivileged([
  {
    scheme: "local-file",
    privileges: {
      secure: !0,
      supportFetchAPI: !0,
      bypassCSP: !0,
      stream: !0
    }
  }
]);
Ue.registerSchemesAsPrivileged([
  {
    scheme: "img",
    privileges: {
      secure: !0,
      supportFetchAPI: !0,
      bypassCSP: !0,
      stream: !0
    }
  }
]);
function Ho() {
  Ue.handle("local-file", (o) => {
    const t = o.url.replace("local-file:///", process.platform === "win32" ? "file:///" : "file://");
    return xa.fetch(t);
  }), Ue.handle("img", (o) => {
    const t = o.url.substring(6), n = P.join(process.env.VITE_PUBLIC, "image", t);
    return xa.fetch(`file://${n}`);
  });
}
var gi, Ha;
function Vo() {
  if (Ha) return gi;
  Ha = 1;
  const o = ue, t = z;
  gi = {
    findAndReadPackageJson: n,
    tryReadJsonAt: c
  };
  function n() {
    return c(e()) || c(a()) || c(process.resourcesPath, "app.asar") || c(process.resourcesPath, "app") || c(process.cwd()) || { name: void 0, version: void 0 };
  }
  function c(...i) {
    if (i[0])
      try {
        const s = t.join(...i), r = p("package.json", s);
        if (!r)
          return;
        const l = JSON.parse(o.readFileSync(r, "utf8")), m = (l == null ? void 0 : l.productName) || (l == null ? void 0 : l.name);
        return !m || m.toLowerCase() === "electron" ? void 0 : m ? { name: m, version: l == null ? void 0 : l.version } : void 0;
      } catch {
        return;
      }
  }
  function p(i, s) {
    let r = s;
    for (; ; ) {
      const l = t.parse(r), m = l.root, f = l.dir;
      if (o.existsSync(t.join(r, i)))
        return t.resolve(t.join(r, i));
      if (r === m)
        return null;
      r = f;
    }
  }
  function a() {
    const i = process.argv.filter((r) => r.indexOf("--user-data-dir=") === 0);
    return i.length === 0 || typeof i[0] != "string" ? null : i[0].replace("--user-data-dir=", "");
  }
  function e() {
    var i;
    try {
      return (i = require.main) == null ? void 0 : i.filename;
    } catch {
      return;
    }
  }
  return gi;
}
var bi, Va;
function Jo() {
  if (Va) return bi;
  Va = 1;
  const o = us, t = Ae, n = z, c = Vo();
  class p {
    constructor() {
      I(this, "appName");
      I(this, "appPackageJson");
      I(this, "platform", process.platform);
    }
    getAppLogPath(e = this.getAppName()) {
      return this.platform === "darwin" ? n.join(this.getSystemPathHome(), "Library/Logs", e) : n.join(this.getAppUserDataPath(e), "logs");
    }
    getAppName() {
      var i;
      const e = this.appName || ((i = this.getAppPackageJson()) == null ? void 0 : i.name);
      if (!e)
        throw new Error(
          "electron-log can't determine the app name. It tried these methods:\n1. Use `electron.app.name`\n2. Use productName or name from the nearest package.json`\nYou can also set it through log.transports.file.setAppName()"
        );
      return e;
    }
    /**
     * @private
     * @returns {undefined}
     */
    getAppPackageJson() {
      return typeof this.appPackageJson != "object" && (this.appPackageJson = c.findAndReadPackageJson()), this.appPackageJson;
    }
    getAppUserDataPath(e = this.getAppName()) {
      return e ? n.join(this.getSystemPathAppData(), e) : void 0;
    }
    getAppVersion() {
      var e;
      return (e = this.getAppPackageJson()) == null ? void 0 : e.version;
    }
    getElectronLogPath() {
      return this.getAppLogPath();
    }
    getMacOsVersion() {
      const e = Number(t.release().split(".")[0]);
      return e <= 19 ? `10.${e - 4}` : e - 9;
    }
    /**
     * @protected
     * @returns {string}
     */
    getOsVersion() {
      let e = t.type().replace("_", " "), i = t.release();
      return e === "Darwin" && (e = "macOS", i = this.getMacOsVersion()), `${e} ${i}`;
    }
    /**
     * @return {PathVariables}
     */
    getPathVariables() {
      const e = this.getAppName(), i = this.getAppVersion(), s = this;
      return {
        appData: this.getSystemPathAppData(),
        appName: e,
        appVersion: i,
        get electronDefaultDir() {
          return s.getElectronLogPath();
        },
        home: this.getSystemPathHome(),
        libraryDefaultDir: this.getAppLogPath(e),
        libraryTemplate: this.getAppLogPath("{appName}"),
        temp: this.getSystemPathTemp(),
        userData: this.getAppUserDataPath(e)
      };
    }
    getSystemPathAppData() {
      const e = this.getSystemPathHome();
      switch (this.platform) {
        case "darwin":
          return n.join(e, "Library/Application Support");
        case "win32":
          return process.env.APPDATA || n.join(e, "AppData/Roaming");
        default:
          return process.env.XDG_CONFIG_HOME || n.join(e, ".config");
      }
    }
    getSystemPathHome() {
      var e;
      return ((e = t.homedir) == null ? void 0 : e.call(t)) || process.env.HOME;
    }
    getSystemPathTemp() {
      return t.tmpdir();
    }
    getVersions() {
      return {
        app: `${this.getAppName()} ${this.getAppVersion()}`,
        electron: void 0,
        os: this.getOsVersion()
      };
    }
    isDev() {
      return process.env.NODE_ENV === "development" || process.env.ELECTRON_IS_DEV === "1";
    }
    isElectron() {
      return !!process.versions.electron;
    }
    onAppEvent(e, i) {
    }
    onAppReady(e) {
      e();
    }
    onEveryWebContentsEvent(e, i) {
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(e, i) {
    }
    onIpcInvoke(e, i) {
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(e, i = console.error) {
      const r = { darwin: "open", win32: "start", linux: "xdg-open" }[process.platform] || "xdg-open";
      o.exec(`${r} ${e}`, {}, (l) => {
        l && i(l);
      });
    }
    setAppName(e) {
      this.appName = e;
    }
    setPlatform(e) {
      this.platform = e;
    }
    setPreloadFileForSessions({
      filePath: e,
      // eslint-disable-line no-unused-vars
      includeFutureSession: i = !0,
      // eslint-disable-line no-unused-vars
      getSessions: s = () => []
      // eslint-disable-line no-unused-vars
    }) {
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(e, i) {
    }
    showErrorBox(e, i) {
    }
  }
  return bi = p, bi;
}
var yi, Ja;
function Xo() {
  if (Ja) return yi;
  Ja = 1;
  const o = z, t = Jo();
  class n extends t {
    /**
     * @param {object} options
     * @param {typeof Electron} [options.electron]
     */
    constructor({ electron: a } = {}) {
      super();
      /**
       * @type {typeof Electron}
       */
      I(this, "electron");
      this.electron = a;
    }
    getAppName() {
      var e, i;
      let a;
      try {
        a = this.appName || ((e = this.electron.app) == null ? void 0 : e.name) || ((i = this.electron.app) == null ? void 0 : i.getName());
      } catch {
      }
      return a || super.getAppName();
    }
    getAppUserDataPath(a) {
      return this.getPath("userData") || super.getAppUserDataPath(a);
    }
    getAppVersion() {
      var e;
      let a;
      try {
        a = (e = this.electron.app) == null ? void 0 : e.getVersion();
      } catch {
      }
      return a || super.getAppVersion();
    }
    getElectronLogPath() {
      return this.getPath("logs") || super.getElectronLogPath();
    }
    /**
     * @private
     * @param {any} name
     * @returns {string|undefined}
     */
    getPath(a) {
      var e;
      try {
        return (e = this.electron.app) == null ? void 0 : e.getPath(a);
      } catch {
        return;
      }
    }
    getVersions() {
      return {
        app: `${this.getAppName()} ${this.getAppVersion()}`,
        electron: `Electron ${process.versions.electron}`,
        os: this.getOsVersion()
      };
    }
    getSystemPathAppData() {
      return this.getPath("appData") || super.getSystemPathAppData();
    }
    isDev() {
      var a;
      return ((a = this.electron.app) == null ? void 0 : a.isPackaged) !== void 0 ? !this.electron.app.isPackaged : typeof process.execPath == "string" ? o.basename(process.execPath).toLowerCase().startsWith("electron") : super.isDev();
    }
    onAppEvent(a, e) {
      var i;
      return (i = this.electron.app) == null || i.on(a, e), () => {
        var s;
        (s = this.electron.app) == null || s.off(a, e);
      };
    }
    onAppReady(a) {
      var e, i, s;
      (e = this.electron.app) != null && e.isReady() ? a() : (i = this.electron.app) != null && i.once ? (s = this.electron.app) == null || s.once("ready", a) : a();
    }
    onEveryWebContentsEvent(a, e) {
      var s, r, l;
      return (r = (s = this.electron.webContents) == null ? void 0 : s.getAllWebContents()) == null || r.forEach((m) => {
        m.on(a, e);
      }), (l = this.electron.app) == null || l.on("web-contents-created", i), () => {
        var m, f;
        (m = this.electron.webContents) == null || m.getAllWebContents().forEach((w) => {
          w.off(a, e);
        }), (f = this.electron.app) == null || f.off("web-contents-created", i);
      };
      function i(m, f) {
        f.on(a, e);
      }
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(a, e) {
      var i;
      (i = this.electron.ipcMain) == null || i.on(a, e);
    }
    onIpcInvoke(a, e) {
      var i, s;
      (s = (i = this.electron.ipcMain) == null ? void 0 : i.handle) == null || s.call(i, a, e);
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(a, e = console.error) {
      var i;
      (i = this.electron.shell) == null || i.openExternal(a).catch(e);
    }
    setPreloadFileForSessions({
      filePath: a,
      includeFutureSession: e = !0,
      getSessions: i = () => {
        var s;
        return [(s = this.electron.session) == null ? void 0 : s.defaultSession];
      }
    }) {
      for (const r of i().filter(Boolean))
        s(r);
      e && this.onAppEvent("session-created", (r) => {
        s(r);
      });
      function s(r) {
        typeof r.registerPreloadScript == "function" ? r.registerPreloadScript({
          filePath: a,
          id: "electron-log-preload",
          type: "frame"
        }) : r.setPreloads([...r.getPreloads(), a]);
      }
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(a, e) {
      var i, s;
      (s = (i = this.electron.BrowserWindow) == null ? void 0 : i.getAllWindows()) == null || s.forEach((r) => {
        var l, m;
        ((l = r.webContents) == null ? void 0 : l.isDestroyed()) === !1 && ((m = r.webContents) == null ? void 0 : m.isCrashed()) === !1 && r.webContents.send(a, e);
      });
    }
    showErrorBox(a, e) {
      var i;
      (i = this.electron.dialog) == null || i.showErrorBox(a, e);
    }
  }
  return yi = n, yi;
}
var wi = { exports: {} }, Xa;
function Yo() {
  return Xa || (Xa = 1, function(o) {
    let t = {};
    try {
      t = require("electron");
    } catch {
    }
    t.ipcRenderer && n(t), o.exports = n;
    function n({ contextBridge: c, ipcRenderer: p }) {
      if (!p)
        return;
      p.on("__ELECTRON_LOG_IPC__", (e, i) => {
        window.postMessage({ cmd: "message", ...i });
      }), p.invoke("__ELECTRON_LOG__", { cmd: "getOptions" }).catch((e) => console.error(new Error(
        `electron-log isn't initialized in the main process. Please call log.initialize() before. ${e.message}`
      )));
      const a = {
        sendToMain(e) {
          try {
            p.send("__ELECTRON_LOG__", e);
          } catch (i) {
            console.error("electronLog.sendToMain ", i, "data:", e), p.send("__ELECTRON_LOG__", {
              cmd: "errorHandler",
              error: { message: i == null ? void 0 : i.message, stack: i == null ? void 0 : i.stack },
              errorName: "sendToMain"
            });
          }
        },
        log(...e) {
          a.sendToMain({ data: e, level: "info" });
        }
      };
      for (const e of ["error", "warn", "info", "verbose", "debug", "silly"])
        a[e] = (...i) => a.sendToMain({
          data: i,
          level: e
        });
      if (c && process.contextIsolated)
        try {
          c.exposeInMainWorld("__electronLog", a);
        } catch {
        }
      typeof window == "object" ? window.__electronLog = a : __electronLog = a;
    }
  }(wi)), wi.exports;
}
var _i, Ya;
function Qo() {
  if (Ya) return _i;
  Ya = 1;
  const o = ue, t = Ae, n = z, c = Yo();
  let p = !1, a = !1;
  _i = {
    initialize({
      externalApi: s,
      getSessions: r,
      includeFutureSession: l,
      logger: m,
      preload: f = !0,
      spyRendererConsole: w = !1
    }) {
      s.onAppReady(() => {
        try {
          f && e({
            externalApi: s,
            getSessions: r,
            includeFutureSession: l,
            logger: m,
            preloadOption: f
          }), w && i({ externalApi: s, logger: m });
        } catch (E) {
          m.warn(E);
        }
      });
    }
  };
  function e({
    externalApi: s,
    getSessions: r,
    includeFutureSession: l,
    logger: m,
    preloadOption: f
  }) {
    let w = typeof f == "string" ? f : void 0;
    if (p) {
      m.warn(new Error("log.initialize({ preload }) already called").stack);
      return;
    }
    p = !0;
    try {
      w = n.resolve(
        __dirname,
        "../renderer/electron-log-preload.js"
      );
    } catch {
    }
    if (!w || !o.existsSync(w)) {
      w = n.join(
        s.getAppUserDataPath() || t.tmpdir(),
        "electron-log-preload.js"
      );
      const E = `
      try {
        (${c.toString()})(require('electron'));
      } catch(e) {
        console.error(e);
      }
    `;
      o.writeFileSync(w, E, "utf8");
    }
    s.setPreloadFileForSessions({
      filePath: w,
      includeFutureSession: l,
      getSessions: r
    });
  }
  function i({ externalApi: s, logger: r }) {
    if (a) {
      r.warn(
        new Error("log.initialize({ spyRendererConsole }) already called").stack
      );
      return;
    }
    a = !0;
    const l = ["debug", "info", "warn", "error"];
    s.onEveryWebContentsEvent(
      "console-message",
      (m, f, w) => {
        r.processMessage({
          data: [w],
          level: l[f],
          variables: { processType: "renderer" }
        });
      }
    );
  }
  return _i;
}
var ki, Qa;
function Ko() {
  if (Qa) return ki;
  Qa = 1, ki = o;
  function o(t) {
    return Object.defineProperties(n, {
      defaultLabel: { value: "", writable: !0 },
      labelPadding: { value: !0, writable: !0 },
      maxLabelLength: { value: 0, writable: !0 },
      labelLength: {
        get() {
          switch (typeof n.labelPadding) {
            case "boolean":
              return n.labelPadding ? n.maxLabelLength : 0;
            case "number":
              return n.labelPadding;
            default:
              return 0;
          }
        }
      }
    });
    function n(c) {
      n.maxLabelLength = Math.max(n.maxLabelLength, c.length);
      const p = {};
      for (const a of t.levels)
        p[a] = (...e) => t.logData(e, { level: a, scope: c });
      return p.log = p.info, p;
    }
  }
  return ki;
}
var Ei, Ka;
function Zo() {
  if (Ka) return Ei;
  Ka = 1;
  class o {
    constructor({ processMessage: n }) {
      this.processMessage = n, this.buffer = [], this.enabled = !1, this.begin = this.begin.bind(this), this.commit = this.commit.bind(this), this.reject = this.reject.bind(this);
    }
    addMessage(n) {
      this.buffer.push(n);
    }
    begin() {
      this.enabled = [];
    }
    commit() {
      this.enabled = !1, this.buffer.forEach((n) => this.processMessage(n)), this.buffer = [];
    }
    reject() {
      this.enabled = !1, this.buffer = [];
    }
  }
  return Ei = o, Ei;
}
var Si, Za;
function et() {
  if (Za) return Si;
  Za = 1;
  const o = Ko(), t = Zo(), c = class c {
    constructor({
      allowUnknownLevel: a = !1,
      dependencies: e = {},
      errorHandler: i,
      eventLogger: s,
      initializeFn: r,
      isDev: l = !1,
      levels: m = ["error", "warn", "info", "verbose", "debug", "silly"],
      logId: f,
      transportFactories: w = {},
      variables: E
    } = {}) {
      I(this, "dependencies", {});
      I(this, "errorHandler", null);
      I(this, "eventLogger", null);
      I(this, "functions", {});
      I(this, "hooks", []);
      I(this, "isDev", !1);
      I(this, "levels", null);
      I(this, "logId", null);
      I(this, "scope", null);
      I(this, "transports", {});
      I(this, "variables", {});
      this.addLevel = this.addLevel.bind(this), this.create = this.create.bind(this), this.initialize = this.initialize.bind(this), this.logData = this.logData.bind(this), this.processMessage = this.processMessage.bind(this), this.allowUnknownLevel = a, this.buffering = new t(this), this.dependencies = e, this.initializeFn = r, this.isDev = l, this.levels = m, this.logId = f, this.scope = o(this), this.transportFactories = w, this.variables = E || {};
      for (const _ of this.levels)
        this.addLevel(_, !1);
      this.log = this.info, this.functions.log = this.log, this.errorHandler = i, i == null || i.setOptions({ ...e, logFn: this.error }), this.eventLogger = s, s == null || s.setOptions({ ...e, logger: this });
      for (const [_, y] of Object.entries(w))
        this.transports[_] = y(this, e);
      c.instances[f] = this;
    }
    static getInstance({ logId: a }) {
      return this.instances[a] || this.instances.default;
    }
    addLevel(a, e = this.levels.length) {
      e !== !1 && this.levels.splice(e, 0, a), this[a] = (...i) => this.logData(i, { level: a }), this.functions[a] = this[a];
    }
    catchErrors(a) {
      return this.processMessage(
        {
          data: ["log.catchErrors is deprecated. Use log.errorHandler instead"],
          level: "warn"
        },
        { transports: ["console"] }
      ), this.errorHandler.startCatching(a);
    }
    create(a) {
      return typeof a == "string" && (a = { logId: a }), new c({
        dependencies: this.dependencies,
        errorHandler: this.errorHandler,
        initializeFn: this.initializeFn,
        isDev: this.isDev,
        transportFactories: this.transportFactories,
        variables: { ...this.variables },
        ...a
      });
    }
    compareLevels(a, e, i = this.levels) {
      const s = i.indexOf(a), r = i.indexOf(e);
      return r === -1 || s === -1 ? !0 : r <= s;
    }
    initialize(a = {}) {
      this.initializeFn({ logger: this, ...this.dependencies, ...a });
    }
    logData(a, e = {}) {
      this.buffering.enabled ? this.buffering.addMessage({ data: a, date: /* @__PURE__ */ new Date(), ...e }) : this.processMessage({ data: a, ...e });
    }
    processMessage(a, { transports: e = this.transports } = {}) {
      if (a.cmd === "errorHandler") {
        this.errorHandler.handle(a.error, {
          errorName: a.errorName,
          processType: "renderer",
          showDialog: !!a.showDialog
        });
        return;
      }
      let i = a.level;
      this.allowUnknownLevel || (i = this.levels.includes(a.level) ? a.level : "info");
      const s = {
        date: /* @__PURE__ */ new Date(),
        logId: this.logId,
        ...a,
        level: i,
        variables: {
          ...this.variables,
          ...a.variables
        }
      };
      for (const [r, l] of this.transportEntries(e))
        if (!(typeof l != "function" || l.level === !1) && this.compareLevels(l.level, a.level))
          try {
            const m = this.hooks.reduce((f, w) => f && w(f, l, r), s);
            m && l({ ...m, data: [...m.data] });
          } catch (m) {
            this.processInternalErrorFn(m);
          }
    }
    processInternalErrorFn(a) {
    }
    transportEntries(a = this.transports) {
      return (Array.isArray(a) ? a : Object.entries(a)).map((i) => {
        switch (typeof i) {
          case "string":
            return this.transports[i] ? [i, this.transports[i]] : null;
          case "function":
            return [i.name, i];
          default:
            return Array.isArray(i) ? i : null;
        }
      }).filter(Boolean);
    }
  };
  I(c, "instances", {});
  let n = c;
  return Si = n, Si;
}
var ji, en;
function it() {
  if (en) return ji;
  en = 1;
  class o {
    constructor({
      externalApi: c,
      logFn: p = void 0,
      onError: a = void 0,
      showDialog: e = void 0
    } = {}) {
      I(this, "externalApi");
      I(this, "isActive", !1);
      I(this, "logFn");
      I(this, "onError");
      I(this, "showDialog", !0);
      this.createIssue = this.createIssue.bind(this), this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.setOptions({ externalApi: c, logFn: p, onError: a, showDialog: e }), this.startCatching = this.startCatching.bind(this), this.stopCatching = this.stopCatching.bind(this);
    }
    handle(c, {
      logFn: p = this.logFn,
      onError: a = this.onError,
      processType: e = "browser",
      showDialog: i = this.showDialog,
      errorName: s = ""
    } = {}) {
      var r;
      c = t(c);
      try {
        if (typeof a == "function") {
          const l = ((r = this.externalApi) == null ? void 0 : r.getVersions()) || {}, m = this.createIssue;
          if (a({
            createIssue: m,
            error: c,
            errorName: s,
            processType: e,
            versions: l
          }) === !1)
            return;
        }
        s ? p(s, c) : p(c), i && !s.includes("rejection") && this.externalApi && this.externalApi.showErrorBox(
          `A JavaScript error occurred in the ${e} process`,
          c.stack
        );
      } catch {
        console.error(c);
      }
    }
    setOptions({ externalApi: c, logFn: p, onError: a, showDialog: e }) {
      typeof c == "object" && (this.externalApi = c), typeof p == "function" && (this.logFn = p), typeof a == "function" && (this.onError = a), typeof e == "boolean" && (this.showDialog = e);
    }
    startCatching({ onError: c, showDialog: p } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: c, showDialog: p }), process.on("uncaughtException", this.handleError), process.on("unhandledRejection", this.handleRejection));
    }
    stopCatching() {
      this.isActive = !1, process.removeListener("uncaughtException", this.handleError), process.removeListener("unhandledRejection", this.handleRejection);
    }
    createIssue(c, p) {
      var a;
      (a = this.externalApi) == null || a.openUrl(
        `${c}?${new URLSearchParams(p).toString()}`
      );
    }
    handleError(c) {
      this.handle(c, { errorName: "Unhandled" });
    }
    handleRejection(c) {
      const p = c instanceof Error ? c : new Error(JSON.stringify(c));
      this.handle(p, { errorName: "Unhandled rejection" });
    }
  }
  function t(n) {
    if (n instanceof Error)
      return n;
    if (n && typeof n == "object") {
      if (n.message)
        return Object.assign(new Error(n.message), n);
      try {
        return new Error(JSON.stringify(n));
      } catch (c) {
        return new Error(`Couldn't normalize error ${String(n)}: ${c}`);
      }
    }
    return new Error(`Can't normalize error ${String(n)}`);
  }
  return ji = o, ji;
}
var Pi, an;
function at() {
  if (an) return Pi;
  an = 1;
  class o {
    constructor(n = {}) {
      I(this, "disposers", []);
      I(this, "format", "{eventSource}#{eventName}:");
      I(this, "formatters", {
        app: {
          "certificate-error": ({ args: n }) => this.arrayToObject(n.slice(1, 4), [
            "url",
            "error",
            "certificate"
          ]),
          "child-process-gone": ({ args: n }) => n.length === 1 ? n[0] : n,
          "render-process-gone": ({ args: [n, c] }) => c && typeof c == "object" ? { ...c, ...this.getWebContentsDetails(n) } : []
        },
        webContents: {
          "console-message": ({ args: [n, c, p, a] }) => {
            if (!(n < 3))
              return { message: c, source: `${a}:${p}` };
          },
          "did-fail-load": ({ args: n }) => this.arrayToObject(n, [
            "errorCode",
            "errorDescription",
            "validatedURL",
            "isMainFrame",
            "frameProcessId",
            "frameRoutingId"
          ]),
          "did-fail-provisional-load": ({ args: n }) => this.arrayToObject(n, [
            "errorCode",
            "errorDescription",
            "validatedURL",
            "isMainFrame",
            "frameProcessId",
            "frameRoutingId"
          ]),
          "plugin-crashed": ({ args: n }) => this.arrayToObject(n, ["name", "version"]),
          "preload-error": ({ args: n }) => this.arrayToObject(n, ["preloadPath", "error"])
        }
      });
      I(this, "events", {
        app: {
          "certificate-error": !0,
          "child-process-gone": !0,
          "render-process-gone": !0
        },
        webContents: {
          // 'console-message': true,
          "did-fail-load": !0,
          "did-fail-provisional-load": !0,
          "plugin-crashed": !0,
          "preload-error": !0,
          unresponsive: !0
        }
      });
      I(this, "externalApi");
      I(this, "level", "error");
      I(this, "scope", "");
      this.setOptions(n);
    }
    setOptions({
      events: n,
      externalApi: c,
      level: p,
      logger: a,
      format: e,
      formatters: i,
      scope: s
    }) {
      typeof n == "object" && (this.events = n), typeof c == "object" && (this.externalApi = c), typeof p == "string" && (this.level = p), typeof a == "object" && (this.logger = a), (typeof e == "string" || typeof e == "function") && (this.format = e), typeof i == "object" && (this.formatters = i), typeof s == "string" && (this.scope = s);
    }
    startLogging(n = {}) {
      this.setOptions(n), this.disposeListeners();
      for (const c of this.getEventNames(this.events.app))
        this.disposers.push(
          this.externalApi.onAppEvent(c, (...p) => {
            this.handleEvent({ eventSource: "app", eventName: c, handlerArgs: p });
          })
        );
      for (const c of this.getEventNames(this.events.webContents))
        this.disposers.push(
          this.externalApi.onEveryWebContentsEvent(
            c,
            (...p) => {
              this.handleEvent(
                { eventSource: "webContents", eventName: c, handlerArgs: p }
              );
            }
          )
        );
    }
    stopLogging() {
      this.disposeListeners();
    }
    arrayToObject(n, c) {
      const p = {};
      return c.forEach((a, e) => {
        p[a] = n[e];
      }), n.length > c.length && (p.unknownArgs = n.slice(c.length)), p;
    }
    disposeListeners() {
      this.disposers.forEach((n) => n()), this.disposers = [];
    }
    formatEventLog({ eventName: n, eventSource: c, handlerArgs: p }) {
      var m;
      const [a, ...e] = p;
      if (typeof this.format == "function")
        return this.format({ args: e, event: a, eventName: n, eventSource: c });
      const i = (m = this.formatters[c]) == null ? void 0 : m[n];
      let s = e;
      if (typeof i == "function" && (s = i({ args: e, event: a, eventName: n, eventSource: c })), !s)
        return;
      const r = {};
      return Array.isArray(s) ? r.args = s : typeof s == "object" && Object.assign(r, s), c === "webContents" && Object.assign(r, this.getWebContentsDetails(a == null ? void 0 : a.sender)), [this.format.replace("{eventSource}", c === "app" ? "App" : "WebContents").replace("{eventName}", n), r];
    }
    getEventNames(n) {
      return !n || typeof n != "object" ? [] : Object.entries(n).filter(([c, p]) => p).map(([c]) => c);
    }
    getWebContentsDetails(n) {
      if (!(n != null && n.loadURL))
        return {};
      try {
        return {
          webContents: {
            id: n.id,
            url: n.getURL()
          }
        };
      } catch {
        return {};
      }
    }
    handleEvent({ eventName: n, eventSource: c, handlerArgs: p }) {
      var e;
      const a = this.formatEventLog({ eventName: n, eventSource: c, handlerArgs: p });
      if (a) {
        const i = this.scope ? this.logger.scope(this.scope) : this.logger;
        (e = i == null ? void 0 : i[this.level]) == null || e.call(i, ...a);
      }
    }
  }
  return Pi = o, Pi;
}
var Ti, nn;
function Ie() {
  if (nn) return Ti;
  nn = 1, Ti = { transform: o };
  function o({
    logger: t,
    message: n,
    transport: c,
    initialData: p = (n == null ? void 0 : n.data) || [],
    transforms: a = c == null ? void 0 : c.transforms
  }) {
    return a.reduce((e, i) => typeof i == "function" ? i({ data: e, logger: t, message: n, transport: c }) : e, p);
  }
  return Ti;
}
var Oi, sn;
function An() {
  if (sn) return Oi;
  sn = 1;
  const { transform: o } = Ie();
  Oi = {
    concatFirstStringElements: t,
    formatScope: c,
    formatText: a,
    formatVariables: p,
    timeZoneFromOffset: n,
    format({ message: e, logger: i, transport: s, data: r = e == null ? void 0 : e.data }) {
      switch (typeof s.format) {
        case "string":
          return o({
            message: e,
            logger: i,
            transforms: [p, c, a],
            transport: s,
            initialData: [s.format, ...r]
          });
        case "function":
          return s.format({
            data: r,
            level: (e == null ? void 0 : e.level) || "info",
            logger: i,
            message: e,
            transport: s
          });
        default:
          return r;
      }
    }
  };
  function t({ data: e }) {
    return typeof e[0] != "string" || typeof e[1] != "string" || e[0].match(/%[1cdfiOos]/) ? e : [`${e[0]} ${e[1]}`, ...e.slice(2)];
  }
  function n(e) {
    const i = Math.abs(e), s = e > 0 ? "-" : "+", r = Math.floor(i / 60).toString().padStart(2, "0"), l = (i % 60).toString().padStart(2, "0");
    return `${s}${r}:${l}`;
  }
  function c({ data: e, logger: i, message: s }) {
    const { defaultLabel: r, labelLength: l } = (i == null ? void 0 : i.scope) || {}, m = e[0];
    let f = s.scope;
    f || (f = r);
    let w;
    return f === "" ? w = l > 0 ? "".padEnd(l + 3) : "" : typeof f == "string" ? w = ` (${f})`.padEnd(l + 3) : w = "", e[0] = m.replace("{scope}", w), e;
  }
  function p({ data: e, message: i }) {
    let s = e[0];
    if (typeof s != "string")
      return e;
    s = s.replace("{level}]", `${i.level}]`.padEnd(6, " "));
    const r = i.date || /* @__PURE__ */ new Date();
    return e[0] = s.replace(/\{(\w+)}/g, (l, m) => {
      var f;
      switch (m) {
        case "level":
          return i.level || "info";
        case "logId":
          return i.logId;
        case "y":
          return r.getFullYear().toString(10);
        case "m":
          return (r.getMonth() + 1).toString(10).padStart(2, "0");
        case "d":
          return r.getDate().toString(10).padStart(2, "0");
        case "h":
          return r.getHours().toString(10).padStart(2, "0");
        case "i":
          return r.getMinutes().toString(10).padStart(2, "0");
        case "s":
          return r.getSeconds().toString(10).padStart(2, "0");
        case "ms":
          return r.getMilliseconds().toString(10).padStart(3, "0");
        case "z":
          return n(r.getTimezoneOffset());
        case "iso":
          return r.toISOString();
        default:
          return ((f = i.variables) == null ? void 0 : f[m]) || l;
      }
    }).trim(), e;
  }
  function a({ data: e }) {
    const i = e[0];
    if (typeof i != "string")
      return e;
    if (i.lastIndexOf("{text}") === i.length - 6)
      return e[0] = i.replace(/\s?{text}/, ""), e[0] === "" && e.shift(), e;
    const r = i.split("{text}");
    let l = [];
    return r[0] !== "" && l.push(r[0]), l = l.concat(e.slice(1)), r[1] !== "" && l.push(r[1]), l;
  }
  return Oi;
}
var Ci = { exports: {} }, on;
function Xe() {
  return on || (on = 1, function(o) {
    const t = hs;
    o.exports = {
      serialize: c,
      maxDepth({ data: p, transport: a, depth: e = (a == null ? void 0 : a.depth) ?? 6 }) {
        if (!p)
          return p;
        if (e < 1)
          return Array.isArray(p) ? "[array]" : typeof p == "object" && p ? "[object]" : p;
        if (Array.isArray(p))
          return p.map((s) => o.exports.maxDepth({
            data: s,
            depth: e - 1
          }));
        if (typeof p != "object" || p && typeof p.toISOString == "function")
          return p;
        if (p === null)
          return null;
        if (p instanceof Error)
          return p;
        const i = {};
        for (const s in p)
          Object.prototype.hasOwnProperty.call(p, s) && (i[s] = o.exports.maxDepth({
            data: p[s],
            depth: e - 1
          }));
        return i;
      },
      toJSON({ data: p }) {
        return JSON.parse(JSON.stringify(p, n()));
      },
      toString({ data: p, transport: a }) {
        const e = (a == null ? void 0 : a.inspectOptions) || {}, i = p.map((s) => {
          if (s !== void 0)
            try {
              const r = JSON.stringify(s, n(), "  ");
              return r === void 0 ? void 0 : JSON.parse(r);
            } catch {
              return s;
            }
        });
        return t.formatWithOptions(e, ...i);
      }
    };
    function n(p = {}) {
      const a = /* @__PURE__ */ new WeakSet();
      return function(e, i) {
        if (typeof i == "object" && i !== null) {
          if (a.has(i))
            return;
          a.add(i);
        }
        return c(e, i, p);
      };
    }
    function c(p, a, e = {}) {
      const i = (e == null ? void 0 : e.serializeMapAndSet) !== !1;
      return a instanceof Error ? a.stack : a && (typeof a == "function" ? `[function] ${a.toString()}` : a instanceof Date ? a.toISOString() : i && a instanceof Map && Object.fromEntries ? Object.fromEntries(a) : i && a instanceof Set && Array.from ? Array.from(a) : a);
    }
  }(Ci)), Ci.exports;
}
var Li, tn;
function ea() {
  if (tn) return Li;
  tn = 1, Li = {
    transformStyles: c,
    applyAnsiStyles({ data: p }) {
      return c(p, t, n);
    },
    removeStyles({ data: p }) {
      return c(p, () => "");
    }
  };
  const o = {
    unset: "\x1B[0m",
    black: "\x1B[30m",
    red: "\x1B[31m",
    green: "\x1B[32m",
    yellow: "\x1B[33m",
    blue: "\x1B[34m",
    magenta: "\x1B[35m",
    cyan: "\x1B[36m",
    white: "\x1B[37m",
    gray: "\x1B[90m"
  };
  function t(p) {
    const a = p.replace(/color:\s*(\w+).*/, "$1").toLowerCase();
    return o[a] || "";
  }
  function n(p) {
    return p + o.unset;
  }
  function c(p, a, e) {
    const i = {};
    return p.reduce((s, r, l, m) => {
      if (i[l])
        return s;
      if (typeof r == "string") {
        let f = l, w = !1;
        r = r.replace(/%[1cdfiOos]/g, (E) => {
          if (f += 1, E !== "%c")
            return E;
          const _ = m[f];
          return typeof _ == "string" ? (i[f] = !0, w = !0, a(_, r)) : E;
        }), w && e && (r = e(r));
      }
      return s.push(r), s;
    }, []);
  }
  return Li;
}
var Ai, rn;
function nt() {
  if (rn) return Ai;
  rn = 1;
  const {
    concatFirstStringElements: o,
    format: t
  } = An(), { maxDepth: n, toJSON: c } = Xe(), {
    applyAnsiStyles: p,
    removeStyles: a
  } = ea(), { transform: e } = Ie(), i = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  Ai = l;
  const r = `%c{h}:{i}:{s}.{ms}{scope}%c ${process.platform === "win32" ? ">" : "›"} {text}`;
  Object.assign(l, {
    DEFAULT_FORMAT: r
  });
  function l(_) {
    return Object.assign(y, {
      colorMap: {
        error: "red",
        warn: "yellow",
        info: "cyan",
        verbose: "unset",
        debug: "gray",
        silly: "gray",
        default: "unset"
      },
      format: r,
      level: "silly",
      transforms: [
        m,
        t,
        w,
        o,
        n,
        c
      ],
      useStyles: process.env.FORCE_STYLES,
      writeFn({ message: g }) {
        (i[g.level] || i.info)(...g.data);
      }
    });
    function y(g) {
      const b = e({ logger: _, message: g, transport: y });
      y.writeFn({
        message: { ...g, data: b }
      });
    }
  }
  function m({ data: _, message: y, transport: g }) {
    return typeof g.format != "string" || !g.format.includes("%c") ? _ : [
      `color:${E(y.level, g)}`,
      "color:unset",
      ..._
    ];
  }
  function f(_, y) {
    if (typeof _ == "boolean")
      return _;
    const b = y === "error" || y === "warn" ? process.stderr : process.stdout;
    return b && b.isTTY;
  }
  function w(_) {
    const { message: y, transport: g } = _;
    return (f(g.useStyles, y.level) ? p : a)(_);
  }
  function E(_, y) {
    return y.colorMap[_] || y.colorMap.default;
  }
  return Ai;
}
var Di, cn;
function Dn() {
  if (cn) return Di;
  cn = 1;
  const o = We, t = ue, n = Ae;
  class c extends o {
    constructor({
      path: i,
      writeOptions: s = { encoding: "utf8", flag: "a", mode: 438 },
      writeAsync: r = !1
    }) {
      super();
      I(this, "asyncWriteQueue", []);
      I(this, "bytesWritten", 0);
      I(this, "hasActiveAsyncWriting", !1);
      I(this, "path", null);
      I(this, "initialSize");
      I(this, "writeOptions", null);
      I(this, "writeAsync", !1);
      this.path = i, this.writeOptions = s, this.writeAsync = r;
    }
    get size() {
      return this.getSize();
    }
    clear() {
      try {
        return t.writeFileSync(this.path, "", {
          mode: this.writeOptions.mode,
          flag: "w"
        }), this.reset(), !0;
      } catch (i) {
        return i.code === "ENOENT" ? !0 : (this.emit("error", i, this), !1);
      }
    }
    crop(i) {
      try {
        const s = p(this.path, i || 4096);
        this.clear(), this.writeLine(`[log cropped]${n.EOL}${s}`);
      } catch (s) {
        this.emit(
          "error",
          new Error(`Couldn't crop file ${this.path}. ${s.message}`),
          this
        );
      }
    }
    getSize() {
      if (this.initialSize === void 0)
        try {
          const i = t.statSync(this.path);
          this.initialSize = i.size;
        } catch {
          this.initialSize = 0;
        }
      return this.initialSize + this.bytesWritten;
    }
    increaseBytesWrittenCounter(i) {
      this.bytesWritten += Buffer.byteLength(i, this.writeOptions.encoding);
    }
    isNull() {
      return !1;
    }
    nextAsyncWrite() {
      const i = this;
      if (this.hasActiveAsyncWriting || this.asyncWriteQueue.length === 0)
        return;
      const s = this.asyncWriteQueue.join("");
      this.asyncWriteQueue = [], this.hasActiveAsyncWriting = !0, t.writeFile(this.path, s, this.writeOptions, (r) => {
        i.hasActiveAsyncWriting = !1, r ? i.emit(
          "error",
          new Error(`Couldn't write to ${i.path}. ${r.message}`),
          this
        ) : i.increaseBytesWrittenCounter(s), i.nextAsyncWrite();
      });
    }
    reset() {
      this.initialSize = void 0, this.bytesWritten = 0;
    }
    toString() {
      return this.path;
    }
    writeLine(i) {
      if (i += n.EOL, this.writeAsync) {
        this.asyncWriteQueue.push(i), this.nextAsyncWrite();
        return;
      }
      try {
        t.writeFileSync(this.path, i, this.writeOptions), this.increaseBytesWrittenCounter(i);
      } catch (s) {
        this.emit(
          "error",
          new Error(`Couldn't write to ${this.path}. ${s.message}`),
          this
        );
      }
    }
  }
  Di = c;
  function p(a, e) {
    const i = Buffer.alloc(e), s = t.statSync(a), r = Math.min(s.size, e), l = Math.max(0, s.size - e), m = t.openSync(a, "r"), f = t.readSync(m, i, 0, r, l);
    return t.closeSync(m), i.toString("utf8", 0, f);
  }
  return Di;
}
var Ni, pn;
function st() {
  if (pn) return Ni;
  pn = 1;
  const o = Dn();
  class t extends o {
    clear() {
    }
    crop() {
    }
    getSize() {
      return 0;
    }
    isNull() {
      return !0;
    }
    writeLine() {
    }
  }
  return Ni = t, Ni;
}
var Fi, ln;
function ot() {
  if (ln) return Fi;
  ln = 1;
  const o = We, t = ue, n = z, c = Dn(), p = st();
  class a extends o {
    constructor() {
      super();
      I(this, "store", {});
      this.emitError = this.emitError.bind(this);
    }
    /**
     * Provide a File object corresponding to the filePath
     * @param {string} filePath
     * @param {WriteOptions} [writeOptions]
     * @param {boolean} [writeAsync]
     * @return {File}
     */
    provide({ filePath: s, writeOptions: r = {}, writeAsync: l = !1 }) {
      let m;
      try {
        if (s = n.resolve(s), this.store[s])
          return this.store[s];
        m = this.createFile({ filePath: s, writeOptions: r, writeAsync: l });
      } catch (f) {
        m = new p({ path: s }), this.emitError(f, m);
      }
      return m.on("error", this.emitError), this.store[s] = m, m;
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @param {boolean} async
     * @return {File}
     * @private
     */
    createFile({ filePath: s, writeOptions: r, writeAsync: l }) {
      return this.testFileWriting({ filePath: s, writeOptions: r }), new c({ path: s, writeOptions: r, writeAsync: l });
    }
    /**
     * @param {Error} error
     * @param {File} file
     * @private
     */
    emitError(s, r) {
      this.emit("error", s, r);
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @private
     */
    testFileWriting({ filePath: s, writeOptions: r }) {
      t.mkdirSync(n.dirname(s), { recursive: !0 }), t.writeFileSync(s, "", { flag: "a", mode: r.mode });
    }
  }
  return Fi = a, Fi;
}
var Ii, un;
function tt() {
  if (un) return Ii;
  un = 1;
  const o = ue, t = Ae, n = z, c = ot(), { transform: p } = Ie(), { removeStyles: a } = ea(), {
    format: e,
    concatFirstStringElements: i
  } = An(), { toString: s } = Xe();
  Ii = l;
  const r = new c();
  function l(f, { registry: w = r, externalApi: E } = {}) {
    let _;
    return w.listenerCount("error") < 1 && w.on("error", (u, d) => {
      b(`Can't write to ${d}`, u);
    }), Object.assign(y, {
      fileName: m(f.variables.processType),
      format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}",
      getFile: j,
      inspectOptions: { depth: 5 },
      level: "silly",
      maxSize: 1024 ** 2,
      readAllLogs: S,
      sync: !0,
      transforms: [a, e, i, s],
      writeOptions: { flag: "a", mode: 438, encoding: "utf8" },
      archiveLogFn(u) {
        const d = u.toString(), x = n.parse(d);
        try {
          o.renameSync(d, n.join(x.dir, `${x.name}.old${x.ext}`));
        } catch (h) {
          b("Could not rotate log", h);
          const T = Math.round(y.maxSize / 4);
          u.crop(Math.min(T, 256 * 1024));
        }
      },
      resolvePathFn(u) {
        return n.join(u.libraryDefaultDir, u.fileName);
      },
      setAppName(u) {
        f.dependencies.externalApi.setAppName(u);
      }
    });
    function y(u) {
      const d = j(u);
      y.maxSize > 0 && d.size > y.maxSize && (y.archiveLogFn(d), d.reset());
      const h = p({ logger: f, message: u, transport: y });
      d.writeLine(h);
    }
    function g() {
      _ || (_ = Object.create(
        Object.prototype,
        {
          ...Object.getOwnPropertyDescriptors(
            E.getPathVariables()
          ),
          fileName: {
            get() {
              return y.fileName;
            },
            enumerable: !0
          }
        }
      ), typeof y.archiveLog == "function" && (y.archiveLogFn = y.archiveLog, b("archiveLog is deprecated. Use archiveLogFn instead")), typeof y.resolvePath == "function" && (y.resolvePathFn = y.resolvePath, b("resolvePath is deprecated. Use resolvePathFn instead")));
    }
    function b(u, d = null, x = "error") {
      const h = [`electron-log.transports.file: ${u}`];
      d && h.push(d), f.transports.console({ data: h, date: /* @__PURE__ */ new Date(), level: x });
    }
    function j(u) {
      g();
      const d = y.resolvePathFn(_, u);
      return w.provide({
        filePath: d,
        writeAsync: !y.sync,
        writeOptions: y.writeOptions
      });
    }
    function S({ fileFilter: u = (d) => d.endsWith(".log") } = {}) {
      g();
      const d = n.dirname(y.resolvePathFn(_));
      return o.existsSync(d) ? o.readdirSync(d).map((x) => n.join(d, x)).filter(u).map((x) => {
        try {
          return {
            path: x,
            lines: o.readFileSync(x, "utf8").split(t.EOL)
          };
        } catch {
          return null;
        }
      }).filter(Boolean) : [];
    }
  }
  function m(f = process.type) {
    switch (f) {
      case "renderer":
        return "renderer.log";
      case "worker":
        return "worker.log";
      default:
        return "main.log";
    }
  }
  return Ii;
}
var Mi, dn;
function rt() {
  if (dn) return Mi;
  dn = 1;
  const { maxDepth: o, toJSON: t } = Xe(), { transform: n } = Ie();
  Mi = c;
  function c(p, { externalApi: a }) {
    return Object.assign(e, {
      depth: 3,
      eventId: "__ELECTRON_LOG_IPC__",
      level: p.isDev ? "silly" : !1,
      transforms: [t, o]
    }), a != null && a.isElectron() ? e : void 0;
    function e(i) {
      var s;
      ((s = i == null ? void 0 : i.variables) == null ? void 0 : s.processType) !== "renderer" && (a == null || a.sendIpc(e.eventId, {
        ...i,
        data: n({ logger: p, message: i, transport: e })
      }));
    }
  }
  return Mi;
}
var Ri, mn;
function ct() {
  if (mn) return Ri;
  mn = 1;
  const o = Ji, t = yn, { transform: n } = Ie(), { removeStyles: c } = ea(), { toJSON: p, maxDepth: a } = Xe();
  Ri = e;
  function e(i) {
    return Object.assign(s, {
      client: { name: "electron-application" },
      depth: 6,
      level: !1,
      requestOptions: {},
      transforms: [c, p, a],
      makeBodyFn({ message: r }) {
        return JSON.stringify({
          client: s.client,
          data: r.data,
          date: r.date.getTime(),
          level: r.level,
          scope: r.scope,
          variables: r.variables
        });
      },
      processErrorFn({ error: r }) {
        i.processMessage(
          {
            data: [`electron-log: can't POST ${s.url}`, r],
            level: "warn"
          },
          { transports: ["console", "file"] }
        );
      },
      sendRequestFn({ serverUrl: r, requestOptions: l, body: m }) {
        const w = (r.startsWith("https:") ? t : o).request(r, {
          method: "POST",
          ...l,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": m.length,
            ...l.headers
          }
        });
        return w.write(m), w.end(), w;
      }
    });
    function s(r) {
      if (!s.url)
        return;
      const l = s.makeBodyFn({
        logger: i,
        message: { ...r, data: n({ logger: i, message: r, transport: s }) },
        transport: s
      }), m = s.sendRequestFn({
        serverUrl: s.url,
        requestOptions: s.requestOptions,
        body: Buffer.from(l, "utf8")
      });
      m.on("error", (f) => s.processErrorFn({
        error: f,
        logger: i,
        message: r,
        request: m,
        transport: s
      }));
    }
  }
  return Ri;
}
var qi, fn;
function pt() {
  if (fn) return qi;
  fn = 1;
  const o = et(), t = it(), n = at(), c = nt(), p = tt(), a = rt(), e = ct();
  qi = i;
  function i({ dependencies: s, initializeFn: r }) {
    var m;
    const l = new o({
      dependencies: s,
      errorHandler: new t(),
      eventLogger: new n(),
      initializeFn: r,
      isDev: (m = s.externalApi) == null ? void 0 : m.isDev(),
      logId: "default",
      transportFactories: {
        console: c,
        file: p,
        ipc: a,
        remote: e
      },
      variables: {
        processType: "main"
      }
    });
    return l.default = l, l.Logger = o, l.processInternalErrorFn = (f) => {
      l.transports.console.writeFn({
        message: {
          data: ["Unhandled electron-log error", f],
          level: "error"
        }
      });
    }, l;
  }
  return qi;
}
var Ui, xn;
function lt() {
  if (xn) return Ui;
  xn = 1;
  const o = Hn, t = Xo(), { initialize: n } = Qo(), c = pt(), p = new t({ electron: o }), a = c({
    dependencies: { externalApi: p },
    initializeFn: n
  });
  Ui = a, p.onIpc("__ELECTRON_LOG__", (i, s) => {
    s.scope && a.Logger.getInstance(s).scope(s.scope);
    const r = new Date(s.date);
    e({
      ...s,
      date: r.getTime() ? r : /* @__PURE__ */ new Date()
    });
  }), p.onIpcInvoke("__ELECTRON_LOG__", (i, { cmd: s = "", logId: r }) => {
    switch (s) {
      case "getOptions":
        return {
          levels: a.Logger.getInstance({ logId: r }).levels,
          logId: r
        };
      default:
        return e({ data: [`Unknown cmd '${s}'`], level: "error" }), {};
    }
  });
  function e(i) {
    var s;
    (s = a.Logger.getInstance(i)) == null || s.processMessage(i);
  }
  return Ui;
}
var zi, hn;
function ut() {
  return hn || (hn = 1, zi = lt()), zi;
}
var dt = ut();
const ia = /* @__PURE__ */ Ge(dt), vn = 19999;
function mt(o) {
  const t = vs((n, c) => {
    if (c.setHeader("Access-Control-Allow-Origin", "*"), c.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS"), c.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With"), n.method === "OPTIONS") {
      c.writeHead(200), c.end();
      return;
    }
    if (!H.port || !H.ip) {
      const e = JSON.stringify({
        success: !1,
        error: "Internal backend service is not ready yet.",
        status: "initializing"
      });
      c.writeHead(503, { "Content-Type": "application/json" }), c.end(e);
      return;
    }
    const p = {
      hostname: H.ip,
      port: H.port,
      path: n.url,
      method: n.method,
      headers: {
        ...n.headers,
        host: `${H.ip}:${H.port}`
      }
    }, a = gs(p, (e) => {
      c.writeHead(e.statusCode || 500, e.headers), e.pipe(c, { end: !0 });
    });
    a.on("error", (e) => {
      console.error(`[Proxy Error] ${n.method} ${n.url}:`, e.message), c.headersSent || (c.writeHead(502, { "Content-Type": "application/json" }), c.end(JSON.stringify({ success: !1, error: "Bad Gateway: Failed to connect to internal backend." })));
    }), a.on("response", (e) => {
      n.method !== "GET" && n.method !== "HEAD" && e.statusCode && e.statusCode >= 200 && e.statusCode < 300 && (o.isDestroyed() || (o.webContents.send("refresh"), console.log(`[Proxy] Triggered UI refresh for ${n.method} request.`)));
    }), n.pipe(a, { end: !0 });
  });
  return t.listen(vn, "0.0.0.0", () => {
    console.log(`Dive API Proxy Server running on port ${vn}`), console.log(`Target Internal Backend: ${H.ip}:${H.port}`);
  }), t;
}
ia.initialize();
ia.transports.file.resolvePathFn = () => P.join(As, "main-electron.log");
Object.assign(console, ia.functions);
ms();
Be.release().startsWith("6.1") && M.disableHardwareAcceleration();
process.platform === "win32" && M.setAppUserModelId(M.getName());
M.requestSingleInstanceLock() ? M.on("second-instance", (o, t) => {
  q && (q.isMinimized() && q.restore(), q.focus()), Ln(q, t.pop() ?? "");
}) : (M.quit(), process.exit(0));
M.on("open-url", (o, t) => {
  Ln(q, t);
});
process.defaultApp ? process.argv.length >= 2 && M.setAsDefaultProtocolClient("dive", process.execPath, [P.resolve(process.argv[1])]) : M.setAsDefaultProtocolClient("dive");
let q = null;
const Nn = P.join(Ne, "../preload/index.mjs"), Fn = P.join(kn, "index.html");
async function ft() {
  process.platform === "win32" ? Ds.forEach(wa) : process.env.PATH = await Xs().catch(() => process.env.PATH), process.platform === "darwin" && Ns.forEach(wa), _o(), Ho(), aa(), Ws(q), Q.registEvent("login", () => {
    q.webContents.send("oap:login");
  }), Q.registEvent("logout", () => {
    q.webContents.send("oap:logout");
  }), Q.onReceiveWebSocketMessage((o) => {
    switch (se && console.log("receive websocket message", o), o.type) {
      case "user.settings.mcps.updated":
      case "user.account.subscription.update":
        Je();
        break;
    }
  });
}
async function aa() {
  q = new $e({
    title: "Dive AI",
    icon: P.join(process.env.VITE_PUBLIC, "favicon.ico"),
    width: 1280,
    height: 720,
    minHeight: 320,
    minWidth: 400,
    webPreferences: {
      preload: Nn
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    }
  }), se ? (q.loadURL(se), q.webContents.openDevTools()) : (q.setMenu(null), q.loadFile(Fn)), mt(q), q.webContents.on("did-finish-load", () => {
    q == null || q.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), q.webContents.setWindowOpenHandler(({ url: n }) => (n.startsWith("https:") && Hi.openExternal(n), { action: "deny" })), q.on("close", (n) => be.isQuitting ? !0 : (n.preventDefault(), q == null || q.hide(), !1)), ro(q);
  const o = Ce.get("minimalToTray");
  process.platform !== "darwin" && o && (Cn(q), be.setIsQuitting(!1)), Go(q);
  const t = Ce.get("autoLaunch");
  M.setLoginItemSettings({
    openAtLogin: t,
    openAsHidden: !1
  });
}
M.whenReady().then(ft);
M.on("quit", async () => {
  await Gs();
});
M.on("window-all-closed", async () => {
  q = null, process.platform !== "darwin" && be.isQuitting && M.quit();
});
M.on("second-instance", () => {
  q && (q.isMinimized() && q.restore(), q.focus());
});
M.on("before-quit", () => {
  be.setIsQuitting(!0);
});
M.on("activate", () => {
  const o = $e.getAllWindows();
  o.length ? (o[0].show(), o[0].focus()) : q ? q.show() : aa();
});
D.handle("open-win", (o, t) => {
  const n = new $e({
    webPreferences: {
      preload: Nn,
      nodeIntegration: !0,
      contextIsolation: !1
    }
  });
  se ? n.loadURL(`${se}#${t}`) : n.loadFile(Fn, { hash: t });
});
export {
  aa as createWindow
};
