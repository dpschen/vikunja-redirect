# Bulk Redirect lists

For large static redirect tables use Cloudflare **Bulk Redirects**.

1. Prepare `redirects.csv` with columns `Source URL,Target URL,Status Code`.
2. In the dashboard go to **Bulk Redirects → Create List**, then import the CSV.
3. Create a **Bulk Redirect Rule**, select the list and choose *Forwarding URL (Static)* with status `308`.

Each list supports up to 20 000 entries and rules are evaluated before the Worker executes.
