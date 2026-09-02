import { ref, type Ref } from 'vue'

export function useCountdown(targetIso: string | Ref<string>) {
  const remaining = ref('')
  const overdue = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  const getTarget = () => typeof targetIso === 'string' ? targetIso : targetIso.value

  function tick() {
    const t = getTarget()
    if (!t) { remaining.value = '—'; return }
    const target = new Date(t).getTime()
    const now = Date.now()
    const diff = target - now
    if (diff <= 0) {
      remaining.value = 'Posting now…'
      overdue.value = true
      return
    }
    overdue.value = false
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1_000)
    remaining.value = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
  }

  function start() {
    tick()
    if (timer) clearInterval(timer)
    timer = setInterval(tick, 1000)
  }
  function stop() { if (timer) { clearInterval(timer); timer = null } }

  return { remaining, overdue, start, stop }
}