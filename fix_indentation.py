#!/usr/bin/env python3
"""
Script to remove excessive indentation from all <pre><code> blocks in the HTML file.
"""

import re
import sys

def fix_pre_block_indentation(content):
    """
    Fix indentation in all <pre><code> blocks by removing excessive leading whitespace.
    """
    # Pattern to match <pre><code>...</code></pre> blocks
    pattern = r'(<pre><code[^>]*>)(.*?)(</code></pre>)'
    
    def fix_block(match):
        opening_tag = match.group(1)
        code_content = match.group(2)
        closing_tag = match.group(3)
        
        # Split into lines
        lines = code_content.split('\n')
        
        # Filter out empty lines for indentation calculation
        non_empty_lines = [line for line in lines if line.strip()]
        
        if not non_empty_lines:
            return opening_tag + code_content + closing_tag
        
        # Find minimum indentation (excluding empty lines)
        min_indent = float('inf')
        for line in non_empty_lines:
            if line.strip():  # Skip empty lines
                indent = len(line) - len(line.lstrip())
                min_indent = min(min_indent, indent)
        
        # If no indentation found, return as is
        if min_indent == float('inf'):
            min_indent = 0
        
        # Remove the minimum indentation from all lines
        fixed_lines = []
        for line in lines:
            if line.strip():  # Non-empty line
                fixed_lines.append(line[min_indent:] if len(line) >= min_indent else line)
            else:  # Empty line
                fixed_lines.append('')
        
        fixed_content = '\n'.join(fixed_lines)
        return opening_tag + fixed_content + closing_tag
    
    # Apply the fix to all pre blocks
    return re.sub(pattern, fix_block, content, flags=re.DOTALL)

def main():
    input_file = '/Users/kumarshubham/work/tech-talks/17-july-2025-mcp/index.html'
    
    # Read the file
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the indentation
    fixed_content = fix_pre_block_indentation(content)
    
    # Write back to the file
    with open(input_file, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print("Fixed indentation in all <pre><code> blocks!")

if __name__ == '__main__':
    main()
