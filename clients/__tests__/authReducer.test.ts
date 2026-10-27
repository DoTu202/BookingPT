import {authReducer, addAuth, removeAuth} from '../src/redux/reducers/authReducer';

describe('authReducer', () => {
  const session = {
    id: '1',
    accesstoken: 'token',
    email: 'pt@example.com',
    role: 'pt' as const,
  };

  it('stores the session on login', () => {
    const state = authReducer(undefined, addAuth(session));
    expect(state.authData).toEqual(session);
  });

  it('clears the session on logout', () => {
    const loggedIn = authReducer(undefined, addAuth(session));
    const state = authReducer(loggedIn, removeAuth(undefined));
    expect(state.authData.accesstoken).toBe('');
    expect(state.authData.role).toBe('client');
  });
});
