import firebase_admin
from firebase_admin import credentials, firestore
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

cred_path = os.getenv("FIREBASE_CREDENTIALS", "serviceAccountKey.json")
if not os.path.isabs(cred_path):
    cred_path = str(Path(__file__).resolve().parent.parent / cred_path)

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
db = firestore.client()
