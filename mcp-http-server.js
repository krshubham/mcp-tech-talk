#!/usr/bin/env node

/**
 * MCP HTTP Server Demo - Calculator Operations
 * Demonstrates an MCP server using HTTP transport for calculator operations
 */

import express from 'express';
import cors from 'cors';

class MCPHttpServer {
    constructor(port = 3001) {
        this.port = port;
        this.app = express();
        this.clients = new Set();
        
        this.capabilities = {
            tools: {
                listChanged: true
            },
            resources: {
                subscribe: true,
                listChanged: true
            },
            prompts: {},
            logging: {}
        };
        
        this.tools = new Map();
        this.resources = new Map();
        
        this.setupTools();
        this.setupResources();
        this.setupRoutes();
    }

    setupTools() {
        // Addition tool
        this.tools.set('add', {
            name: 'add',
            description: 'Add two numbers',
            inputSchema: {
                type: 'object',
                properties: {
                    a: {
                        type: 'number',
                        description: 'First number'
                    },
                    b: {
                        type: 'number',
                        description: 'Second number'
                    }
                },
                required: ['a', 'b']
            }
        });

        // Subtraction tool
        this.tools.set('subtract', {
            name: 'subtract',
            description: 'Subtract two numbers',
            inputSchema: {
                type: 'object',
                properties: {
                    a: {
                        type: 'number',
                        description: 'First number (minuend)'
                    },
                    b: {
                        type: 'number',
                        description: 'Second number (subtrahend)'
                    }
                },
                required: ['a', 'b']
            }
        });

        // Multiplication tool
        this.tools.set('multiply', {
            name: 'multiply',
            description: 'Multiply two numbers',
            inputSchema: {
                type: 'object',
                properties: {
                    a: {
                        type: 'number',
                        description: 'First number'
                    },
                    b: {
                        type: 'number',
                        description: 'Second number'
                    }
                },
                required: ['a', 'b']
            }
        });

        // Division tool
        this.tools.set('divide', {
            name: 'divide',
            description: 'Divide two numbers',
            inputSchema: {
                type: 'object',
                properties: {
                    a: {
                        type: 'number',
                        description: 'Dividend'
                    },
                    b: {
                        type: 'number',
                        description: 'Divisor'
                    }
                },
                required: ['a', 'b']
            }
        });

        // Power tool
        this.tools.set('power', {
            name: 'power',
            description: 'Raise a number to a power',
            inputSchema: {
                type: 'object',
                properties: {
                    base: {
                        type: 'number',
                        description: 'Base number'
                    },
                    exponent: {
                        type: 'number',
                        description: 'Exponent'
                    }
                },
                required: ['base', 'exponent']
            }
        });

        // Square root tool
        this.tools.set('sqrt', {
            name: 'sqrt',
            description: 'Calculate square root of a number',
            inputSchema: {
                type: 'object',
                properties: {
                    number: {
                        type: 'number',
                        description: 'Number to calculate square root of',
                        minimum: 0
                    }
                },
                required: ['number']
            }
        });
    }

    setupResources() {
        // Calculator history resource
        this.resources.set('calc://history', {
            uri: 'calc://history',
            name: 'Calculator History',
            description: 'History of calculator operations',
            mimeType: 'application/json'
        });

        // Calculator constants resource
        this.resources.set('calc://constants', {
            uri: 'calc://constants',
            name: 'Mathematical Constants',
            description: 'Common mathematical constants',
            mimeType: 'application/json'
        });

        this.history = [];
    }

    setupRoutes() {
        // Middleware
        this.app.use(cors());
        this.app.use(express.json());
        
        // Log all requests
        this.app.use((req, res, next) => {
            console.log(`📨 ${req.method} ${req.path}`, req.body ? JSON.stringify(req.body, null, 2) : '');
            next();
        });

        // Main message endpoint
        this.app.post('/message', async (req, res) => {
            try {
                const response = await this.handleRequest(req.body);
                res.json(response);
            } catch (error) {
                console.error('❌ Error handling request:', error);
                res.status(500).json({
                    jsonrpc: '2.0',
                    id: req.body.id,
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: error.message
                    }
                });
            }
        });

        // Server-Sent Events endpoint for notifications
        this.app.get('/sse', (req, res) => {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });

            // Send initial connection message
            res.write(`data: ${JSON.stringify({
                jsonrpc: '2.0',
                method: 'notifications/message',
                params: {
                    level: 'info',
                    message: 'Connected to MCP HTTP Calculator Server'
                }
            })}\n\n`);

            // Keep connection alive
            const keepAlive = setInterval(() => {
                res.write(`data: ${JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'ping'
                })}\n\n`);
            }, 30000);

            // Clean up on disconnect
            req.on('close', () => {
                clearInterval(keepAlive);
                this.clients.delete(res);
            });

