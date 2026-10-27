export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Rewrites the main root URL (/) to point directly to /public/index.html
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = '/public/index.html';
    } 
    // If someone visits /admin, /gallery, or /schematics without .html, rewrite to /public/
    else if (!url.pathname.startsWith('/public/')) {
      url.pathname = `/public${url.pathname}`;
    }

    return env.ASSETS.fetch(new Request(url.toString(), request));
  }
};
