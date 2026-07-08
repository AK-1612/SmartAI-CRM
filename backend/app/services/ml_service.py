from functools import lru_cache
from pathlib import Path
import joblib
from app.core.config import settings

FEATURES = ["total_calls","total_emails","email_opens","email_replies","meetings_done","purchase_count","total_revenue","support_tickets","website_visits","days_since_last_contact"]

def recommendations(level: str, data: dict) -> list[str]:
    if level == "Low": return ["Risk Alert", "Call Tomorrow", "Send a re-engagement offer"]
    if level == "Medium": return ["Schedule Demo", "Send Proposal", "Follow up this week"]
    return ["Upsell", "Request Referral", "Invite to loyalty program"]

@lru_cache
def load_model():
    path = Path(settings.model_path)
    return joblib.load(path) if path.exists() else None

def predict(data: dict):
    model = load_model()
    values = [float(data.get(f, 0)) for f in FEATURES]
    if model:
        label = str(model.predict([values])[0]); probs = model.predict_proba([values])[0]; probability = float(max(probs))
    else:
        raw = (values[0]*2 + values[2] + values[3]*3 + values[4]*5 + values[5]*4 + min(values[6]/1000,30) + values[8] - values[9]*.5)
        score = max(0, min(100, 50 + raw/4)); label = "High" if score >= 70 else "Medium" if score >= 40 else "Low"; probability = .65
    score = round(85 if label == "High" else 55 if label == "Medium" else 25, 1)
    ranked = sorted(zip(FEATURES, values), key=lambda x: abs(x[1]), reverse=True)[:5]
    return {"engagement_level": label.title(), "engagement_score": score, "probability": round(probability,4), "top_features": [{"feature":k,"value":v} for k,v in ranked], "recommendations": recommendations(label.title(), data)}
