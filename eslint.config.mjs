import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // 라벨 에디터는 Fabric 캔버스(명령형 객체)를 ref 로 들고 화면에서 선택 객체 속성을 읽는다.
    // react-hooks/refs 가 이를 모두 오류로 잡아 이 폴더에서만 끈다.
    files: ["src/components/editor/**"],
    rules: { "react-hooks/refs": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
