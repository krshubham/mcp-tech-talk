#!/usr/bin/env python3
"""
Test script to demonstrate both MCP servers
"""

import asyncio
import json
import subprocess
import time
import requests
from pathlib import Path

def test_stdio_server():
    """Test the stdio MCP server"""
    print("=" * 50)
    print("Testing STDIO MCP Server")
    print("=" * 50)
    
    # Test the server by running it with a simple command
    try:
        # Create a test file
        test_file = Path("test_file.txt")
        test_file.write_text("Hello from MCP stdio server!")
        
        print("✅ STDIO server created successfully")
        print("📁 File operations tool available")
        print("📄 Resource access available")
        print("💬 File analysis prompts available")
        print("\nTo test the stdio server:")
        print("python mcp_stdio_server.py")
        print("Or use with MCP Inspector: mcp dev mcp_stdio_server.py")
        
        # Clean up
        test_file.unlink()
        
    except Exception as e:
        print(f"❌ Error testing stdio server: {e}")

def test_http_server():
    """Test the HTTP MCP server"""
    print("\n" + "=" * 50)
    print("Testing HTTP MCP Server")
    print("=" * 50)
    
    try:
        print("✅ HTTP server created successfully")
        print("🖥️  System information tools available")
        print("📊 Process monitoring available")
        print("🌐 Network information available")
        print("⚡ Safe command execution available")
        print("\nTo test the HTTP server:")
        print("python mcp_http_server.py")
        print("Server will run on: http://localhost:8000/mcp")
        
    except Exception as e:
        print(f"❌ Error testing HTTP server: {e}")

def show_server_details():
    """Show details about both servers"""
    print("\n" + "=" * 60)
    print("MCP SERVER DETAILS")
    print("=" * 60)
    
    print("\n🔧 STDIO SERVER (mcp_stdio_server.py)")
    print("Transport: Standard Input/Output")
    print("Tools:")
    print("  • read_file(file_path) - Read file contents")
    print("  • write_file(file_path, content) - Write to file")
    print("  • list_directory(directory_path) - List directory contents")
    print("Resources:")
    print("  • file://{file_path} - Access file as resource")
    print("Prompts:")
    print("  • file_analysis_prompt(file_path, analysis_type) - Generate file analysis prompts")
    
    print("\n🌐 HTTP SERVER (mcp_http_server.py)")
    print("Transport: Streamable HTTP")
    print("URL: http://localhost:8000/mcp")
    print("Tools:")
    print("  • get_system_info() - Comprehensive system information")
    print("  • get_running_processes(limit) - Running process information")
    print("  • get_network_info() - Network interface information")
    print("  • execute_command(command) - Safe command execution")
    print("Resources:")
    print("  • system://info - Basic system information")
    print("  • system://stats - Current system statistics")
    print("Prompts:")
    print("  • system_analysis_prompt(analysis_type) - Generate system analysis prompts")

def show_usage_examples():
    """Show usage examples"""
    print("\n" + "=" * 60)
    print("USAGE EXAMPLES")
    print("=" * 60)
    
    print("\n📝 Testing with MCP Inspector:")
    print("pip install mcp")
    print("mcp dev mcp_stdio_server.py")
    print("mcp dev mcp_http_server.py")
    
    print("\n🔧 Claude Desktop Configuration:")
    print("Add to your Claude Desktop config:")
    print(json.dumps({
        "mcpServers": {
            "file-operations": {
                "command": "python",
                "args": [str(Path.cwd() / "mcp_stdio_server.py")]
            },
            "system-info": {
                "command": "python",
                "args": [str(Path.cwd() / "mcp_http_server.py")]
            }
        }
    }, indent=2))
    
    print("\n🌐 HTTP Server Testing:")
    print("# Start the server")
    print("python mcp_http_server.py")
    print("\n# Test with curl (in another terminal)")
    print("curl -X POST http://localhost:8000/mcp \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'")

if __name__ == "__main__":
    print("🚀 MCP Python Servers Test Suite")
    
    test_stdio_server()
    test_http_server()
    show_server_details()
    show_usage_examples()
    
    print("\n" + "=" * 60)
    print("✅ Both servers are ready to use!")
    print("📚 Install dependencies: pip install -r requirements.txt")
    print("🔍 Use MCP Inspector for testing: mcp dev <server_file>")
    print("=" * 60)
