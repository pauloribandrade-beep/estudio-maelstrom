import subprocess, time, urllib.request, json, asyncio, websockets

async def main():
    p = subprocess.Popen([
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        '--headless',
        '--remote-debugging-port=9222',
        'http://localhost:5173/?v=2026-10-26_jones-nikolas'
    ])
    try:
        await asyncio.sleep(2)
        resp = urllib.request.urlopen('http://localhost:9222/json')
        tabs = json.loads(resp.read().decode())
        target = next((t for t in tabs if 'Estúdio' in t.get('title', '') or 'localhost:5173' in t.get('url', '')), None)
        if not target:
            print("Aba não encontrada!")
            return
        ws_url = target['webSocketDebuggerUrl']
        print("Conectando ao websocket:", ws_url)
        async with websockets.connect(ws_url) as ws:
            # Habilitar Runtime e Console
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Console.enable"}))
            await ws.send(json.dumps({"id": 3, "method": "Page.enable"}))

            start_t = time.time()
            while time.time() - start_t < 6:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    data = json.loads(msg)
                    method = data.get("method", "")
                    if method == "Runtime.exceptionThrown":
                        details = data["params"]["exceptionDetails"]
                        print("\n>>> EXCEÇÃO CAPTURADA:")
                        print("Texto:", details.get("text"))
                        exc = details.get("exception", {})
                        print("Descricao:", exc.get("description", exc.get("value")))
                    elif method == "Console.messageAdded":
                        m = data["params"]["message"]
                        if m.get("level") in ("error", "warning"):
                            print(f"[{m.get('level').upper()}] {m.get('text')}")
                except asyncio.TimeoutError:
                    pass
    finally:
        p.kill()

asyncio.run(main())
