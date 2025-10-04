/**
 * 通过主进程代理发送 API 请求（避免 CORS 问题）
 */
export async function apiRequest(
  url: string,
  options: {
    method: string;
    headers?: Record<string, string>;
    body?: any;
  } = { method: 'GET' }
): Promise<Response> {
  const { api } = (window as any).electron;
  
  const result = await api.request({
    url,
    method: options.method,
    headers: options.headers,
    body: options.body,
  });
  
  // 包装成 Response-like 对象
  return {
    ok: result.ok,
    status: result.status,
    statusText: result.statusText,
    json: async () => result.data,
    text: async () => JSON.stringify(result.data),
  } as Response;
}

/**
 * 创建一个与标准 fetch API 兼容的包装函数
 */
export const fetchProxy = apiRequest;