import type { TableName, Tables } from "./types";
import { makeHttpDb } from "./http";

export type Where<T extends TableName> = Partial<Tables[T]>;

export interface SelectOptions<T extends TableName> {
  where?: Where<T>;
  order?: { column: keyof Tables[T] & string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
}

/**
 * 저장소 인터페이스. 브라우저에서 PHP /api/db 를 부른다 (카페24 호스팅: 서버는 PHP, 화면은 정적 Next).
 * 권한 검사는 서버(php/api/_lib/dbapi.php)가 한다.
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

const publicDb = makeHttpDb(false);
const adminDb = makeHttpDb(true);

/**
 * @param admin true 면 공개 스냅샷을 거치지 않고 항상 서버에 묻는다 (관리자 화면: 숨긴 제품·전체 회원 등).
 *              실제 권한은 서버가 로그인한 회원의 역할로 판단한다.
 */
export function getDb({ admin = false }: { admin?: boolean } = {}): Db {
  return admin ? adminDb : publicDb;
}
