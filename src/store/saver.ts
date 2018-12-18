const authSave = (state: any) => {
  if (state.authentication.status) {
    const data = Object.assign({}, state.authentication);
    data.solidAuth = 'loading';
    data.profile = null;
    localStorage.setItem('thimble-auth', JSON.stringify(data));
    localStorage.setItem('thimble-auth-token', 'bearer ' + data.token);
  }
};

export default function saveState (store: any) {
  store.subscribe((mutation: any, state: any) => {
    authSave(state);
  });
}
