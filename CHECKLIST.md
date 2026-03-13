# Pre-Deployment Checklist

- [ ] Supabase RLS enabled on all tables (verify in dashboard)
- [ ] All env vars added to Vercel dashboard (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_AI_API_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc.)
- [ ] Stripe webhook endpoint configured for production URL
- [ ] Insforge OAuth redirect URL updated to production domain
- [ ] Google Cloud Console OAuth redirect URI updated to production domain
- [ ] Admin login tested in production (tarj123@gmail.com)
- [ ] Stripe test mode disabled — production keys active
- [ ] Custom domain configured in Vercel
- [ ] Supabase daily backups enabled
