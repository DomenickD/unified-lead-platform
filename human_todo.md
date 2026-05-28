# Tampa Platform Integration: Setup Live Construction Feeds

This checklist walks you through obtaining and configuring the real-time building permit Socrata dataset IDs for the **City of Tampa** and **Hillsborough County**.

Once these steps are completed, the application will shift from simulated fallback data to live, real-time government feeds.

---

## 📋 Step-by-Step Guide

### Step 1: Find the City of Tampa Building Permits Dataset ID
1. Open your browser and go to the **City of Tampa Open Data Portal**:
   👉 [https://data.tampagov.net](https://data.tampagov.net)
2. Use the search bar on the homepage and search for **"Building Permits"**.
3. Locate the dataset corresponding to active or historical building permits (e.g., *Building Permits - Active* or *Building Permits*). Click to open the dataset page.
4. On the dataset page, look for the **API** button or tab (typically on the upper right, near the "Export" or "Developer" menu).
5. Click **API**. You will see an API endpoint text box showing a URL resembling:
   `https://data.tampagov.net/resource/xxxx-xxxx.json`
6. Copy the **8-character dataset identifier** (in the format `xxxx-xxxx`, e.g., `4y9g-k8qp`).
7. Open your project's [backend/.env](file:///C:/Users/Domenick%20Dobbs/Desktop/Coding/16%202026%20CodeSpace/unified-lead-platform/backend/.env) file and paste the ID:
   ```env
   TAMPA_PERMITS_DATASET_ID=xxxx-xxxx
   ```

---

### Step 2: Find the Hillsborough County Building Permits Dataset ID
1. Open your browser and go to the **Hillsborough County Open Data Portal**:
   👉 [https://opendata.hillsboroughcounty.org](https://opendata.hillsboroughcounty.org)
2. Search the catalog for **"Building Permits"** or **"Permits Issued"**.
3. Open the main permits dataset page.
4. Click the **API** option or **API Explorer** menu.
5. Identify the Socrata endpoint URL (look for `/resource/yyyy-yyyy.json`).
6. Copy the **8-character dataset identifier** (in the format `yyyy-yyyy`, e.g., `h3ab-z93m`).
7. Open [backend/.env](file:///C:/Users/Domenick%20Dobbs/Desktop/Coding/16%202026%20CodeSpace/unified-lead-platform/backend/.env) and paste the ID:
   ```env
   HILLSBOROUGH_PERMITS_DATASET_ID=yyyy-yyyy
   ```

---

### Step 3 (Highly Recommended): Get a Free Socrata App Token
By default, Socrata limits unauthenticated API requests to **1,000 queries per hour** per IP address. To remove this limit:
1. Sign up for a free developer account at [Socrata App Tokens Portal](https://data.tampagov.net/profile/app_tokens).
2. Click **Create New App Token**.
3. Fill in a name and description (e.g., "CapitalStream Dev App").
4. Copy the generated API App Token.
5. Paste it in your [backend/.env](file:///C:/Users/Domenick%20Dobbs/Desktop/Coding/16%202026%20CodeSpace/unified-lead-platform/backend/.env):
   ```env
   SOCRATA_APP_TOKEN=your_generated_app_token_here
   ```

---

## 🔄 Step 4: Restart the Application
For the backend to pick up the new environment variables, restart your servers:
1. In your shell running `start.sh`, press `Ctrl + C` to shut down both the FastAPI backend and Vite frontend.
2. Run `./start.sh` (or your platform command) to spin up the servers again:
   ```bash
   ./start.sh
   ```
3. Open the **Opportunity Discovery** page, click the **Construction Permits (Live)** tab, and verify that the app now reads directly from the live municipal databases!
