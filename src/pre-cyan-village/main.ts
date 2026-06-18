const app = document.querySelector<HTMLElement>('#app');

if (!app) {
  throw new Error('Missing #app root');
}

app.textContent = 'Good Afternoon.';
