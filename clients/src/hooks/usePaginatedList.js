import {useCallback, useRef, useState} from 'react';

// Paged list state for FlatList screens (search results, bookings,
// notifications).
//
//   const fetchPage = useCallback(async page => {
//     const res = await clientApi.getMyBookings({pageNumber: page, pageSize: 10});
//     return {items: res.data.data, hasMore: page < res.data.pages, total: res.data.count};
//   }, []);
//   const list = usePaginatedList(fetchPage);
//   <FlatList data={list.items} onEndReached={list.loadMore} ... />
//
// The screen decides when to call `reload` (mount, focus, debounced input).
// A reload shows the full-screen loading state only for a new query (a new
// `fetchPage`) or after an error; reloading the same query keeps the list on
// screen. Responses of superseded requests are ignored.
const usePaginatedList = fetchPage => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestId = useRef(0);
  const lastQuery = useRef(null);

  const load = useCallback(
    async ({refresh = false} = {}) => {
      const id = ++requestId.current;
      const isNewQuery = lastQuery.current !== fetchPage;
      lastQuery.current = fetchPage;
      if (refresh) {
        setRefreshing(true);
      } else {
        setStatus(prev => (isNewQuery || prev !== 'ready' ? 'loading' : prev));
      }
      try {
        const result = await fetchPage(1);
        if (id !== requestId.current) {
          return;
        }
        setItems(result.items || []);
        setHasMore(Boolean(result.hasMore));
        setTotal(result.total ?? (result.items || []).length);
        setPage(1);
        setStatus('ready');
      } catch (err) {
        if (id === requestId.current) {
          setError(err.message);
          setStatus('error');
        }
      } finally {
        if (id === requestId.current) {
          setRefreshing(false);
        }
      }
    },
    [fetchPage],
  );

  const reload = useCallback(() => load(), [load]);
  const refresh = useCallback(() => load({refresh: true}), [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || status !== 'ready' || !hasMore) {
      return;
    }
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const result = await fetchPage(page + 1);
      if (id === requestId.current) {
        setItems(prev => [...prev, ...(result.items || [])]);
        setHasMore(Boolean(result.hasMore));
        setPage(page + 1);
      }
    } catch {
      // Keep what is already shown; scrolling again retries.
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingMore, page, status]);

  return {items, setItems, total, status, error, refreshing, loadingMore, reload, refresh, loadMore};
};

export default usePaginatedList;
