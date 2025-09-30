import asyncio
import threading

class AsyncRunner:
    def __init__(self):
        self.loop = None
        self.thread = None
        self._setup()
    
    def _setup(self):
        def worker():
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            self.loop.run_forever()
        
        self.thread = threading.Thread(target=worker, daemon=True)
        self.thread.start()
        
        while self.loop is None:
            pass
    
    def run(self, coro):
        if self.loop is None or self.loop.is_closed():
            self._setup()
        
        future = asyncio.run_coroutine_threadsafe(coro, self.loop)
        return future.result(timeout=30)
    
    def __del__(self):
        if self.loop and not self.loop.is_closed():
            self.loop.call_soon_threadsafe(self.loop.stop)

_runner = None

def get_runner():
    global _runner
    if _runner is None:
        _runner = AsyncRunner()
    return _runner

def run_async_safe(coro):
    return get_runner().run(coro)