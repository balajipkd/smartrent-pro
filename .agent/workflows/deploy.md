---
description: Deploy SmartRent Pro to Vercel
---

# Deploy intent to Vercel

1.  **Install Vercel CLI** (if not already installed):
    ```bash
    npm install -g vercel
    ```

2.  **Login to Vercel**:
    ```bash
    vercel login
    ```

3.  **Deploy**:
    Run the deploy command from the project root.
    ```bash
    vercel
    ```
    - Follow the prompts:
        - Set up and deploy? **Y**
        - Which scope? (Select your user)
        - Link to existing project? **N**
        - Project Name? **smartrent-pro** (or your choice)
        - In which directory is your code located? **./**
        - Auto-detect settings? **Y**

4.  **Configure Environment Variables** (Critical Step):
    During the deploy (or via Vercel Dashboard), you MUST set the environment variables.
    
    If using the CLI, after the first deploy fails (or creates a preview), run:
    ```bash
    vercel env add VITE_SUPABASE_URL
    # Paste your URL
    # Select 'Production', 'Preview', 'Development'
    
    vercel env add VITE_SUPABASE_ANON_KEY
    # Paste your Key
    # Select 'Production', 'Preview', 'Development'
    ```

    Alternatively, go to the **Vercel Dashboard** -> Your Project -> Settings -> Environment Variables and add them there.

5.  **Redeploy** (to pick up the variables):
    ```bash
    vercel --prod
    ```

6.  **Done!** You will get a production URL (e.g., `https://smartrent-pro.vercel.app`).
