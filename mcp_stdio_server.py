#!/usr/bin/env python3
"""
MCP Server with stdio transport - File Operations Tool
This server exposes a file operations tool that can read, write, and list files.
"""

from pathlib import Path

from fastmcp import FastMCP

# Create an MCP server
mcp = FastMCP("FileOperationsServer")

@mcp.tool()
def read_file(file_path: str) -> str:
    """
    Read the contents of a file.
    
    Args:
        file_path: Path to the file to read
        
    Returns:
        The contents of the file as a string
    """
    try:
        path = Path(file_path)
        if not path.exists():
            return f"Error: File '{file_path}' does not exist"
        
        if not path.is_file():
            return f"Error: '{file_path}' is not a file"
            
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        return f"Contents of '{file_path}':\n{content}"
    except Exception as e:
        return f"Error reading file '{file_path}': {str(e)}"

@mcp.tool()
def write_file(file_path: str, content: str) -> str:
    """
    Write content to a file.
    
    Args:
        file_path: Path to the file to write
        content: Content to write to the file
        
    Returns:
        Success or error message
    """
    try:
        path = Path(file_path)
        
        # Create parent directories if they don't exist
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        return f"Successfully wrote {len(content)} characters to '{file_path}'"
    except Exception as e:
        return f"Error writing to file '{file_path}': {str(e)}"

@mcp.tool()
def list_directory(directory_path: str = ".") -> str:
    """
    List the contents of a directory.
    
    Args:
        directory_path: Path to the directory to list (defaults to current directory)
        
    Returns:
        A formatted list of directory contents
    """
    try:
        path = Path(directory_path)
        if not path.exists():
            return f"Error: Directory '{directory_path}' does not exist"
        
        if not path.is_dir():
            return f"Error: '{directory_path}' is not a directory"
            
        items = []
        for item in sorted(path.iterdir()):
            if item.is_dir():
                items.append(f"📁 {item.name}/")
            else:
                size = item.stat().st_size
                items.append(f"📄 {item.name} ({size} bytes)")
                
        if not items:
            return f"Directory '{directory_path}' is empty"
            
        return f"Contents of '{directory_path}':\n" + "\n".join(items)
    except Exception as e:
        return f"Error listing directory '{directory_path}': {str(e)}"

@mcp.resource("file://{file_path}")
def get_file_resource(file_path: str) -> str:
    """
    Get file contents as a resource.
    
    Args:
        file_path: Path to the file
        
    Returns:
        File contents
    """
    try:
        path = Path(file_path)
        if not path.exists() or not path.is_file():
            return f"File '{file_path}' not found or is not a file"
            
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

@mcp.prompt()
def file_analysis_prompt(file_path: str, analysis_type: str = "summary") -> str:
    """
    Generate a prompt for analyzing a file.
    
    Args:
        file_path: Path to the file to analyze
        analysis_type: Type of analysis (summary, code_review, documentation)
        
    Returns:
        A prompt for file analysis
    """
    analysis_prompts = {
        "summary": f"Please provide a concise summary of the file '{file_path}'. Include the main purpose, key components, and any notable features.",
        "code_review": f"Please perform a code review of the file '{file_path}'. Look for potential issues, improvements, and best practices.",
        "documentation": f"Please generate documentation for the file '{file_path}'. Include function descriptions, usage examples, and any important notes."
    }
    
    return analysis_prompts.get(analysis_type, analysis_prompts["summary"])

if __name__ == "__main__":
    # Run the server with stdio transport (default)
    mcp.run()
