export interface Env {
  PORT: number
}

export interface CustomConfig {
  n8n: {
    endpoint: string | undefined
  }
  keymaster: {
    endpoint: string
    service: string
  }
  supabase: {
    endpoint: string | undefined
    anonKey: string | undefined
    service: string
  }
}
