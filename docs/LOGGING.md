# Off-platform logging and alerting

Cloudflare can stream Worker logs to external storage. Enable **Workers Trace Event Logs** via **Logpush** in the dashboard and point it to an S3-compatible bucket (e.g. R2).

Example API call to create a Logpush job:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/logpush/jobs" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
        "name": "worker-logs",
        "destination_conf": "s3://bucket/path?access-key-id=…",
        "dataset": "workers_trace_events",
        "logpull_options": "fields=RayID,EdgeStartTimestamp,ClientIP,Status"
      }'
```

In **Notifications** create an alert for **Any 5xx > 1% over 5 min** and send it to your preferred webhook or email channel.
