#!/usr/bin/env python3
"""
MCP Server with HTTP transport - System Information Tool
This server exposes system information tools via HTTP transport.
"""

import asyncio
import json
import platform
import psutil
import socket
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from fastmcp import settings
from mcp.server.fastmcp import FastMCP

# Create an MCP server with HTTP transport configuration
mcp = FastMCP("SystemInfoServer", stateless_http=True, settings={})

@mcp.tool()
def get_system_info() -> str:
    """
    Get comprehensive system information.
    
    Returns:
        Detailed system information including OS, hardware, and Python details
    """
    try:
        info = {
            "system": {
                "platform": platform.platform(),
                "system": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine(),
                "processor": platform.processor(),
                "architecture": platform.architecture(),
                "hostname": socket.gethostname(),
                "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat()
            },
            "python": {
                "version": sys.version,
                "executable": sys.executable,
                "platform": sys.platform,
                "implementation": platform.python_implementation(),
                "compiler": platform.python_compiler()
            },
            "memory": {
                "total": f"{psutil.virtual_memory().total / (1024**3):.2f} GB",
                "available": f"{psutil.virtual_memory().available / (1024**3):.2f} GB",
                "used": f"{psutil.virtual_memory().used / (1024**3):.2f} GB",
                "percentage": f"{psutil.virtual_memory().percent}%"
            },
            "cpu": {
                "physical_cores": psutil.cpu_count(logical=False),
                "logical_cores": psutil.cpu_count(logical=True),
                "current_frequency": f"{psutil.cpu_freq().current:.2f} MHz" if psutil.cpu_freq() else "N/A",
                "usage_percent": f"{psutil.cpu_percent(interval=1)}%"
            },
            "disk": {
                "total": f"{psutil.disk_usage('/').total / (1024**3):.2f} GB",
                "used": f"{psutil.disk_usage('/').used / (1024**3):.2f} GB",
                "free": f"{psutil.disk_usage('/').free / (1024**3):.2f} GB",
                "percentage": f"{(psutil.disk_usage('/').used / psutil.disk_usage('/').total) * 100:.1f}%"
            }
        }
        
        return json.dumps(info, indent=2)
    except Exception as e:
        return f"Error getting system info: {str(e)}"

