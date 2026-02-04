import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const server = new Server(
    {
        name: "truetrack-local",
        version: "1.0.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

// List Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "postgres://schema",
                name: "Database Schema",
                mimeType: "text/plain",
            }
        ]
    };
});

// Read Resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri === "postgres://schema") {
        const client = await pool.connect();
        try {
            const res = await client.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        ORDER BY table_name, ordinal_position;
      `);

            const schema = res.rows.reduce((acc: any, row: any) => {
                if (!acc[row.table_name]) acc[row.table_name] = [];
                acc[row.table_name].push(`${row.column_name} (${row.data_type})`);
                return acc;
            }, {});

            let schemaStr = "Database Schema (public):\n";
            for (const [table, cols] of Object.entries(schema)) {
                schemaStr += `\nTable: ${table}\n- ${(cols as string[]).join('\n- ')}\n`;
            }

            return {
                contents: [{
                    uri: request.params.uri,
                    mimeType: "text/plain",
                    text: schemaStr
                }]
            };
        } catch (e: any) {
            throw new Error(`DB Error: ${e.message}`);
        } finally {
            client.release();
        }
    }
    throw new Error("Resource not found");
});

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query_db",
                description: "Execute a safe SELECT query against the local database",
                inputSchema: {
                    type: "object",
                    properties: {
                        sql: { type: "string", description: "SQL query (SELECT only)" }
                    },
                    required: ["sql"]
                }
            },
            {
                name: "check_user_usage",
                description: "Check daily usage count for a user",
                inputSchema: {
                    type: "object",
                    properties: {
                        userId: { type: "string", description: "User UUID" }
                    },
                    required: ["userId"]
                }
            }
        ]
    };
});

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "query_db") {
        const { sql } = request.params.arguments as { sql: string };
        if (!sql.trim().toLowerCase().startsWith('select')) {
            return { content: [{ type: "text", text: "Error: Only SELECT queries allowed." }] };
        }
        const client = await pool.connect();
        try {
            const res = await client.query(sql);
            return { content: [{ type: "text", text: JSON.stringify(res.rows, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: `Error: ${e.message}` }] };
        } finally {
            client.release();
        }
    }

    if (request.params.name === "check_user_usage") {
        const { userId } = request.params.arguments as { userId: string };
        const client = await pool.connect();
        try {
            // Assuming table exists from our upcoming migration
            const res = await client.query(`SELECT * FROM user_daily_usage WHERE user_id = $1`, [userId]);
            return { content: [{ type: "text", text: JSON.stringify(res.rows, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: `Error: ${e.message}` }] };
        } finally {
            client.release();
        }
    }

    throw new Error("Tool not found");
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main();
