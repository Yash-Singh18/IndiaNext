def compute_final_score(heuristic_score: int, llm_score: int) -> int:
    """Weighted combination: heuristic is fast signal, LLM is deep signal."""
    return int(round((heuristic_score * 0.3) + (llm_score * 0.7)))
