#!/usr/bin/env node

/**
 * MCP Client Demo
 * Demonstrates connecting to both stdio and HTTP MCP servers
 */

import { spawn } from 'child_process';
import { EventSource } from 'eventsource';
import fetch from 'node-fetch';

class MCPClient {
    constructor() {
        this.servers = new Map();
        this.requestId = 1;
    }

    // Connect to stdio server
    async connectStdioServer(name, command, args = []) {
        console.log(`🔌 Connecting to stdio server: ${name}`);
        
        const process = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const server = {
            type: 'stdio',
            process,
            name,
            initialized: false
        };

        // Handle server responses
        process.stdout.on('data', (data) => {
            try {
                const messages = data.toString().trim().split('\n');
                messages.forEach(msg => {
                    if (msg.trim()) {
                        const response = JSON.parse(msg);
                        this.handleResponse(name, response);
                    }
                });
            } catch (error) {
                console.error(`❌ Error parsing response from ${name}:`, error);
            }
        });

        process.stderr.on('data', (data) => {
            console.error(`🚨 ${name} stderr:`, data.toString());
        });

        this.servers.set(name, server);

        // Initialize the server
        await this.initializeServer(name);
        return server;
    }

    // Connect to HTTP server
    async connectHttpServer(name, baseUrl) {
        console.log(`🌐 Connecting to HTTP server: ${name}`);
        
        const server = {
            type: 'http',
            baseUrl,
            name,
            initialized: false,
            eventSource: null
        };

        this.servers.set(name, server);

        // Initialize the server
        await this.initializeServer(name);
        
        // Set up Server-Sent Events for notifications
        const eventSource = new EventSource(`${baseUrl}/sse`);
        server.eventSource = eventSource;
        
        eventSource.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);
                this.handleResponse(name, response);
            } catch (error) {
                console.error(`❌ Error parsing SSE from ${name}:`, error);
            }
        };

        return server;
    }

    // Initialize a server with the MCP handshake
    async initializeServer(serverName) {
        const initRequest = {
            jsonrpc: "2.0",
            id: this.requestId++,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {
                    roots: { listChanged: true },
                    sampling: {}
                },
                clientInfo: {
                    name: "mcp-demo-client",
                    version: "1.0.0"
                }
            }
        };

        await this.sendRequest(serverName, initRequest);
        
        // Send initialized notification
        const initializedNotification = {
            jsonrpc: "2.0",
            method: "notifications/initialized"
        };
        
        await this.sendRequest(serverName, initializedNotification);
        
        const server = this.servers.get(serverName);
        server.initialized = true;
        console.log(`✅ ${serverName} initialized successfully`);
    }

    // Send request to a server
    async sendRequest(serverName, request) {
        const server = this.servers.get(serverName);
        if (!server) {
            throw new Error(`Server ${serverName} not found`);
        }

        if (server.type === 'stdio') {
            return new Promise((resolve, reject) => {
                const requestStr = JSON.stringify(request) + '\n';
                server.process.stdin.write(requestStr);
                
                // Store resolve/reject for this request ID
                if (request.id) {
                    server.pendingRequests = server.pendingRequests || new Map();
                    server.pendingRequests.set(request.id, { resolve, reject });
                } else {
                    resolve(); // Notifications don't expect responses
                }
            });
        } else if (server.type === 'http') {
            try {
                const response = await fetch(`${server.baseUrl}/message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error(`❌ HTTP request failed for ${serverName}:`, error);
                throw error;
            }
        }
    }

    // Handle responses from servers
    handleResponse(serverName, response) {
        const server = this.servers.get(serverName);
        
        if (response.id && server.pendingRequests) {
            const pending = server.pendingRequests.get(response.id);
            if (pending) {
                if (response.error) {
                    pending.reject(new Error(response.error.message));
                } else {
                    pending.resolve(response.result);
                }
                server.pendingRequests.delete(response.id);
                return;
            }
        }

        // Handle notifications and other responses
        console.log(`📨 Response from ${serverName}:`, JSON.stringify(response, null, 2));
    }

    // List available tools from a server
    async listTools(serverName) {
        const request = {
            jsonrpc: "2.0",
            id: this.requestId++,
            method: "tools/list"
        };

        try {
            const result = await this.sendRequest(serverName, request);
            console.log(`🛠️  Tools available from ${serverName}:`);
            result.tools.forEach(tool => {
                console.log(`  - ${tool.name}: ${tool.description}`);
            });
            return result.tools;
        } catch (error) {
            console.error(`❌ Failed to list tools from ${serverName}:`, error);
            return [];
        }
    }

    // Call a tool on a server
    async callTool(serverName, toolName, args = {}) {
        const request = {
            jsonrpc: "2.0",
            id: this.requestId++,
            method: "tools/call",
            params: {
                name: toolName,
                arguments: args
            }
        };

        try {
            console.log(`🔧 Calling ${toolName} on ${serverName} with args:`, args);
            const result = await this.sendRequest(serverName, request);
            console.log(`✅ Tool result:`, result);
            return result;
        } catch (error) {
            console.error(`❌ Tool call failed:`, error);
            throw error;
        }
    }

    // List available resources from a server
    async listResources(serverName) {
        const request = {
            jsonrpc: "2.0",
            id: this.requestId++,
            method: "resources/list"
        };

        try {
            const result = await this.sendRequest(serverName, request);
            console.log(`📚 Resources available from ${serverName}:`);
            result.resources.forEach(resource => {
                console.log(`  - ${resource.uri}: ${resource.name}`);
            });
            return result.resources;
        } catch (error) {
            console.error(`❌ Failed to list resources from ${serverName}:`, error);
            return [];
        }
    }

    // Disconnect from all servers
    async disconnect() {
        console.log('🔌 Disconnecting from all servers...');
        
        for (const [name, server] of this.servers) {
            if (server.type === 'stdio' && server.process) {
                server.process.kill();
            } else if (server.type === 'http' && server.eventSource) {
                server.eventSource.close();
            }
        }
        
        this.servers.clear();
        console.log('✅ All servers disconnected');
    }
}

// Demo function
async function runDemo() {
    const client = new MCPClient();
    
    try {
        console.log('🚀 Starting MCP Client Demo\n');

        // Connect to stdio server (file operations)
        await client.connectStdioServer('file-server', 'node', ['mcp-stdio-server.js']);
        
        // Connect to HTTP server (calculator)
        await client.connectHttpServer('calc-server', 'http://localhost:3001');

        // Wait a moment for connections to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('\n📋 Listing tools from both servers...\n');
        
        // List tools from both servers
        await client.listTools('file-server');
        await client.listTools('calc-server');

        console.log('\n🧮 Testing calculator server...\n');
        
        // Test calculator
        await client.callTool('calc-server', 'add', { a: 15, b: 27 });
        await client.callTool('calc-server', 'multiply', { a: 8, b: 7 });

        console.log('\n📁 Testing file server...\n');
        
        // Test file operations
        await client.callTool('file-server', 'write_file', { 
            path: 'demo.txt', 
            content: 'Hello from MCP!' 
        });
        
        await client.callTool('file-server', 'read_file', { path: 'demo.txt' });

        console.log('\n📚 Listing resources...\n');
        
        // List resources
        await client.listResources('file-server');

        console.log('\n✨ Demo completed successfully!');

    } catch (error) {
        console.error('❌ Demo failed:', error);
    } finally {
        // Clean up
        setTimeout(async () => {
            await client.disconnect();
            process.exit(0);
        }, 2000);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    process.exit(0);
});

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runDemo().catch(console.error);
}

export default MCPClient;
