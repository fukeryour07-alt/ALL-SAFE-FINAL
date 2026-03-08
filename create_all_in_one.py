import base64
import re
import os
import markdown
import sys

def encode_image(match, base_dir):
    alt_text = match.group(1)
    img_path = match.group(2)
    
    # Try resolving path
    abs_path = os.path.join(base_dir, img_path)
    
    if os.path.exists(abs_path):
        with open(abs_path, 'rb') as f:
            b64_data = base64.b64encode(f.read()).decode('utf-8')
        ext = os.path.splitext(abs_path)[1][1:].lower()
        if ext == 'jpg': ext = 'jpeg'
        
        # Return standard markdown image syntax with base64 data URI
        return f"![{alt_text}](data:image/{ext};base64,{b64_data})"
    else:
        print(f"Warning: Image not found {abs_path}")
        return match.group(0) # Unchanged

def main():
    md_file = os.path.join("docs", "flow_diagrams.md")
    html_file = os.path.join("docs", "flow_diagrams_all_in_one.html")
    base_dir = "docs"
    
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
        
    # Replace markdown image links with base64 data URIs
    pattern = r'!\[([^\]]*)\]\((.*?)\)'
    new_md_content = re.sub(pattern, lambda m: encode_image(m, base_dir), md_content)
    
    # Extensions: tables (for the reference table), fenced_code
    html_body = markdown.markdown(new_md_content, extensions=['tables', 'fenced_code'])
    
    # Premium Dark Theme CSS
    css = """
    body {
        background-color: #020617;
        color: #f0f4ff;
        font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, sans-serif;
        line-height: 1.7;
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 20px;
    }
    h1, h2, h3 {
        color: #f0f4ff;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        padding-bottom: 8px;
        margin-top: 40px;
    }
    h1 { color: #00f5ff; }
    h2 { color: #00f5ff; font-size: 1.4em; }
    a { color: #00f5ff; text-decoration: none; }
    blockquote {
        background: rgba(0, 245, 255, 0.05);
        border-left: 4px solid #00f5ff;
        padding: 15px 20px;
        margin: 20px 0;
        border-radius: 0 8px 8px 0;
        color: #cbd5e1;
    }
    img {
        max-width: 100%;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        border: 1px solid rgba(0, 245, 255, 0.15);
        margin: 20px 0;
        display: block;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 30px 0;
        background: rgba(255,255,255,0.02);
        border-radius: 8px;
        overflow: hidden;
    }
    th, td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    th {
        background: rgba(0, 245, 255, 0.1);
        color: #00f5ff;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.85em;
        letter-spacing: 0.05em;
    }
    tr:last-child td { border-bottom: none; }
    code {
        background: rgba(0, 245, 255, 0.08);
        color: #00f5ff;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.9em;
    }
    hr {
        border: 0;
        border-top: 1px solid rgba(255,255,255,0.1);
        margin: 40px 0;
    }
    """
    
    html_doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ALL SAFE 2.0 - Flow Diagrams (All-In-One)</title>
    <style>{css}</style>
</head>
<body>
    {html_body}
</body>
</html>
"""
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_doc)
        
    print(f"Success! Generated standalone HTML file at: {html_file}")

if __name__ == "__main__":
    main()
