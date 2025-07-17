# Model Context Protocol Presentation & Demo

A stunning Apple/Jony Ive-inspired presentation on Model Context Protocol with live MCP client and server demonstrations.

## 🎯 What's Included

### 📊 Presentation (`index.html`)
- Beautiful reveal.js presentation with Apple-inspired design
- Explains function calling in LLMs and how MCP advances it
- Accessible terminology for non-LLM experts
- Dynamic backgrounds and smooth animations
- USB-C analogy to explain MCP's role

### 🛠️ MCP Demo Components

1. **MCP Client** (`mcp-client.js`)
   - Connects to both stdio and HTTP MCP servers
   - Demonstrates tool calling and resource access
   - Shows real-time communication

2. **stdio MCP Server** (`mcp-stdio-server.js`)
   - File operations server using stdio transport
   - Tools: write_file, read_file, list_files, delete_file
   - Resources: current directory listing

3. **HTTP MCP Server** (`mcp-http-server.js`)
   - Calculator operations server using HTTP transport
   - Tools: add, subtract, multiply, divide, power, sqrt
   - Resources: calculation history, mathematical constants
   - Server-Sent Events for real-time notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3 (for serving the presentation)

### Installation
```bash
npm install
```

### Running the Presentation
```bash
# Start presentation server
npm run presentation
```
Then open http://localhost:8000 in your browser.

### Running the MCP Demo

#### Option 1: Full Demo (Recommended)
```bash
# Starts HTTP server and runs client demo
npm run demo
```

#### Option 2: Manual Setup
```bash
# Terminal 1: Start HTTP calculator server
npm run http-server

# Terminal 2: Run the demo client
npm start
```

#### Option 3: Development Mode
```bash
# Runs both HTTP server and presentation
npm run dev
```

## 🎨 Presentation Features

### Apple/Jony Ive Design Elements
- **Minimalist Typography**: SF Pro Display font family
- **Elegant Color Palette**: Gradients inspired by Apple's design language
- **Smooth Animations**: Floating elements and slide transitions
- **Glass Morphism**: Backdrop blur effects and translucent cards
- **Progressive Disclosure**: Fragment animations reveal content step by step

### Content Structure
1. **Introduction**: What is MCP?
2. **Function Calling Basics**: From talking to acting
3. **The Problem**: Fragmented AI integrations
4. **USB-C Analogy**: Universal connectivity concept
5. **MCP Architecture**: Clients, protocol, servers
6. **Core Concepts**: Tools, resources, prompts
7. **Transport Methods**: stdio vs HTTP
8. **Benefits**: Interoperability, reusability, security
9. **Live Demo**: Real MCP servers in action
10. **Future Vision**: Connected AI ecosystem

## 🔧 Demo Details

### stdio Server Capabilities
- **File Operations**: Create, read, list, and delete files
- **Local Resources**: Access to current directory
- **Direct Communication**: Process-to-process via stdin/stdout

### HTTP Server Capabilities
- **Calculator Operations**: Basic and advanced math functions
- **Real-time Notifications**: Server-Sent Events for live updates
- **Resource Access**: Calculation history and mathematical constants
- **RESTful API**: Standard HTTP endpoints with JSON-RPC

### Client Features
- **Multi-transport Support**: Connects to both stdio and HTTP servers
- **Tool Discovery**: Lists available tools from each server
- **Resource Access**: Reads resources from connected servers
- **Error Handling**: Graceful handling of connection and execution errors

## 🎯 Key Messages

1. **Function Calling Evolution**: From text-only AI to action-capable AI
2. **Standardization Need**: Eliminate vendor lock-in and integration complexity
3. **MCP Solution**: Universal protocol like USB-C for AI applications
4. **Real-world Impact**: Minutes to integrate vs weeks of custom development
5. **Future Vision**: Connected ecosystem where any AI can use any tool

## 🛡️ Security Considerations

- **Controlled Access**: MCP servers control what tools and resources are exposed
- **Transport Security**: HTTPS for HTTP transport, process isolation for stdio
- **Input Validation**: All tool parameters are validated before execution
- **Error Boundaries**: Graceful error handling prevents system crashes

## 📱 Browser Compatibility

The presentation works best in modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 🎤 Presentation Tips

1. **Start with the Problem**: Explain current AI integration challenges
2. **Use the USB-C Analogy**: Most people understand universal connectors
3. **Show Live Demo**: Nothing beats seeing MCP in action
4. **Emphasize Benefits**: Focus on time savings and flexibility
5. **End with Vision**: Paint the picture of a connected AI future

## 🔍 Troubleshooting

### Common Issues

**Presentation not loading?**
- Ensure Python 3 is installed
- Check if port 8000 is available
- Try a different port: `python3 -m http.server 8080`

**Demo not working?**
- Install dependencies: `npm install`
- Check Node.js version: `node --version` (should be 18+)
- Ensure ports 3001 is available for HTTP server

**stdio server not responding?**
- Check if the process is running
- Look for error messages in stderr
- Ensure file permissions are correct

## 📚 Learn More

- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-06-18)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Reveal.js Documentation](https://revealjs.com)

---

*Created with ❤️ for the AI community*
