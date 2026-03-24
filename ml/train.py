import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from model import label2idx

def train_dummy_model():
    # Dummy data
    data = [
        ("I love this!", "positive"),
        ("This is great.", "positive"),
        ("Absolutely fantastic experience.", "positive"),
        ("I hate this.", "negative"),
        ("This is terrible.", "negative"),
        ("Worst thing ever.", "negative"),
        ("It is okay.", "neutral"),
        ("Not bad, not good.", "neutral"),
        ("Just average.", "neutral")
    ]
    texts = [d[0] for d in data]
    labels_text = [d[1] for d in data]
    labels = [label2idx[l] for l in labels_text]

    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer()),
        ('clf', LogisticRegression())
    ])

    pipeline.fit(texts, labels)

    os.makedirs(os.path.dirname(__file__) or '.', exist_ok=True)
    model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
    joblib.dump(pipeline, model_path)
    print(f"Model trained and saved to {model_path}")

if __name__ == '__main__':
    train_dummy_model()
