import os
import re

# Files that still need migration (using old pattern without await)
files_to_fix = [
    "apps/admin/app/api/admin/courses/[courseId]/route.ts",
    "apps/admin/app/api/admin/users/[userId]/route.ts"
]

def fix_route(filepath):
    full_path = f"/mnt/oss/qwen-workspace/repo/{filepath}"
    if not os.path.exists(full_path):
        print(f"⚠️  File not found: {filepath}")
        return False
    
    with open(full_path, 'r') as f:
        content = f.read()

    # Pattern: { params }: { params: { courseId: string } }
    # Convert to: { params }: { params: Promise<{ courseId: string }> }
    # And add: const { courseId } = await params; after the opening brace
    
    # Match function signature with non-Promise params
    pattern = r'(\{ params \}: \{ params: \{ )([^}]+)( \} \}\))'
    
    def replace_with_promise(match):
        prefix = match.group(1)
        param_names = match.group(2).strip()
        suffix = match.group(3)
        return f"{prefix}Promise<{param_names}>{suffix}"
    
    new_content = re.sub(pattern, replace_with_promise, content)
    
    # Now add the await line after the function opening brace
    # Find the function signature end and add await params destructuring
    param_pattern = r'Promise<\{ ([^}]+) \}>'
    param_match = re.search(param_pattern, new_content)
    
    if param_match:
        param_names = param_match.group(1).strip()
        # Replace the closing ) { with ) {\n  const { ... } = await params;
        await_line = f"const {{ {param_names} }} = await params;"
        
        # Find where to insert - after the function signature opening brace
        # Look for pattern: { params }: { params: Promise<{...}> }) {
        insert_pattern = r'(\{ params \}: \{ params: Promise<\{ [^}]+ \}> \}\))\s*\{'
        
        def insert_await_line(match):
            sig = match.group(1)
            return f"{sig}) {{\n  {await_line}"
        
        new_content = re.sub(insert_pattern, insert_await_line, new_content)
    
    if new_content != content:
        with open(full_path, 'w') as f:
            f.write(new_content)
        print(f"✅ Fixed: {filepath}")
        return True
    else:
        if 'await params' in content:
            print(f"✓ Already has await: {filepath}")
            return True
        else:
            print(f"⚠️  No changes made to: {filepath}")
            return False

print("🔧 Fixing remaining files...\n")
fixed_count = 0
for file in files_to_fix:
    if fix_route(file):
        fixed_count += 1

print(f"\n✅ Fixed {fixed_count}/{len(files_to_fix)} files")
