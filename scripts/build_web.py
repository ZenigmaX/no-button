#!/usr/bin/env python3
"""Post-process `expo export --platform web` output (dist/) into an offline PWA + a single-file HTML."""
import base64, hashlib, json, os, re, subprocess
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'dist')
os.chdir(ROOT)
BASE = json.load(open('app.json'))['expo'].get('experiments', {}).get('baseUrl', '').rstrip('/')  # e.g. /no-button
subprocess.run(['rm', '-rf', 'dist'], check=True)
subprocess.run(['npx', 'expo', 'export', '--platform', 'web'], check=True)

# icons
icon = Image.open('assets/icon.png').convert('RGB')
for n, sz in [('apple-touch-icon.png', 180), ('icon-192.png', 192), ('icon-512.png', 512)]:
    icon.resize((sz, sz), Image.LANCZOS).save(os.path.join(D, n))
mask = Image.new('RGB', (512, 512), (20, 20, 20)); mask.paste(icon.resize((410, 410), Image.LANCZOS), (51, 51))
mask.save(os.path.join(D, 'icon-maskable-512.png'))

manifest = {
    "name": "NO Button", "short_name": "NO Button", "description": "One giant red button. One answer. NO.",
    "start_url": BASE + "/", "scope": BASE + "/", "display": "standalone", "orientation": "portrait",
    "background_color": "#141414", "theme_color": "#d10f0f",
    "icons": [
        {"src": BASE + "/icon-192.png", "sizes": "192x192", "type": "image/png"},
        {"src": BASE + "/icon-512.png", "sizes": "512x512", "type": "image/png"},
        {"src": BASE + "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        {"src": BASE + "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png"}]}
json.dump(manifest, open(os.path.join(D, 'manifest.webmanifest'), 'w'), indent=2)

files = sorted(BASE + '/' + os.path.relpath(os.path.join(r, f), D) for r, _, fs in os.walk(D) for f in fs
               if f not in ('metadata.json',))
files = [f for f in files if f != BASE + '/index.html'] + [BASE + '/']
ver = hashlib.sha1(''.join(files).encode()).hexdigest()[:10]
sw = f"""const CACHE='no-button-{ver}';
const PRECACHE={json.dumps(files)};
self.addEventListener('install',e=>{{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()));}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));}});
self.addEventListener('fetch',e=>{{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url); if(u.origin!==location.origin)return;
  e.respondWith(caches.match(e.request,{{ignoreSearch:true}}).then(r=>r||(e.request.mode==='navigate'?caches.match('{BASE}/'):null)||fetch(e.request).then(res=>{{const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return res;}})));
}});
"""
open(os.path.join(D, 'sw.js'), 'w').write(sw.replace("'sw.js'", ''))

head = """<meta name="theme-color" content="#d10f0f"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="NO Button"/>
<meta name="description" content="One giant red button. One answer. NO."/>
<link rel="manifest" href="BASE/manifest.webmanifest"/>
<link rel="apple-touch-icon" sizes="180x180" href="BASE/apple-touch-icon.png"/>
<link rel="icon" type="image/png" sizes="192x192" href="BASE/icon-192.png"/>
<style>html,body{background:#141414;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation}</style>
""".replace("BASE", BASE)
reg = "<script>if('serviceWorker' in navigator&&location.protocol!=='file:'){addEventListener('load',()=>navigator.serviceWorker.register('"+BASE+"/sw.js',{scope:'"+BASE+"/'}))}</script>"
p = os.path.join(D, 'index.html'); h = open(p).read()
h = h.replace('viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"',
              'viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"')
h = h.replace('</head>', head + '</head>').replace('</body>', reg + '</body>')
open(p, 'w').write(h)

# single-file build
order = re.findall(r"assets/sounds/(\w+)\.mp3", open('App.tsx').read())
sdir = os.path.join(D, 'assets/assets/sounds')
byname = {f.split('.')[0]: f for f in os.listdir(sdir)}
uris = ['data:audio/mpeg;base64,' + base64.b64encode(open(os.path.join(sdir, byname[n]), 'rb').read()).decode() for n in order]
js_src = re.search(r'<script src="([^"]*/_expo/[^"]+)" defer></script>', h).group(1)
js = open(D + js_src[len(BASE):]).read().replace('</script', '<\\/script')
ico = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(D, 'apple-touch-icon.png'), 'rb').read()).decode()
s = h.replace(reg, '')
s = re.sub(r'<link rel="(manifest|icon)"[^>]*/>', '', s)
s = s.replace(f'href="{BASE}/apple-touch-icon.png"', f'href="{ico}"')
s = s.replace(f'<script src="{js_src}" defer></script>',
              '')
s = s.replace('</body>', '<script>window.__NO_SOUNDS__=' + json.dumps(uris) + ';</script>\n<script>\n' + js + '\n</script>\n</body>')
open(os.path.join(ROOT, 'NO-Button.html'), 'w').write(s)
print('ok', len(files), 'precached; single file', os.path.getsize('NO-Button.html'))
