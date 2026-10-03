import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Db, SelectOptions, Where } from "./index";
import type { TableName, Tables } from "./types";
import { createAdminClient, createServerSupabase } from "@/lib/supabase/server";

// 테이블 타입은 src/lib/db/types.ts 에서 관리하므로 Supabase 쿼리 빌더는 느슨한 타입으로 다룬다
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any;

function applyWhere(q: Query, where?: Record<string, unknown>): Query {
  for (const [k, v] of Object.entries(where ?? {})) if (v !== undefined) q = q.eq(k, v);
  return q;
}

function fail(table: string, error: { message: string } | null) {
  if (error) throw new Error(`[db:${table}] ${error.message}`);
}

export function supabaseDb(admin: boolean): Db {
  const client = async (): Promise<SupabaseClient> => (admin ? createAdminClient() : await createServerSupabase());
  const from = async (table: string): Promise<Query> => (await client()).from(table);

  return {
    async select<T extends TableName>(table: T, opts: SelectOptions<T> = {}) {
      let q = applyWhere((await from(table)).select("*"), opts.where as Record<string, unknown>);
      for (const o of opts.order ?? []) q = q.order(o.column, { ascending: o.ascending !== false });
      if (opts.limit) q = q.range(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit - 1);
      const { data, error } = await q;
      fail(table, error);
      return (data ?? []) as Tables[T][];
    },

    async count<T extends TableName>(table: T, where?: Where<T>) {
      const q = applyWhere((await from(table)).select("*", { count: "exact", head: true }), where as Record<string, unknown>);
      const { count, error } = await q;
      fail(table, error);
      return count ?? 0;
    },

    async get<T extends TableName>(table: T, where: Where<T>) {
      const q = applyWhere((await from(table)).select("*"), where as Record<string, unknown>);
      const { data, error } = await q.limit(1).maybeSingle();
      fail(table, error);
      return (data ?? null) as Tables[T] | null;
    },

    async insert<T extends TableName>(table: T, row: Partial<Tables[T]>) {
      const { data, error } = await (await from(table)).insert(row).select("*").single();
      fail(table, error);
      return data as Tables[T];
    },

    async update<T extends TableName>(table: T, where: Where<T>, patch: Partial<Tables[T]>) {
      const q = applyWhere((await from(table)).update(patch), where as Record<string, unknown>);
      const { data, error } = await q.select("*");
      fail(table, error);
      return (data ?? []) as Tables[T][];
    },

    async upsert<T extends TableName>(table: T, row: Partial<Tables[T]>, onConflict: (keyof Tables[T] & string)[]) {
      const { data, error } = await (await from(table))
        .upsert(row, { onConflict: onConflict.join(",") })
        .select("*")
        .single();
      fail(table, error);
      return data as Tables[T];
    },

    async remove<T extends TableName>(table: T, where: Where<T>) {
      const q = applyWhere((await from(table)).delete(), where as Record<string, unknown>);
      const { error } = await q;
      fail(table, error);
    },
  };
}
