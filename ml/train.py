from pathlib import Path
import json, joblib, pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
from generate_dataset import generate

FEATURES = ["total_calls","total_emails","email_opens","email_replies","meetings_done","purchase_count","total_revenue","support_tickets","website_visits","days_since_last_contact"]
def train():
    root = Path(__file__).parent; source = root / "crm_dataset.csv"
    df = pd.read_csv(source) if source.exists() else generate()
    x_train,x_test,y_train,y_test = train_test_split(df[FEATURES], df.engagement_level, test_size=.2, stratify=df.engagement_level, random_state=42)
    candidates = {"logistic":LogisticRegression(max_iter=1000),"decision_tree":DecisionTreeClassifier(random_state=42),"random_forest":RandomForestClassifier(n_estimators=250,n_jobs=-1,random_state=42),"xgboost":XGBClassifier(n_estimators=200,max_depth=5,n_jobs=-1,random_state=42)}
    fitted={}; scores={}
    for name, estimator in candidates.items():
        pipeline=Pipeline([("clean",SimpleImputer(strategy="median")),("scale",StandardScaler()),("model",estimator)])
        pipeline.fit(x_train,y_train); fitted[name]=pipeline; scores[name]=accuracy_score(y_test,pipeline.predict(x_test))
    name=max(scores,key=scores.get); best=fitted[name]
    if name=="random_forest":
        search=GridSearchCV(best,{"model__max_depth":[8,14,None],"model__min_samples_leaf":[1,3]},cv=3,n_jobs=-1);search.fit(x_train,y_train);best=search.best_estimator_
    artifacts=root/"artifacts";artifacts.mkdir(exist_ok=True);joblib.dump(best,artifacts/"model.pkl")
    (artifacts/"metrics.json").write_text(json.dumps({"best_model":name,"scores":scores,"report":classification_report(y_test,best.predict(x_test),output_dict=True)},indent=2))
    try:
        import shap
        transformed=best[:-1].transform(x_test.iloc[:250]); values=shap.Explainer(best.named_steps["model"],transformed)(transformed);joblib.dump(values,artifacts/"shap_values.pkl")
    except Exception as exc: (artifacts/"shap_status.txt").write_text(str(exc))
    print({"best_model":name,"accuracy":scores[name]})
if __name__=="__main__": train()
