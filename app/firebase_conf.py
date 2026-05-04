import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

# Construir la ruta absoluta del archivo de credenciales
credentials_path = os.getenv("FIREBASE_CREDENTIALS", "serviceAccountKey.json")
if not os.path.isabs(credentials_path):
    # Si la ruta es relativa, hacerla relativa al directorio de este archivo
    credentials_path = os.path.join(os.path.dirname(__file__), credentials_path)

cred = credentials.Certificate(credentials_path)
firebase_admin.initialize_app(cred)
db = firestore.client()