            this.clients.add(res);
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                server: 'MCP HTTP Calculator Server',
                version: '1.0.0',
                uptime: process.uptime()
            });
        });
    }

    async handleRequest(request) {
        const { jsonrpc, id, method, params } = request;

        if (jsonrpc !== '2.0') {
            return this.createError(id, -32600, 'Invalid Request', 'Invalid JSON-RPC version');
        }

        try {
            switch (method) {
                case 'initialize':
                    return await this.handleInitialize(id, params);
                case 'notifications/initialized':
                    // No response needed for notifications
                    return null;
                case 'tools/list':
                    return await this.handleListTools(id);
                case 'tools/call':
                    return await this.handleCallTool(id, params);
                case 'resources/list':
                    return await this.handleListResources(id);
                case 'resources/read':
                    return await this.handleReadResource(id, params);
                default:
                    return this.createError(id, -32601, 'Method not found', `Unknown method: ${method}`);
            }
        } catch (error) {
            return this.createError(id, -32603, 'Internal error', error.message);
        }
    }

    async handleInitialize(id, params) {
        console.log('🚀 Initializing MCP HTTP server...');
        
        return this.createResponse(id, {
            protocolVersion: '2024-11-05',
            capabilities: this.capabilities,
            serverInfo: {
                name: 'mcp-http-calculator-server',
                version: '1.0.0'
            }
        });
    }

    async handleListTools(id) {
        const tools = Array.from(this.tools.values());
        return this.createResponse(id, { tools });
    }

    async handleCallTool(id, params) {
        const { name, arguments: args } = params;
        
        if (!this.tools.has(name)) {
            return this.createError(id, -32602, 'Invalid params', `Unknown tool: ${name}`);
        }

        try {
            let result;
            
            switch (name) {
                case 'add':
                    result = this.add(args.a, args.b);
                    break;
                case 'subtract':
                    result = this.subtract(args.a, args.b);
                    break;
                case 'multiply':
                    result = this.multiply(args.a, args.b);
                    break;
                case 'divide':
                    result = this.divide(args.a, args.b);
                    break;
                case 'power':
                    result = this.power(args.base, args.exponent);
                    break;
                case 'sqrt':
                    result = this.sqrt(args.number);
                    break;
                default:
                    throw new Error(`Tool ${name} not implemented`);
            }
            
            // Add to history
            this.history.push({
                timestamp: new Date().toISOString(),
                operation: name,
                arguments: args,
                result: result.value
            });

            // Notify clients of new calculation
            this.broadcastNotification({
                method: 'notifications/message',
                params: {
                    level: 'info',
                    message: `Calculation performed: ${result.expression} = ${result.value}`
                }
            });
            
            return this.createResponse(id, {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            });
        } catch (error) {
            return this.createResponse(id, {
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
        return this.createResponse(id, { resources });
    }

    async handleReadResource(id, params) {
        const { uri } = params;
        
        if (!this.resources.has(uri)) {
            return this.createError(id, -32602, 'Invalid params', `Unknown resource: ${uri}`);
        }

        try {
            let content;
            
            if (uri === 'calc://history') {
                content = JSON.stringify(this.history, null, 2);
            } else if (uri === 'calc://constants') {
                content = JSON.stringify({
                    pi: Math.PI,
                    e: Math.E,
                    sqrt2: Math.SQRT2,
                    sqrt1_2: Math.SQRT1_2,
                    ln2: Math.LN2,
                    ln10: Math.LN10,
                    log2e: Math.LOG2E,
                    log10e: Math.LOG10E
                }, null, 2);
            }
            
            return this.createResponse(id, {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: content
                    }
                ]
            });
        } catch (error) {
            return this.createError(id, -32603, 'Internal error', error.message);
        }
    }

    // Calculator operations
    add(a, b) {
        const result = a + b;
        return {
            operation: 'addition',
            expression: `${a} + ${b}`,
            value: result
        };
    }

    subtract(a, b) {
        const result = a - b;
        return {
            operation: 'subtraction',
            expression: `${a} - ${b}`,
            value: result
        };
    }

    multiply(a, b) {
        const result = a * b;
        return {
            operation: 'multiplication',
            expression: `${a} × ${b}`,
            value: result
        };
    }

    divide(a, b) {
        if (b === 0) {
            throw new Error('Division by zero is not allowed');
        }
        const result = a / b;
        return {
            operation: 'division',
            expression: `${a} ÷ ${b}`,
            value: result
        };
    }

    power(base, exponent) {
        const result = Math.pow(base, exponent);
        return {
            operation: 'exponentiation',
            expression: `${base}^${exponent}`,
            value: result
        };
    }

    sqrt(number) {
        if (number < 0) {
            throw new Error('Cannot calculate square root of negative number');
        }
        const result = Math.sqrt(number);
        return {
            operation: 'square root',
            expression: `√${number}`,
            value: result
        };
    }

    // Helper methods
    createResponse(id, result) {
        return {
            jsonrpc: '2.0',
            id,
            result
        };
    }

    createError(id, code, message, data = null) {
        return {
            jsonrpc: '2.0',
            id,
            error: {
                code,
                message,
                ...(data && { data })
            }
        };
    }

    broadcastNotification(notification) {
        const message = `data: ${JSON.stringify({
            jsonrpc: '2.0',
            ...notification
        })}\n\n`;
        
        this.clients.forEach(client => {
            try {
                client.write(message);
            } catch (error) {
                console.error('❌ Error broadcasting to client:', error);
                this.clients.delete(client);
            }
        });
    }

    start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`🌐 MCP HTTP Calculator Server running on http://localhost:${this.port}`);
                console.log(`📊 Health check: http://localhost:${this.port}/health`);
                console.log(`📡 SSE endpoint: http://localhost:${this.port}/sse`);
                resolve();
            });
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 MCP HTTP Calculator Server stopped');
        }
    }
}

// Start the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new MCPHttpServer();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        server.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down server...');
        server.stop();
        process.exit(0);
    });

    server.start().catch(console.error);
}

export default MCPHttpServer;
