// Vitest 配置:单元测试 + 覆盖率门禁。
// 目标:lines / functions / branches / statements 四维全部 >= 60%。
// 覆盖范围限定为 src/**(卡片源码、后端客户端、本地化包),不含构建产物。
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.js"],
    setupFiles: ["tests/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.js"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
