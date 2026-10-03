import "server-only";
import { dataMode } from "@/lib/config";
import type { TableName, Tables } from "./types";
import { localDb } from "./local";
import { supabaseDb } from "./supabase";

export type Where<T extends TableName> = Partial<Tables[T]>;

export interface SelectOptions<T extends TableName> {
  where?: Where<T>;
  order?: { column: keyof Tables[T] & string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
}

/**
 * 로컬(JSON 파일)과 Supabase 를 같은 모양으로 다루는 최소 저장소 인터페이스.
 * 권한 검사는 호출하는 서버 코드에서 한다 (Supabase 모드에서는 RLS 가 한 번 더 막는다).
 */
export interface Db {
  select<T extends TableName>(table: T, opts?: SelectOptions<T>): Promise<Tables[T][]>;
  count<T extends TableName>(table: T, where?: Where<T>): Promise<number>;
  get<T extends TableName>(table: T, where: Where<T>): Promise<Tables[T] | null>;
  insert<T extends TableName>(table: T, row: Partial<Tables[T]>): Promise<Tables[T]>;
  update<T extends TableName>(table: T, where: Where<T>, patch: Partial<Tables[T]>): Promise<Tables[T][]>;
  upsert<T extends TableName>(table: T, row: Partial<Tables[T]>, onConflict: (keyof Tables[T] & string)[]): Promise<Tables[T]>;
  remove<T extends TableName>(table: T, where: Where<T>): Promise<void>;
}

/**
 * @param admin true 면 Supabase service role 로 RLS 를 우회한다. 서버에서 권한을 확인한 뒤에만 쓴다.
 */
export function getDb({ admin = false }: { admin?: boolean } = {}): Db {
  return dataMode === "supabase" ? supabaseDb(admin) : localDb;
}
