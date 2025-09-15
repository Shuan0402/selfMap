// // src/index.js
// export default {
//   async fetch(request, env, ctx) {
//     const url = new URL(request.url);
//     const target = `https://nominatim.openstreetmap.org${url.pathname}${url.search}`;
//     const res = await fetch(target, {
//       headers: { "User-Agent": "Cloudflare-Worker-Proxy" },
//     });
//     return res;
//   }
// }
