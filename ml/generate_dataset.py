from pathlib import Path
import numpy as np
import pandas as pd

def generate(rows: int = 5000, seed: int = 42) -> pd.DataFrame:
    r = np.random.default_rng(seed)
    df = pd.DataFrame({
        "customer_id": [f"CRM-{i:06d}" for i in range(1, rows + 1)],
        "name": [f"Customer {i}" for i in range(1, rows + 1)],
        "company": [f"Company {i % 700}" for i in range(rows)],
        "industry": r.choice(["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Education"], rows),
        "city": r.choice(["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune"], rows),
        "source": r.choice(["Website", "Referral", "Campaign", "Partner", "Event"], rows),
        "status": r.choice(["new", "qualified", "active", "inactive"], rows),
        "total_calls": r.poisson(5, rows), "total_emails": r.poisson(12, rows),
        "email_opens": r.poisson(7, rows), "email_replies": r.poisson(3, rows),
        "meetings_done": r.poisson(2, rows), "purchase_count": r.poisson(2, rows),
        "total_revenue": np.round(r.gamma(2, 2500, rows), 2), "support_tickets": r.poisson(2, rows),
        "website_visits": r.poisson(15, rows), "days_since_last_contact": r.integers(0, 180, rows),
    })
    signal = df.email_replies*3 + df.meetings_done*5 + df.purchase_count*7 + df.website_visits*.5 - df.days_since_last_contact*.2 + r.normal(0, 8, rows)
    df["engagement_level"] = pd.cut(signal, [-np.inf, 8, 25, np.inf], labels=["Low", "Medium", "High"]).astype(str)
    return df

if __name__ == "__main__":
    target = Path(__file__).parent / "crm_dataset.csv"
    generate().to_csv(target, index=False)
    print(f"Generated 5000 rows at {target}")
