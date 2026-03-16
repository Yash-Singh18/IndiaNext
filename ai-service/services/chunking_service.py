import re

import tiktoken

from config.settings import settings


_enc = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_enc.encode(text))


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def chunk_text(
    text: str,
    file_name: str,
    page_number: int,
) -> list[dict]:
    """
    Semantic chunking: sentence-based with overlap.
    Returns list of {chunk_id, text, file_name, page_number, bm25_tokens}.
    """
    sentences = _split_sentences(text)
    if not sentences:
        return []

    chunks = []
    chunk_idx = 0
    current_sentences = []
    current_tokens = 0

    for sentence in sentences:
        sent_tokens = count_tokens(sentence)

        # If adding this sentence exceeds max, finalize current chunk
        if current_tokens + sent_tokens > settings.chunk_max_tokens and current_sentences:
            chunk_text_str = " ".join(current_sentences)
            if count_tokens(chunk_text_str) >= settings.chunk_min_tokens:
                chunks.append(_make_chunk(
                    chunk_text_str, file_name, page_number, chunk_idx,
                ))
                chunk_idx += 1

            # Overlap: keep last N tokens worth of sentences
            overlap_sentences = []
            overlap_tokens = 0
            for s in reversed(current_sentences):
                s_tok = count_tokens(s)
                if overlap_tokens + s_tok > settings.chunk_overlap_tokens:
                    break
                overlap_sentences.insert(0, s)
                overlap_tokens += s_tok

            current_sentences = overlap_sentences
            current_tokens = overlap_tokens

        current_sentences.append(sentence)
        current_tokens += sent_tokens

    # Flush remaining
    if current_sentences:
        chunk_text_str = " ".join(current_sentences)
        if count_tokens(chunk_text_str) >= settings.chunk_min_tokens // 2:
            chunks.append(_make_chunk(
                chunk_text_str, file_name, page_number, chunk_idx,
            ))

    return chunks


def _make_chunk(text: str, file_name: str, page_number: int, idx: int) -> dict:
    """Create a chunk dict with BM25 tokens stored in metadata."""
    tokens = _tokenize_for_bm25(text)
    return {
        "chunk_id": f"{file_name}::p{page_number}::c{idx}",
        "text": text,
        "file_name": file_name,
        "page_number": page_number,
        "bm25_tokens": tokens,
    }


def _tokenize_for_bm25(text: str) -> list[str]:
    """Simple whitespace + lowercase tokenization for BM25."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return [w for w in text.split() if len(w) > 1]
