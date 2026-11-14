/* Farm Studio service worker: shows watering reminders pushed by the server, even when the app is closed. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let data = { title: "Farm Studio", body: "", url: "/" };
  try { data = { ...data, ...e.data.json() }; } catch { if (e.data) data.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, tag: data.title, renotify: true, data: { url: data.url || "/" },
    icon: "/static/icon.svg", badge: "/static/icon.svg",
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if ("focus" in c) { c.postMessage({ type: "open-reminders" }); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
