import { useCallback, useEffect, useRef, useState } from 'react'

/** Runs an async loader; returns { data, loading, error, reload }. Loader errors are surfaced, never swallowed. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const ref = useRef(loader)
  ref.current = loader
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try { setState({ data: await ref.current(), loading: false, error: null }) }
    catch (e) { setState({ data: null, loading: false, error: e.message || 'Something went wrong' }) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { run() }, [run])
  return { ...state, reload: run }
}
