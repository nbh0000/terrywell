// 브라우저용 저장소: PHP /api/db 를 부른다. 공개 표(제품·설정 등)는 HTML 에 함께 온 스냅샷(window.__TW__)이나
// /api/public/snapshot 을 한 번 받아 메모리에서 거른다 (요청 수를 줄인다). 쓰기는 항상 서버로 가고, 그 표의 스냅샷은 버린다.
// 권한(본인 행·관리자)은 서버(php/api/_lib/dbapi.php access_rules)가 강제한다.

import { apiPost } from "@/lib/api";
import type { Db, SelectOptions, Where } from "./index";
import type { TableName, Tables } from "./types";

type Snapshot = Partial<{ [K in TableName]: Tables[K][] }>;

export interface SessionInfo {
  user: Tables["profiles"] | null;
  oauth: Record<string, boolean>;
  portone: { storeId: string; channelKey: string; mode: "portone" | "mock" };
  ai: { provider: string };
}

declare global {
  interface Window {
    __TW__?: { session: SessionInfo; data: Snapshot; at: string };
  }
}

const SNAPSHOT_TABLES: TableName[] = ["categories", "products", "product_colors", "product_price_tiers", "product_files", "templates", "stickers", "faqs", "site_settings", "site_contents"];

let snapshot: Snapshot | null = null;
let loading: Promise<Snapshot> | null = null;

function loadSnapshot(): Promise<Snapshot> {
  if (snapshot) return Promise.resolve(snapshot);
  if (typeof window === "undefined") return Promise.resolve({});
  if (window.__TW__?.data) {
    snapshot = window.__TW__.data;
    return Promise.resolve(snapshot);
  }
  loading ??= apiPost<Snapshot>("public/snapshot", undefined)
    .catch(() => fetch((process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/api/public/snapshot", { cache: "no-store" }).then((r) => r.json() as Promise<Snapshot>))
    .then((d) => (snapshot = d))
    .finally(() => (loading = null));
  return loading;
}

/** 관리자 화면 등에서 바뀐 뒤 공개 데이터를 다시 받게 한다 */
export function invalidateSnapshot(table?: TableName) {
  if (!snapshot) return;
  if (table) delete snapshot[table];
  else snapshot = null;
}

function matches<T>(row: T, where?: Partial<T>) {
  if (!where) return true;
  return Object.entries(where).every(([k, v]) => v === undefined || (row as Record<string, unknown>)[k] === v);
}

function applyOptions<T extends TableName>(rows: Tables[T][], opts: SelectOptions<T>) {
  let out = rows.filter((r) => matches(r, opts.where));
  for (const o of [...(opts.order ?? [])].reverse()) {
    const dir = o.ascending === false ? -1 : 1;
    out = [...out].sort((a, b) => {
      const x = a[o.column] as unknown as string | number;
      const y = b[o.column] as unknown as string | number;
      return x < y ? -dir : x > y ? dir : 0;
    });
  }
  const start = opts.offset ?? 0;
  return out.slice(start, opts.limit ? start + opts.limit : undefined);
}

async function call<T>(req: Record<string, unknown>): Promise<T> {
  const { result } = await apiPost<{ result: T }>("db", req);
  return result;
}

/** @param admin true 면 스냅샷을 거치지 않고 항상 서버에 묻는다 (숨긴 제품 등 전체) */
export function makeHttpDb(admin: boolean): Db {
  const viaSnapshot = (table: TableName) => !admin && SNAPSHOT_TABLES.includes(table);
  return {
    async select<T extends TableName>(table: T, opts: SelectOptions<T> = {}) {
      if (viaSnapshot(table)) {
        const snap = await loadSnapshot();
        const rows = snap[table] as Tables[T][] | undefined;
        if (rows) return structuredClone(applyOptions<T>(rows, opts));
      }
      return call<Tables[T][]>({ op: "select", table, ...opts });
    },
    async count<T extends TableName>(table: T, where?: Where<T>) {
      if (viaSnapshot(table)) {
        const rows = (await loadSnapshot())[table] as Tables[T][] | undefined;
        if (rows) return rows.filter((r) => matches(r, where)).length;
      }
      return call<number>({ op: "count", table, where });
    },
    async get<T extends TableName>(table: T, where: Where<T>) {
      if (viaSnapshot(table)) {
        const rows = (await loadSnapshot())[table] as Tables[T][] | undefined;
        if (rows) {
          const row = rows.find((r) => matches(r, where));
          return row ? structuredClone(row) : null;
        }
      }
      return call<Tables[T] | null>({ op: "get", table, where });
    },
    async insert<T extends TableName>(table: T, row: Partial<Tables[T]>) {
      invalidateSnapshot(table);
      return call<Tables[T]>({ op: "insert", table, row });
    },
    async update<T extends TableName>(table: T, where: Where<T>, patch: Partial<Tables[T]>) {
      invalidateSnapshot(table);
      return call<Tables[T][]>({ op: "update", table, where, patch });
    },
    async upsert<T extends TableName>(table: T, row: Partial<Tables[T]>, onConflict: (keyof Tables[T] & string)[]) {
      invalidateSnapshot(table);
      return call<Tables[T]>({ op: "upsert", table, row, onConflict });
    },
    async remove<T extends TableName>(table: T, where: Where<T>) {
      invalidateSnapshot(table);
      await call<null>({ op: "remove", table, where });
    },
  };
}
