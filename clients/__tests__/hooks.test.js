import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';
import useAsync from '../src/hooks/useAsync';
import usePaginatedList from '../src/hooks/usePaginatedList';

// Navigation packages are ESM and not transformed in Jest; focus triggers are
// not exercised here.
jest.mock('@react-navigation/native', () => ({useFocusEffect: () => {}}));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
};

// Renders a hook and exposes its latest return value.
const renderHook = (hook, initialProps) => {
  const result = {};
  const Probe = props => {
    result.current = hook(props);
    return null;
  };
  let renderer;
  act(() => {
    renderer = TestRenderer.create(<Probe {...initialProps} />);
  });
  return {result, rerender: props => act(() => renderer.update(<Probe {...props} />))};
};

describe('useAsync', () => {
  it('loads on mount and exposes the data', async () => {
    const fn = jest.fn().mockResolvedValue([1, 2]);
    const {result} = renderHook(() => useAsync(fn, {initialData: []}));
    expect(result.current.status).toBe('loading');
    await act(async () => {});
    expect(result.current.status).toBe('ready');
    expect(result.current.data).toEqual([1, 2]);
  });

  it('reports errors and goes back to loading on retry', async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error('Mất kết nối')).mockResolvedValueOnce('ok');
    const {result} = renderHook(() => useAsync(fn));
    await act(async () => {});
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Mất kết nối');

    let retry;
    act(() => {
      retry = result.current.reload();
    });
    expect(result.current.status).toBe('loading');
    await act(() => retry);
    expect(result.current.data).toBe('ok');
  });

  it('ignores a slower response of a superseded query', async () => {
    const slow = deferred();
    const fast = deferred();
    const fetchers = {a: () => slow.promise, b: () => fast.promise};
    const {result, rerender} = renderHook(({q}) => useAsync(fetchers[q]), {q: 'a'});
    rerender({q: 'b'});
    await act(async () => fast.resolve('B'));
    await act(async () => slow.resolve('A'));
    expect(result.current.data).toBe('B');
  });

  it('keeps data on a new query unless resetOnChange is set', async () => {
    const pending = deferred();
    const fetchers = {a: () => Promise.resolve('A'), b: () => pending.promise};
    const keep = renderHook(({q}) => useAsync(fetchers[q]), {q: 'a'});
    const reset = renderHook(({q}) => useAsync(fetchers[q], {resetOnChange: true}), {q: 'a'});
    await act(async () => {});
    keep.rerender({q: 'b'});
    reset.rerender({q: 'b'});
    expect(keep.result.current.status).toBe('ready');
    expect(keep.result.current.data).toBe('A');
    expect(reset.result.current.status).toBe('loading');
    await act(async () => pending.resolve('B'));
  });
});

describe('usePaginatedList', () => {
  const pages = {1: ['a', 'b'], 2: ['c']};
  const fetchPage = jest.fn(async page => ({items: pages[page], hasMore: page < 2, total: 3}));

  it('loads the first page, then appends the next', async () => {
    const {result} = renderHook(() => usePaginatedList(fetchPage));
    await act(() => result.current.reload());
    expect(result.current.items).toEqual(['a', 'b']);
    expect(result.current.total).toBe(3);

    await act(() => result.current.loadMore());
    expect(result.current.items).toEqual(['a', 'b', 'c']);

    // No more pages: nothing is fetched.
    fetchPage.mockClear();
    await act(() => result.current.loadMore());
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it('keeps the list on a reload of the same query', async () => {
    const {result} = renderHook(() => usePaginatedList(fetchPage));
    await act(() => result.current.reload());
    act(() => {
      result.current.reload();
    });
    expect(result.current.status).toBe('ready');
    await act(async () => {});
  });
});
