import React from 'react';
import StateView from './StateView';

// Shows the loading / error state of a request (see hooks/useAsync), or the
// content once it is ready. Pass a function as children when the content
// reads data that only exists after loading.
//   <AsyncView status={status} error={error} onRetry={reload} loadingTitle="Đang tải...">
//     {() => <List items={data.items} />}
//   </AsyncView>
const AsyncView = ({status, error, onRetry, loadingTitle, compact, children}) => {
  if (status === 'loading') {
    return <StateView type="loading" title={loadingTitle} compact={compact} />;
  }
  if (status === 'error') {
    return <StateView type="error" message={error} onAction={onRetry} compact={compact} />;
  }
  return typeof children === 'function' ? children() : children;
};

export default AsyncView;
