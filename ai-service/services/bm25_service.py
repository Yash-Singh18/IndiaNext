import re
import math


def _tokenize(text: str) -> list[str]:
    text = text.lower()
    # Keep Unicode word characters (letters, digits) from any script, not just ASCII
    text = re.sub(r'[^\w\s]', ' ', text, flags=re.UNICODE)
    return [w for w in text.split() if len(w) > 1]


def bm25_score_chunks(query: str, chunks: list[dict], k1: float = 1.5, b: float = 0.75) -> list[dict]:
    """
    Compute BM25 scores using pre-tokenized bm25_tokens stored in Qdrant payloads.
    Returns chunks sorted by BM25 score descending.
    """
    query_tokens = _tokenize(query)
    if not query_tokens or not chunks:
        return chunks

    # Gather corpus stats from stored tokens
    doc_lengths = []
    for chunk in chunks:
        tokens = chunk.get("bm25_tokens", [])
        doc_lengths.append(len(tokens))

    avg_dl = sum(doc_lengths) / len(doc_lengths) if doc_lengths else 1

    # Compute IDF for query terms
    n_docs = len(chunks)
    idf = {}
    for term in set(query_tokens):
        df = sum(1 for chunk in chunks if term in chunk.get("bm25_tokens", []))
        idf[term] = math.log((n_docs - df + 0.5) / (df + 0.5) + 1)

    # Score each document
    scored = []
    for i, chunk in enumerate(chunks):
        doc_tokens = chunk.get("bm25_tokens", [])
        dl = doc_lengths[i]
        score = 0.0

        # Count term frequencies
        tf_map = {}
        for t in doc_tokens:
            tf_map[t] = tf_map.get(t, 0) + 1

        for term in query_tokens:
            if term not in idf:
                continue
            tf = tf_map.get(term, 0)
            numerator = tf * (k1 + 1)
            denominator = tf + k1 * (1 - b + b * dl / avg_dl)
            score += idf[term] * numerator / denominator

        scored.append({**chunk, "bm25_score": score})

    scored.sort(key=lambda x: x["bm25_score"], reverse=True)
    return scored
