import os
import re

# List of files identified in architecture map
files_to_migrate = [
    "apps/admin/app/api/admin/courses/[courseId]/route.ts",
    "apps/admin/app/api/admin/users/[userId]/route.ts",
    "apps/admin/app/api/books/[bookId]/preview-url/route.ts",
    "apps/admin/app/api/chapters/[chapterId]/route.ts",
    "apps/admin/app/api/topics/[topicId]/preview-url/route.ts",
    "apps/student/app/api/chapters/[chapterId]/topics/route.ts",
    "apps/student/app/api/topics/[topicId]/adjacent/route.ts",
    "apps/student/app/api/topics/[topicId]/quran-words/route.ts",
    "apps/student/app/api/topics/[topicId]/route.ts",
    "apps/student/app/api/progress/chapter/[chapterId]/route.ts",
    "apps/student/app/api/progress/program/[programId]/route.ts",
    "apps/student/app/api/vault/[itemId]/route.ts"
]

def migrate_route(filepath):
    full_path = f"/mnt/oss/qwen-workspace/repo/{filepath}"
    if not os.path.exists(full_path):
        print(f"⚠️  File not found: {filepath}")
        return False
    
    with open(full_path, 'r') as f:
        content = f.read()

    # Pattern 1: export async function GET(request: Request, context: { params: { id } })
    # Convert to: export async function GET(request: Request, { params }: { params: Promise<{ id }> })
    # Then add: const { id } = await params; at the start of function body
    
    # Match the function signature with params in context object
    pattern1 = r'(export async function (?:GET|POST|PUT|DELETE|PATCH)\(request: Request,\s*)context:\s*\{\s*params:\s*\{\s*([^}]+)\s*\}\s*\}\s*\)'
    
    def replace_signature(match):
        prefix = match.group(1)
        param_names = match.group(2).strip()
        return f"{prefix}{{ params }}: {{ params: Promise<{{ {param_names} }}> }})"
    
    new_content = re.sub(pattern1, replace_signature, content)
    
    # Check if we made changes
    if new_content != content:
        # Find the function body start and insert await params line
        # Look for the closing ) of the function signature followed by {
        body_pattern = r'(\{ params \}: \{ params: Promise<\{ [^}]+ \}> \}\))\s*\{'
        
        def insert_await(match):
            sig = match.group(1)
            # Extract param names from the signature
            param_match = re.search(r'Promise<\{ ([^}]+) \}>', sig)
            if param_match:
                param_names = param_match.group(1).strip()
                return f"{sig}) {{\n  const {{ {param_names} }} = await params;"
            return f"{sig}) {{"
        
        new_content = re.sub(body_pattern, insert_await, new_content)
        
        with open(full_path, 'w') as f:
            f.write(new_content)
        print(f"✅ Migrated: {filepath}")
        return True
    else:
        # Check if already migrated (has await params)
        if 'await params' in content:
            print(f"✓ Already migrated: {filepath}")
            return True
        else:
            print(f"⚠️  No params pattern found in: {filepath}")
            return False

migrated_count = 0
not_found_count = 0
already_done_count = 0

print("🚀 Starting Next.js 16.x params migration...\n")

for file in files_to_migrate:
    result = migrate_route(file)
    if result:
        migrated_count += 1

print(f"\n📊 Migration Complete:")
print(f"   Files processed: {migrated_count}/{len(files_to_migrate)}")
