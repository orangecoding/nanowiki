async function request(url, opts = {}) {
  const hasBody = !!opts.body;
  const hasOpts = opts.method || hasBody || opts.headers;
  const fetchOpts = hasOpts
    ? {
        headers: hasBody ? { 'Content-Type': 'application/json', ...opts.headers } : (opts.headers ?? {}),
        ...opts,
        body: hasBody ? JSON.stringify(opts.body) : undefined,
      }
    : undefined;
  const res = await (fetchOpts ? fetch(url, fetchOpts) : fetch(url));
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status });
  }
  if (res.status === 204) return null;
  return res.json();
}

export const getFiles = () => request('/api/files');

export const createEntry = (type, path) => request('/api/files', { method: 'POST', body: { type, path } });

export const renameEntry = (path, newPath) => request(`/api/files/${path}`, { method: 'PUT', body: { newPath } });

export const deleteEntry = (path) => request(`/api/files/${path}`, { method: 'DELETE' });

export const getContent = (path) => request(`/api/content/${path}`).then((r) => r.content);

export const saveContent = (path, content) => request(`/api/content/${path}`, { method: 'PUT', body: { content } });

export function uploadImage(mdPath, file) {
  const fd = new FormData();
  fd.append('file', file);
  return fetch(`/api/images/${mdPath}`, { method: 'POST', body: fd }).then((r) => {
    if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
    return r.json();
  });
}

export const searchFiles = (q) => request(`/api/search?q=${encodeURIComponent(q)}`);

export const deleteImage = (urlPath) => {
  // urlPath is like "/files/subdir/image.png" → strip prefix for API
  const relPath = urlPath.replace(/^\/files\//, '');
  return request(`/api/images/${relPath}`, { method: 'DELETE' });
};
