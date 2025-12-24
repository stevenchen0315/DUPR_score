// API 工具函數，根據 readonly 模式選擇正確的端點

export const getApiEndpoint = (resource: string, username: string, readonly: boolean = false) => {
  const prefix = readonly ? '/api/read' : '/api/write'
  return `${prefix}/${resource}/${username}`
}

export const getReadApiEndpoint = (resource: string, username?: string) => {
  if (username) {
    return `/api/read/${resource}/${username}`
  }
  return `/api/read/${resource}`
}

export const getWriteApiEndpoint = (resource: string, username: string) => {
  return `/api/write/${resource}/${username}`
}