@mcp.tool()
def get_running_processes(limit: int = 10) -> str:
    """
    Get information about running processes.
    
    Args:
        limit: Maximum number of processes to return (default: 10)
        
    Returns:
        Information about running processes
    """
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
            try:
                proc_info = proc.info
                proc_info['cpu_percent'] = proc.cpu_percent()
                processes.append(proc_info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        # Sort by CPU usage
        processes.sort(key=lambda x: x.get('cpu_percent', 0), reverse=True)
        
        result = f"Top {limit} processes by CPU usage:\n\n"
        result += f"{'PID':<8} {'Name':<20} {'CPU%':<8} {'Memory%':<10} {'Status':<10}\n"
        result += "-" * 66 + "\n"
        
        for proc in processes[:limit]:
            result += f"{proc['pid']:<8} {proc['name'][:19]:<20} {proc['cpu_percent']:<8.1f} {proc['memory_percent']:<10.1f} {proc['status']:<10}\n"
        
        return result
    except Exception as e:
        return f"Error getting process info: {str(e)}"

@mcp.tool()
def get_network_info() -> str:
    """
    Get network interface information.
    
    Returns:
        Information about network interfaces and connections
    """
    try:
        info = {
            "interfaces": {},
            "connections": {
                "total": len(psutil.net_connections()),
                "listening": len([c for c in psutil.net_connections() if c.status == 'LISTEN']),
                "established": len([c for c in psutil.net_connections() if c.status == 'ESTABLISHED'])
            }
        }
        
        # Get network interface information
        for interface, addrs in psutil.net_if_addrs().items():
            info["interfaces"][interface] = []
            for addr in addrs:
                addr_info = {
                    "family": str(addr.family),
                    "address": addr.address,
                    "netmask": addr.netmask,
                    "broadcast": addr.broadcast
                }
                info["interfaces"][interface].append(addr_info)
        
        # Get network I/O statistics
        net_io = psutil.net_io_counters()
        info["io_stats"] = {
            "bytes_sent": f"{net_io.bytes_sent / (1024**2):.2f} MB",
            "bytes_recv": f"{net_io.bytes_recv / (1024**2):.2f} MB",
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv
        }
        
        return json.dumps(info, indent=2)
    except Exception as e:
        return f"Error getting network info: {str(e)}"

@mcp.tool()
def execute_command(command: str) -> str:
    """
    Execute a system command safely (read-only commands only).
    
    Args:
        command: The command to execute
        
    Returns:
        Command output or error message
    """
    # Whitelist of safe read-only commands
    safe_commands = [
        'ls', 'pwd', 'whoami', 'date', 'uptime', 'df', 'free', 'ps',
        'top', 'htop', 'netstat', 'ifconfig', 'ping', 'traceroute',
        'cat', 'head', 'tail', 'grep', 'find', 'which', 'whereis'
    ]
    
    # Extract the base command
    base_command = command.split()[0] if command.split() else ""
    
    if base_command not in safe_commands:
        return f"Error: Command '{base_command}' is not allowed. Only safe read-only commands are permitted."
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=10  # 10 second timeout
        )
        
        if result.returncode == 0:
            return f"Command: {command}\nOutput:\n{result.stdout}"
        else:
            return f"Command: {command}\nError (exit code {result.returncode}):\n{result.stderr}"
            
    except subprocess.TimeoutExpired:
        return f"Error: Command '{command}' timed out after 10 seconds"
    except Exception as e:
        return f"Error executing command '{command}': {str(e)}"

@mcp.resource("system://info")
def get_system_resource() -> str:
    """
    Get system information as a resource.
    
    Returns:
        Basic system information
    """
    return f"""System Information Resource
Platform: {platform.platform()}
Python: {sys.version.split()[0]}
Hostname: {socket.gethostname()}
Current Time: {datetime.now().isoformat()}
"""

@mcp.resource("system://stats")
def get_system_stats() -> str:
    """
    Get system statistics as a resource.
    
    Returns:
        Current system statistics
    """
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return f"""System Statistics
CPU Usage: {cpu_percent}%
Memory Usage: {memory.percent}% ({memory.used / (1024**3):.1f}GB / {memory.total / (1024**3):.1f}GB)
Disk Usage: {(disk.used / disk.total) * 100:.1f}% ({disk.used / (1024**3):.1f}GB / {disk.total / (1024**3):.1f}GB)
Boot Time: {datetime.fromtimestamp(psutil.boot_time()).strftime('%Y-%m-%d %H:%M:%S')}
"""
    except Exception as e:
        return f"Error getting system stats: {str(e)}"

@mcp.prompt()
def system_analysis_prompt(analysis_type: str = "performance") -> str:
    """
    Generate a prompt for system analysis.
    
    Args:
        analysis_type: Type of analysis (performance, security, maintenance)
        
    Returns:
        A prompt for system analysis
    """
    analysis_prompts = {
        "performance": "Please analyze the current system performance metrics and provide recommendations for optimization. Focus on CPU usage, memory consumption, and disk utilization.",
        "security": "Please review the system information for potential security concerns. Look for unusual processes, network connections, and system configurations.",
        "maintenance": "Please suggest system maintenance tasks based on the current system state. Include recommendations for cleanup, updates, and monitoring."
    }
    
    return analysis_prompts.get(analysis_type, analysis_prompts["performance"])

if __name__ == "__main__":
    # Run the server with streamable HTTP transport
    print("Starting MCP HTTP Server on http://localhost:8000/mcp")
    print("Use Ctrl+C to stop the server")
    mcp.run(transport="streamable-http")
