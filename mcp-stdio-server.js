#!/usr/bin/env node

/**
 * MCP stdio Server Demo - File Operations
 * Demonstrates an MCP server using stdio transport for local file operations
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class MCPStdioServer {
    constructor() {
        this.capabilities = {
            tools: {},
            resources: {},
            prompts: {},
            logging: {}
        };
        
        this.tools = new Map();
        this.resources = new Map();
        
        this.setupTools();
        this.setupResources();
        this.setupIO();
    }

    setupTools() {
        // File writing tool
        this.tools.set('write_file', {
            name: 'write_file',
            description: 'Write content to a file',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path to the file to write'
                    },
                    content: {
                        type: 'string',
                        description: 'Content to write to the file'
                    }
                },
                required: ['path', 'content']
            }
        });

        // File reading tool
        this.tools.set('read_file', {
            name: 'read_file',
            description: 'Read content from a file',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path to the file to read'
                    }
                },
                required: ['path']
            }
        });

        // List files tool
        this.tools.set('list_files', {
            name: 'list_files',
            description: 'List files in a directory',
            inputSchema: {
                type: 'object',
                properties: {
                    directory: {
                        type: 'string',
                        description: 'Directory path to list files from',
                        default: '.'
                    }
                }
            }
        });

        // Delete file tool
        this.tools.set('delete_file', {
            name: 'delete_file',
            description: 'Delete a file',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path to the file to delete'
                    }
                },
                required: ['path']
            }
        });
    }

    setupResources() {
        // Current directory resource
        this.resources.set('file://current-directory', {
            uri: 'file://current-directory',
            name: 'Current Directory',
            description: 'Files in the current working directory',
            mimeType: 'application/json'
        });
    }

    setupIO() {
        // Handle stdin input
        process.stdin.on('data', (data) => {
            const input = data.toString().trim();
            if (input) {
                try {
                    const request = JSON.parse(input);
                    this.handleRequest(request);
                } catch (error) {
                    this.sendError(null, -32700, 'Parse error', error.message);
                }
            }
        });

        // Handle process termination
        process.on('SIGINT', () => {
            this.log('Server shutting down...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            this.log('Server shutting down...');
            process.exit(0);
        });
    }

    async handleRequest(request) {
        const { jsonrpc, id, method, params } = request;

        if (jsonrpc !== '2.0') {
            return this.sendError(id, -32600, 'Invalid Request', 'Invalid JSON-RPC version');
        }

        try {
            switch (method) {
                case 'initialize':
                    await this.handleInitialize(id, params);
                    break;
                case 'notifications/initialized':
                    // No response needed for notifications
                    break;
                case 'tools/list':
                    await this.handleListTools(id);
                    break;
                case 'tools/call':
                    await this.handleCallTool(id, params);
                    break;
                case 'resources/list':
                    await this.handleListResources(id);
                    break;
                case 'resources/read':
                    await this.handleReadResource(id, params);
                    break;
                default:
                    this.sendError(id, -32601, 'Method not found', `Unknown method: ${method}`);
            }
        } catch (error) {
            this.sendError(id, -32603, 'Internal error', error.message);
        }
    }

    async handleInitialize(id, params) {
        this.log('Initializing MCP stdio server...');
        
        const result = {
            protocolVersion: '2024-11-05',
            capabilities: this.capabilities,
            serverInfo: {
                name: 'mcp-stdio-file-server',
                version: '1.0.0'
            }
        };

        this.sendResponse(id, result);
    }

    async handleListTools(id) {
        const tools = Array.from(this.tools.values());
        this.sendResponse(id, { tools });
    }

    async handleCallTool(id, params) {
        const { name, arguments: args } = params;
        
        if (!this.tools.has(name)) {
            return this.sendError(id, -32602, 'Invalid params', `Unknown tool: ${name}`);
        }

        let result;
        
        try {
            switch (name) {
                case 'write_file':
                    result = await this.writeFile(args.path, args.content);
                    break;
                case 'read_file':
                    result = await this.readFile(args.path);
                    break;
                case 'list_files':
                    result = await this.listFiles(args.directory || '.');
                    break;
                case 'delete_file':
                    result = await this.deleteFile(args.path);
                    break;
                default:
                    throw new Error(`Tool ${name} not implemented`);
            }
            
            this.sendResponse(id, {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            });
        } catch (error) {
            this.sendResponse(id, {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error.message}`
                    }
                ],
                isError: true
            });
        }
    }

    async handleListResources(id) {
        const resources = Array.from(this.resources.values());
        this.sendResponse(id, { resources });
    }

    async handleReadResource(id, params) {
        const { uri } = params;
        
        if (!this.resources.has(uri)) {
            return this.sendError(id, -32602, 'Invalid params', `Unknown resource: ${uri}`);
        }

        try {
            let content;
            
            if (uri === 'file://current-directory') {
                const files = await this.listFiles('.');
                content = JSON.stringify(files, null, 2);
            }
            
            this.sendResponse(id, {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: content
                    }
                ]
            });
        } catch (error) {
            this.sendError(id, -32603, 'Internal error', error.message);
        }
    }

    // File operation implementations
    async writeFile(filePath, content) {
        const fullPath = path.resolve(filePath);
        await fs.writeFile(fullPath, content, 'utf8');
        return {
            success: true,
            message: `File written successfully: ${filePath}`,
            path: fullPath,
            size: content.length
        };
    }

    async readFile(filePath) {
        const fullPath = path.resolve(filePath);
        const content = await fs.readFile(fullPath, 'utf8');
        const stats = await fs.stat(fullPath);
        
        return {
            success: true,
            path: fullPath,
            content,
            size: stats.size,
            modified: stats.mtime
        };
    }

    async listFiles(directory) {
        const fullPath = path.resolve(directory);
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        
        const files = [];
        for (const entry of entries) {
            const entryPath = path.join(fullPath, entry.name);
            const stats = await fs.stat(entryPath);
            
            files.push({
                name: entry.name,
                path: entryPath,
                type: entry.isDirectory() ? 'directory' : 'file',
                size: entry.isFile() ? stats.size : null,
                modified: stats.mtime
            });
        }
        
        return {
            success: true,
            directory: fullPath,
            files
        };
    }

    async deleteFile(filePath) {
        const fullPath = path.resolve(filePath);
        await fs.unlink(fullPath);
        
        return {
            success: true,
            message: `File deleted successfully: ${filePath}`,
            path: fullPath
        };
    }

    // Communication helpers
    sendResponse(id, result) {
        const response = {
            jsonrpc: '2.0',
            id,
            result
        };
        
        process.stdout.write(JSON.stringify(response) + '\n');
    }

    sendError(id, code, message, data = null) {
        const response = {
            jsonrpc: '2.0',
            id,
            error: {
                code,
                message,
                ...(data && { data })
            }
        };
        
        process.stdout.write(JSON.stringify(response) + '\n');
    }

    log(message) {
        // Log to stderr so it doesn't interfere with JSON-RPC communication
        process.stderr.write(`[MCP stdio Server] ${message}\n`);
    }
}

// Start the server
const server = new MCPStdioServer();
server.log('MCP stdio File Server started. Waiting for requests...');
