import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.firebase_conf import db

def wipe():
    total = 0

    # Wipe jugadors + subcol·lecció inventari
    docs = db.collection("jugadors").get()
    for doc in docs:
        ref = db.collection("jugadors").document(doc.id)
        for inv in ref.collection("inventari").get():
            inv.reference.delete()
        ref.delete()
        total += 1
    print(f"  jugadors: {total}")

    # Wipe partides + subcol·lecció puntuacions
    pcount = 0
    docs = db.collection("partides").get()
    for doc in docs:
        ref = db.collection("partides").document(doc.id)
        for pun in ref.collection("puntuacions").get():
            pun.reference.delete()
        ref.delete()
        pcount += 1
    print(f"  partides: {pcount}")
    total += pcount

    print(f"\nWipe complet. {total} documents eliminats.")

if __name__ == "__main__":
    wipe()
