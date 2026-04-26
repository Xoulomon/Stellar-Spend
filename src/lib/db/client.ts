import { Pool } from "pg";
import { recordDbQuery } from "../performance";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
}

const _pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Wrap pool.query to record timing for every DB call
export const pool: Pick<Pool, "query"> = {
    query: async (...args: Parameters<Pool["query"]>) => {
        const start = Date.now();
        try {
            return await (_pool.query as (...a: unknown[]) => Promise<unknown>)(...args);
        } finally {
            const sql = typeof args[0] === "string" ? args[0] : (args[0] as { text?: string })?.text ?? "";
            recordDbQuery({
                query: sql.replace(/\s+/g, " ").trim().slice(0, 80),
                durationMs: Date.now() - start,
                timestamp: start,
            });
        }
    },
} as Pick<Pool, "query">;
