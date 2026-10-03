import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Db, SelectOptions, Where } from "./index";
import type { TableName, Tables } from "./types";
import { buildSeed } from "./seed";

// 로컬 개발용 파일 DB. Supabase 키가 없을 때만 쓰인다.
const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export interface LocalAuthUser {
  id: string;
  email: string;
  password_hash: string;
  reset_token?: string;
  reset_expires?: number;
}

type Store = { [K in TableName]: Tables[K][] } & { _auth_users: LocalAuthUser[] };

// id 대신 다른 키를 쓰는 테이블
const NO_ID: TableName[] = ["wishlists", "site_settings", "site_contents"];

let cache: Store | null = null;
let cacheMtime = 0;
let writing: Promise<void> = Promise.resolve();

// 개발 서버는 모듈을 여러 벌 띄울 수 있어(instrumentation, 액션, 페이지) 파일이 바뀌었으면 다시 읽는다
export async function loadStore(): Promise<Store> {
  await writing;
  const mtime = await fs.stat(DB_FILE).then((s) => s.mtimeMs, () => 0);
  if (cache && mtime === cacheMtime) return cache;
  if (mtime) {
    cache = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Store;
    cacheMtime = mtime;
  } else {
    cache = buildSeed() as Store;
    await persist();
  }
  return cache;
}

export async function persist() {
  const snapshot = JSON.stringify(cache, null, 2);
  writing = writing.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = DB_FILE + ".tmp";
    await fs.writeFile(tmp, snapshot, "utf8");
    await fs.rename(tmp, DB_FILE);
    cacheMtime = (await fs.stat(DB_FILE)).mtimeMs;
  });
  await writing;
}

function matches<T>(row: T, where?: Partial<T>) {
  if (!where) return true;
  return Object.entries(where).every(([k, v]) => {
    const value = (row as Record<string, unknown>)[k];
    return v === undefined || value === v;
  });
}

const clone = <T>(v: T): T => structuredClone(v);

export const localDb: Db = {
  async select<T extends TableName>(table: T, opts: SelectOptions<T> = {}) {
    const store = await loadStore();
    let rows = (store[table] as Tables[T][]).filter((r) => matches(r, opts.where));
    for (const o of [...(opts.order ?? [])].reverse()) {
      const dir = o.ascending === false ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const x = a[o.column] as unknown as string | number;
        const y = b[o.column] as unknown as string | number;
        return x < y ? -dir : x > y ? dir : 0;
      });
    }
    const start = opts.offset ?? 0;
    return clone(rows.slice(start, opts.limit ? start + opts.limit : undefined));
  },

  async count<T extends TableName>(table: T, where?: Where<T>) {
    const store = await loadStore();
    return (store[table] as Tables[T][]).filter((r) => matches(r, where)).length;
  },

  async get<T extends TableName>(table: T, where: Where<T>) {
    const store = await loadStore();
    const row = (store[table] as Tables[T][]).find((r) => matches(r, where));
    return row ? clone(row) : null;
  },

  async insert<T extends TableName>(table: T, row: Partial<Tables[T]>) {
    const store = await loadStore();
    const now = new Date().toISOString();
    const full = {
      ...(NO_ID.includes(table) ? {} : { id: randomUUID() }),
      created_at: now,
      ...(table === "site_settings" || table === "site_contents" ? { updated_at: now } : {}),
      ...row,
    } as Tables[T];
    (store[table] as Tables[T][]).push(full);
    await persist();
    return clone(full);
  },

  async update<T extends TableName>(table: T, where: Where<T>, patch: Partial<Tables[T]>) {
    const store = await loadStore();
    const now = new Date().toISOString();
    const changed: Tables[T][] = [];
    for (const r of store[table] as Tables[T][]) {
      if (!matches(r, where)) continue;
      Object.assign(r, patch, "updated_at" in (r as object) ? { updated_at: now } : {});
      changed.push(r);
    }
    await persist();
    return clone(changed);
  },

  async upsert<T extends TableName>(table: T, row: Partial<Tables[T]>, onConflict: (keyof Tables[T] & string)[]) {
    const key = Object.fromEntries(onConflict.map((k) => [k, row[k]])) as Where<T>;
    const existing = await this.get(table, key);
    if (existing) return (await this.update(table, key, row))[0];
    return this.insert(table, row);
  },

  async remove<T extends TableName>(table: T, where: Where<T>) {
    const store = await loadStore();
    (store as Record<string, unknown>)[table] = (store[table] as Tables[T][]).filter((r) => !matches(r, where));
    await persist();
  },
};
