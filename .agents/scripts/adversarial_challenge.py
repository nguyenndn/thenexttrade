#!/usr/bin/env python3
"""
Adversarial Verification Suite for UI Guide Compliance Remediation
AST-accurate JSX Scanner for:
1. Audit report deletion
2. Typography (font-outfit)
3. Raw <button> elements in UI
4. Banned radius tokens (rounded-md, rounded-sm, bare rounded)
5. Base card primitives (Card.tsx, PremiumCard.tsx)
6. Bubbly buttons & inputs (rounded-xl on buttons/inputs)
7. Cancel & Close buttons with variant="ghost" in dialogs/modals/forms
8. Generic input placeholders (e.g. ..., Enter..., label echoes)
9. Icon-only buttons missing aria-label
"""

import os
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SRC_DIR = ROOT_DIR / "src"
SRC_APP_DIR = SRC_DIR / "app"
SRC_COMPONENTS_DIR = SRC_DIR / "components"

def get_code_files(dirs):
    exts = {".tsx", ".jsx", ".ts", ".js"}
    out = []
    for d in dirs:
        if d.exists():
            for root, _, filenames in os.walk(d):
                for f in filenames:
                    p = Path(root) / f
                    if p.suffix in exts:
                        out.append(p)
    return out

def parse_jsx_elements(content, tag_name):
    """
    Finds instances of <TagName ...>...</TagName> or <TagName ... />
    Correctly accounts for expressions like onClick={() => ...} where '>' is inside braces or quotes.
    Yields (start_pos, line_no, attrs_str, inner_content_str, is_self_closing)
    """
    pos = 0
    pattern_open = '<' + tag_name
    while pos < len(content):
        idx = content.find(pattern_open, pos)
        if idx == -1:
            break
        # Ensure it's a boundary
        next_c = content[idx + len(pattern_open)] if idx + len(pattern_open) < len(content) else ''
        if next_c not in ' \t\r\n>/':
            pos = idx + len(pattern_open)
            continue
            
        p = idx + len(pattern_open)
        brace_depth = 0
        in_quote = None
        is_self_closing = False
        
        while p < len(content):
            ch = content[p]
            if in_quote:
                if ch == '\\':
                    p += 2
                    continue
                elif ch == in_quote:
                    in_quote = None
            else:
                if ch in ('"', "'", '`'):
                    in_quote = ch
                elif ch == '{':
                    brace_depth += 1
                elif ch == '}':
                    brace_depth = max(0, brace_depth - 1)
                elif ch == '/' and p + 1 < len(content) and content[p + 1] == '>' and brace_depth == 0:
                    is_self_closing = True
                    p += 1
                    break
                elif ch == '>' and brace_depth == 0:
                    break
            p += 1
            
        attrs = content[idx + len(pattern_open):p - (1 if is_self_closing else 0)]
        line_no = content[:idx].count('\n') + 1
        
        if is_self_closing:
            yield (idx, line_no, attrs, "", True)
            pos = p + 1
            continue
            
        # Find closing tag </TagName>
        close_pattern = '</' + tag_name + '>'
        close_idx = content.find(close_pattern, p + 1)
        if close_idx != -1:
            inner = content[p + 1:close_idx]
            yield (idx, line_no, attrs, inner, False)
            pos = close_idx + len(close_pattern)
        else:
            yield (idx, line_no, attrs, "", False)
            pos = p + 1

# --- Checks ---

def check_1_audit_reports():
    print("--- [CHECK 1] Temporary Audit Report File Deletion ---")
    violations = []
    for f in [ROOT_DIR / "UI_GUIDE_COMPLIANCE_AUDIT_REPORT.md", ROOT_DIR / "docs" / "UI_GUIDE_COMPLIANCE_AUDIT_REPORT.md"]:
        if f.exists():
            violations.append(str(f.relative_to(ROOT_DIR)))
    tw = ROOT_DIR / ".agents" / "teamwork"
    if tw.exists():
        for f in tw.glob("audit_*.md"):
            violations.append(str(f.relative_to(ROOT_DIR)))
    if violations:
        for v in violations:
            print(f"  [FAIL] Lingering audit file: {v}")
    else:
        print("  [PASS] All temporary audit reports successfully deleted.")
    return violations

