# Python MCP Servers

This directory contains two Python MCP (Model Context Protocol) servers demonstrating different transport mechanisms:

## 🔧 STDIO Server (`mcp_stdio_server.py`)

A file operations server using **stdio transport** (Standard Input/Output).

### Features
- **Tools:**
  - `read_file(file_path)` - Read file contents
  - `write_file(file_path, content)` - Write content to file
  - `list_directory(directory_path)` - List directory contents

- **Resources:**
  - `file://{file_path}` - Access file contents as a resource

- **Prompts:**
  - `file_analysis_prompt(file_path, analysis_type)` - Generate file analysis prompts

### Usage
```bash
# Direct execution
python mcp_stdio_server.py

# With MCP Inspector
mcp dev mcp_stdio_server.py

# With Claude Desktop (add to config)
{
  "mcpServers": {
    "file-operations": {
      "command": "python",
      "args": ["/path/to/mcp_stdio_server.py"]
    }
  }
}
```

## 🌐 HTTP Server (`mcp_http_server.py`)

A system information server using **streamable HTTP transport**.

### Features
- **Tools:**
  - `get_system_info()` - Comprehensive system information
  - `get_running_processes(limit)` - Running process information
  - `get_network_info()` - Network interface information
  - `execute_command(command)` - Safe command execution (read-only commands)

- **Resources:**
  - `system://info` - Basic system information
  - `system://stats` - Current system statistics

- **Prompts:**
  - `system_analysis_prompt(analysis_type)` - Generate system analysis prompts

### Usage
```bash
# Start the server
python mcp_http_server.py
# Server runs on http://localhost:8000/mcp

# Test with curl
curl -X POST http://localhost:8000/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# With MCP Inspector
mcp dev mcp_http_server.py
```

## 📦 Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Test both servers:
```bash
python test_servers.py
```

## 🔍 Key Differences

| Feature | STDIO Server | HTTP Server |
|---------|--------------|-------------|
| **Transport** | Standard I/O | HTTP POST/SSE |
| **Use Case** | Local file operations | System monitoring |
| **Scalability** | Single process | Multi-client support |
| **State** | Stateless | Configurable (stateful/stateless) |
| **Deployment** | Command-line tools | Web services |

## 🚀 Transport Details

### STDIO Transport
- **Communication:** Standard input/output streams
- **Best for:** Local integrations, command-line tools, shell scripts
- **Connection:** Direct process communication
- **State:** Process-bound

### HTTP Transport (Streamable)
- **Communication:** HTTP POST requests + Server-Sent Events
- **Best for:** Web integrations, multi-client scenarios, scalable deployments
- **Connection:** HTTP-based with session management
- **State:** Configurable (stateful with sessions or stateless)

## 🛠️ Development

Both servers use the **FastMCP** framework from the official MCP Python SDK, which provides:

- Decorator-based tool, resource, and prompt definitions
- Automatic JSON-RPC handling
- Built-in transport support
- Type safety and validation
- Easy integration with Claude Desktop and other MCP clients

## 🔐 Security

- **STDIO Server:** File operations are restricted to the server's working directory context
- **HTTP Server:** Command execution is limited to a whitelist of safe, read-only commands
- Both servers include proper error handling and input validation

## 📚 References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-06-18/server/index)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [FastMCP Documentation](https://github.com/modelcontextprotocol/python-sdk#quickstart)
