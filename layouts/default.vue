<template>
  <div class="app-shell">
    <header class="topbar">
      <NuxtLink to="/" class="brand">
        <span class="brand-mark">🤖</span>
        <span class="brand-text">PostAgent</span>
      </NuxtLink>
      <nav class="nav">
        <NuxtLink to="/" class="nav-link">Home</NuxtLink>
        <NuxtLink to="/feed" class="nav-link">Feed</NuxtLink>
      </nav>
    </header>
    <main class="content">
      <slot />
    </main>
    <footer class="footer">
      <span>PostAgent — AI Social Scheduler</span>
      <span class="footer-dot" />
      <span>Powered by local Ollama</span>
    </footer>
  </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #080d1a;
  --panel: #0f1629;
  --panel2: #1a2540;
  --panel3: #243056;
  --accent: #10b981;
  --accent2: #22d3ee;
  --accent3: #a78bfa;
  --fg: #f1f5f9;
  --sub: #8896b3;
  --border: #1e2d4a;
  --border-light: #2a3a5c;
}
body {
  background: var(--bg);
  color: var(--fg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
body::before {
  content: '';
  position: fixed; inset: 0;
  background:
    radial-gradient(900px 500px at 85% -5%, rgba(16,185,129,.08) 0%, transparent 60%),
    radial-gradient(700px 400px at 10% 100%, rgba(34,211,238,.06) 0%, transparent 50%),
    radial-gradient(600px 600px at 50% 50%, rgba(167,139,250,.04) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
.app-shell { max-width: 1140px; margin: 0 auto; padding: 20px 20px 40px; position: relative; z-index: 1; }

/* Topbar */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 22px; margin-bottom: 24px;
  background: rgba(15,22,41,.7);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,.2);
}
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--fg); }
.brand-mark { font-size: 22px; }
.brand-text { font-weight: 800; font-size: 19px; letter-spacing: -.3px; }
.nav { display: flex; gap: 4px; }
.nav-link {
  color: var(--sub); text-decoration: none; font-weight: 600; font-size: 13px;
  padding: 8px 16px; border-radius: 10px; transition: .15s;
}
.nav-link:hover, .nav-link.router-link-active {
  color: var(--fg); background: var(--panel2);
}

/* Content */
.content { display: flex; flex-direction: column; gap: 20px; }

/* Buttons */
button {
  font-family: inherit; font-weight: 700; cursor: pointer; border: none;
  border-radius: 12px; transition: .15s;
}
.btn-primary {
  background: linear-gradient(135deg, var(--accent), #059669);
  color: #04140d; padding: 12px 24px; font-size: 14px;
  box-shadow: 0 4px 16px rgba(16,185,129,.25);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(16,185,129,.35); }
.btn-primary:disabled { opacity: .4; cursor: wait; transform: none; box-shadow: none; }
.btn-ghost {
  background: var(--panel2); color: var(--fg); padding: 10px 18px; font-size: 13px;
  border: 1px solid var(--border-light);
}
.btn-ghost:hover { background: var(--panel3); border-color: var(--accent); }

/* Footer */
.footer {
  margin-top: 32px; padding: 20px; text-align: center;
  color: var(--sub); font-size: 12px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  border-top: 1px solid var(--border);
}
.footer-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--sub); }
</style>