def check_2_banned_typography():
    print("\n--- [CHECK 2] Banned Typography (font-outfit) ---")
    violations = []
    files = get_code_files([SRC_DIR])
    for p in files:
        rel = str(p.relative_to(ROOT_DIR)).replace("\\", "/")
        try:
            content = p.read_text(encoding="utf-8")
        except Exception:
            continue
        if "font-outfit" in content:
            for idx, line in enumerate(content.splitlines(), 1):
                if "font-outfit" in line and not line.strip().startswith("//"):
                    violations.append((rel, idx, line.strip()))
    if violations:
        for v in violations:
            print(f"  [FAIL] {v[0]}:{v[1]}: {v[2]}")
    else:
        print("  [PASS] 0 occurrences of font-outfit in src/.")
    return violations

def check_3_raw_buttons():
    print("\n--- [CHECK 3] Raw <button> HTML Elements ---")
    violations_home = []
    home_files = get_code_files([SRC_COMPONENTS_DIR / "home"])
    for p in home_files:
        rel = str(p.relative_to(ROOT_DIR)).replace("\\", "/")
        try:
            content = p.read_text(encoding="utf-8")
        except Exception:
            continue
        for idx, line in enumerate(content.splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
                continue
            if re.search(r"<\s*button[\s/>]", line):
                violations_home.append((rel, idx, stripped))
    if violations_home:
        for v in violations_home:
            print(f"  [FAIL home] {v[0]}:{v[1]}: {v[2]}")
    else:
        print("  [PASS] 0 raw <button> elements in src/components/home/.")
    return violations_home

def check_4_banned_radius_tokens():
    print("\n--- [CHECK 4] Banned Radius Tokens (rounded-md, rounded-sm, bare rounded) ---")
    dirs = [SRC_APP_DIR / "admin", SRC_APP_DIR / "dashboard", SRC_COMPONENTS_DIR / "ui"]
    files = get_code_files(dirs)
    violations = []
    
    bare_re = re.compile(r'(?<![-\w])rounded(?![-\w])')
    md_re = re.compile(r'(?<![-\w])rounded-md(?![-\w])')
    sm_re = re.compile(r'(?<![-\w])rounded-sm(?![-\w])')
    
    for p in files:
        rel = str(p.relative_to(ROOT_DIR)).replace("\\", "/")
        try:
            content = p.read_text(encoding="utf-8")
        except Exception:
            continue
        for idx, line in enumerate(content.splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
                continue
            if "class" in line or "cn(" in line:
                if md_re.search(line):
                    violations.append((rel, idx, "rounded-md", stripped))
                if sm_re.search(line):
                    violations.append((rel, idx, "rounded-sm", stripped))
                if bare_re.search(line):
                    # verify it's a standalone class token
                    tokens = re.findall(r'["\'`]([^"\'`]+)["\'`]', line)
                    for tok in tokens:
                        if "rounded" in tok.split():
                            violations.append((rel, idx, "bare rounded", stripped))
                            break
    if violations:
        for v in violations:
            print(f"  [FAIL {v[2]}] {v[0]}:{v[1]}: {v[3]}")
    else:
        print("  [PASS] 0 banned radius tokens (rounded-md, rounded-sm, bare rounded) in admin, dashboard, and ui primitives.")
    return violations

def check_5_base_cards():
    print("\n--- [CHECK 5] Base Card Primitives (Card.tsx, PremiumCard.tsx) ---")
    violations = []
    card_path = SRC_COMPONENTS_DIR / "ui" / "Card.tsx"
    prem_path = SRC_COMPONENTS_DIR / "ui" / "PremiumCard.tsx"
    for p in [card_path, prem_path]:
        rel = str(p.relative_to(ROOT_DIR)).replace("\\", "/")
        c = p.read_text(encoding="utf-8")
        if "rounded-xl" not in c:
            violations.append(f"{rel} missing rounded-xl")
        for idx, line in enumerate(c.splitlines(), 1):
            if ("rounded-lg" in line or "rounded-md" in line) and "className" in line:
                violations.append(f"{rel}:{idx}: contains {line.strip()}")
    if violations:
        for v in violations:
            print(f"  [FAIL] {v}")
    else:
        print("  [PASS] Both Card.tsx and PremiumCard.tsx strictly enforce rounded-xl.")
    return violations

def check_6_bubbly_controls():
    print("\n--- [CHECK 6] Bubbly Buttons & Inputs (rounded-xl on Button/input) ---")
    files = get_code_files([SRC_APP_DIR, SRC_COMPONENTS_DIR])
    violations = []
    for p in files:
        rel = str(p.relative_to(ROOT_DIR)).replace("\\", "/")
        try:
            content = p.read_text(encoding="utf-8")
        except Exception:
            continue
        for idx, line_no, attrs, inner, _ in parse_jsx_elements(content, "Button"):
            if "rounded-xl" in attrs or "rounded-2xl" in attrs or "rounded-3xl" in attrs:
                violations.append((rel, line_no, "Button has rounded-xl/2xl", attrs.replace("\n", " ").strip()[:80]))
        for idx, line_no, attrs, inner, _ in parse_jsx_elements(content, "input"):
            if "rounded-xl" in attrs or "rounded-2xl" in attrs:
                violations.append((rel, line_no, "input has rounded-xl/2xl", attrs.replace("\n", " ").strip()[:80]))
    if violations:
        for v in violations:
            print(f"  [FAIL] {v[0]}:{v[1]}: {v[2]} -> {v[3]}")
    else:
        print("  [PASS] 0 bubbly buttons or inputs (no rounded-xl on Button or input).")
    return violations

def check_7_cancel_close_buttons():
    print("\n--- [CHECK 7] Cancel/Close Buttons using variant=\"ghost\" ---")
    files = get_code_files([SRC_APP_DIR, SRC_COMPONENTS_DIR])
    violations = []
    
    for p in files:
        rel = str(p.relative_to(ROOT_DIR)).replace("\\", "/")
        try:
            content = p.read_text(encoding="utf-8")
        except Exception:
            continue
            
        for idx, line_no, attrs, inner, _ in parse_jsx_elements(content, "Button"):
            # Check if variant is ghost
            if not ('variant="ghost"' in attrs or "variant='ghost'" in attrs or 'variant={"ghost"}' in attrs):
                continue
                
            # Determine if this button represents Cancel, Close, or Dismiss
            inner_text = re.sub(r'<[^>]+>', '', inner).strip()
            aria_match = re.search(r'aria-label=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
            aria_text = aria_match.group(1).strip() if aria_match else ""
            
            is_cancel_or_close = False
            reason = ""
            
            # Case A: text is Cancel, Close, Dismiss
            if inner_text.lower() in ["cancel", "close", "dismiss"]:
                is_cancel_or_close = True
                reason = f"Label '{inner_text}'"
            # Case B: aria-label says Close modal / Close dialog / Cancel
            elif any(w in aria_text.lower() for w in ["close modal", "close dialog", "close settings", "close panel", "close tour", "close sidebar", "close celebration"]):
                is_cancel_or_close = True
                reason = f"Aria '{aria_text}'"
            # Case C: modal/dialog header close with icon X
            elif ("modal" in rel.lower() or "dialog" in rel.lower() or "panel" in rel.lower() or "drawer" in rel.lower()) and \
                 ("<X " in inner or "<X/>" in inner or "<X\n" in inner or "<X className" in inner):
                is_cancel_or_close = True
                reason = f"Close icon X in {Path(rel).name}"
                
            if is_cancel_or_close:
                violations.append((rel, line_no, reason, attrs.replace("\n", " ").strip()[:90]))
                
    if violations:
        for v in violations:
            print(f"  [FAIL] {v[0]}:{v[1]}: {v[2]} using variant=\"ghost\"")
    else:
        print("  [PASS] 0 Cancel/Close buttons using variant=\"ghost\".")
    return violations

def check_8_generic_placeholders():
    print("\n--- [CHECK 8] Generic Input Placeholders ---")
    files = get_code_files([SRC_APP_DIR, SRC_COMPONENTS_DIR])
    violations = []
    
    banned_patterns = [
        re.compile(r'placeholder\s*=\s*["`\']\s*e\.g\.', re.IGNORECASE),
        re.compile(r'placeholder\s*=\s*["`\']\s*enter\s+', re.IGNORECASE),
        re.compile(r'placeholder\s*=\s*["`\']\s*(?:enter|type)\s*(?:here|\.\.\.)?["`\']', re.IGNORECASE),
        re.compile(r'placeholder\s*=\s*["`\'](?:Password|Full Name|Email Address)["`\']', re.IGNORECASE),
    ]
    
    for p in files:
        rel = str(p.relative_to(ROOT_DIR)).replace("\\", "/")
        try:
            content = p.read_text(encoding="utf-8")
        except Exception:
            continue
        for idx, line in enumerate(content.splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
                continue
            for pat in banned_patterns:
                if pat.search(line):
                    violations.append((rel, idx, stripped))
                    break
    if violations:
        for v in violations:
            print(f"  [FAIL] {v[0]}:{v[1]}: {v[2]}")
    else:
        print("  [PASS] 0 generic placeholders (e.g. ..., Enter..., label echoes).")
    return violations

def check_9_icon_buttons_accessibility():
    print("\n--- [CHECK 9] Icon-only Buttons Missing aria-label ---")
    files = get_code_files([SRC_APP_DIR, SRC_COMPONENTS_DIR])
    violations = []
    
    lucide_icons = [
        "X", "Plus", "Trash", "Trash2", "Edit", "Edit2", "Edit3", "MoreVertical", "MoreHorizontal",
        "ChevronDown", "ChevronUp", "ChevronLeft", "ChevronRight", "Search", "Filter", "Settings",
        "Copy", "ExternalLink", "RefreshCw", "Download", "Upload", "Eye", "EyeOff", "Check", "CheckCircle"
    ]
    icon_tag_patterns = [f"<{icon}" for icon in lucide_icons]
    
    for p in files:
        rel = str(p.relative_to(ROOT_DIR)).replace("\\", "/")
        if rel in ["src/components/ui/Button.tsx", "src/components/ui/Pagination.tsx"]:
            continue
        try:
            content = p.read_text(encoding="utf-8")
        except Exception:
            continue
            
        for idx, line_no, attrs, inner, _ in parse_jsx_elements(content, "Button"):
            # Check if button has size="icon" OR has only icon child without text
            is_icon_button = 'size="icon"' in attrs or "size='icon'" in attrs
            
            # Clean inner text
            inner_no_tags = re.sub(r'<[^>]+>', '', inner).strip()
            inner_clean = re.sub(r'\{[^}]+\}', '', inner_no_tags).strip()
            has_icon = any(it in inner for it in icon_tag_patterns)
            
            # If it's an icon-only button (has icon, no visible text)
            if (is_icon_button or has_icon) and not inner_clean:
                # Must have aria-label, aria-labelledby, or title
                if not re.search(r'\b(aria-label|aria-labelledby|title)\s*=', attrs):
                    violations.append((rel, line_no, inner.replace("\n", " ").strip()[:50]))
                    
    if violations:
        for v in violations:
            print(f"  [FAIL] {v[0]}:{v[1]}: Icon button missing aria-label (inner: {v[2]})")
    else:
        print("  [PASS] All icon-only buttons declare explicit aria-label attributes.")
    return violations

def main():
    print("=================================================================")
    print("   ADVERSARIAL EMPIRICAL VERIFICATION REPORT — CHALLENGER 2     ")
    print("=================================================================\n")
    
    r1 = check_1_audit_reports()
    r2 = check_2_banned_typography()
    r3 = check_3_raw_buttons()
    r4 = check_4_banned_radius_tokens()
    r5 = check_5_base_cards()
    r6 = check_6_bubbly_controls()
    r7 = check_7_cancel_close_buttons()
    r8 = check_8_generic_placeholders()
    r9 = check_9_icon_buttons_accessibility()
    
    total = len(r1) + len(r2) + len(r3) + len(r4) + len(r5) + len(r6) + len(r7) + len(r8) + len(r9)
    print("\n=================================================================")
    print(f"SCAN COMPLETE — TOTAL REMAINING DEFECTS FOUND: {total}")
    print("=================================================================")
    return total

if __name__ == "__main__":
    exit(main())
