import {useCallback, useEffect, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';

// Loads data for a screen and tracks the request state, replacing the
// status / error / refreshing / load boilerplate each screen used to repeat.
//
//   const fetchProfile = useCallback(() => ptApi.getProfile().then(r => r.data.data), []);
//   const {data, status, error, reload, refresh, refreshing} = useAsync(fetchProfile, {trigger: 'focus'});
//
// - `fn` must be memoised (useCallback); when it changes the data is reloaded.
// - `trigger`: 'mount' (default, and whenever `fn` changes), 'focus' (every
//   time the screen comes into view) or 'manual'.
// - status: 'loading' until the first result, then 'ready' or 'error'. Later
//   reloads keep showing the current data (`fetching` is true meanwhile); a
//   retry after an error goes back to 'loading'. With `resetOnChange`, a new
//   `fn` (e.g. another selected day) also goes back to 'loading', so stale
//   data for the previous query is never shown.
// - Responses of superseded requests are ignored, so a slow answer for an
//   old query never overwrites a newer one.
const useAsync = (fn, {trigger = 'mount', initialData = null, resetOnChange = false} = {}) => {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);
  const lastFn = useRef(fn);

  const run = useCallback(
    async ({refresh = false} = {}) => {
      const id = ++requestId.current;
      const isNewQuery = lastFn.current !== fn;
      lastFn.current = fn;
      setFetching(true);
      if (refresh) {
        setRefreshing(true);
      } else {
        setStatus(prev => (prev === 'error' || (resetOnChange && isNewQuery) ? 'loading' : prev));
      }
      try {
        const result = await fn();
        if (id === requestId.current) {
          setData(result);
          setStatus('ready');
        }
        return result;
      } catch (err) {
        if (id === requestId.current) {
          setError(err.message);
          setStatus('error');
        }
        return undefined;
      } finally {
        if (id === requestId.current) {
          setFetching(false);
          setRefreshing(false);
        }
      }
    },
    [fn, resetOnChange],
  );

  const reload = useCallback(() => run(), [run]);
  const refresh = useCallback(() => run({refresh: true}), [run]);

  useEffect(() => {
    if (trigger === 'mount') {
      reload();
    }
  }, [trigger, reload]);

  useFocusEffect(
    useCallback(() => {
      if (trigger === 'focus') {
        reload();
      }
    }, [trigger, reload]),
  );

  return {data, setData, status, error, fetching, refreshing, reload, refresh};
};

export default useAsync;
