export default () => ({
  n8n: {
    endpoint: process.env.N8N_WEBHOOK_ENDPOINT,
  },
  keymaster: {
    endpoint: process.env.KEYMASTER_ENDPOINT,
  }
})
