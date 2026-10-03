import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "@/lib/config";

/** 로그인한 사용자 권한으로 동작 (RLS 적용) */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component 에서 호출되면 쿠키를 쓸 수 없다. 세션 갱신은 proxy 가 맡는다.
        }
      },
    },
  });
}

/** service role. RLS 를 우회하므로 서버에서 권한을 확인한 뒤에만 쓴다. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다.");
  return createClient(supabaseUrl, key, { auth: { persistSession: false } });
}
