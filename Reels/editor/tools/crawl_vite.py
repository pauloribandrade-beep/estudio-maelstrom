import urllib.request, re

base = 'http://localhost:5173'
visited = set()
errors = []

def fetch_deps(url_path):
    if url_path in visited or len(visited) > 200:
        return
    visited.add(url_path)
    url = base + url_path if url_path.startswith('/') else url_path
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            imports = re.findall(r'from\s+["\']([^"\']+)["\']', content)
            imports += re.findall(r'import\s+["\']([^"\']+)["\']', content)
            for imp in imports:
                if imp.startswith('/'):
                    fetch_deps(imp)
                elif imp.startswith('.'):
                    parts = url_path.split('?')[0].split('/')[:-1]
                    for seg in imp.split('/'):
                        if seg == '..':
                            if parts: parts.pop()
                        elif seg != '.':
                            parts.append(seg)
                    resolved = '/'.join(parts)
                    fetch_deps(resolved)
    except urllib.error.HTTPError as e:
        errors.append(f'HTTP {e.code}: {url}')
    except Exception as e:
        errors.append(f'ERRO: {url} -> {e}')

fetch_deps('/estudio/main.tsx')
fetch_deps('/src/lib/edit/registry.tsx')
fetch_deps('/src/videos/2026-10-26_jones-nikolas/Edit.tsx')
fetch_deps('/src/videos/2026-10-26_jones-nikolas/JonesNikolas.tsx')

print('Total modulos testados:', len(visited))
print('Erros encontrados:', len(errors))
for err in errors:
    print(' ', err)
