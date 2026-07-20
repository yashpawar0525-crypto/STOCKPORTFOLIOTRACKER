import { createRouter } from './routerCore.js';

export const createApp = (root) => {
  const router = createRouter(root);
  router.init();
};
