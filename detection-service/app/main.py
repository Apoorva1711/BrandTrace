import io
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from app.schemas import (
    MatchRequest, MatchEvaluationResult,
    BatchMatchRequest, BatchMatchResponse,
    HealthStatus
)
from app.risk_scorer import evaluate_candidate_threat
from app.logo_matcher import compute_image_hash

app = FastAPI(
    title="BRANDTRACE Detection Service",
    description="Explainable Deterministic Impersonation & Mobile Risk Scoring Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthStatus)
def health_check():
    return HealthStatus(
        status="healthy",
        service="BRANDTRACE Detection Service",
        version="1.0.0"
    )

@app.post("/detect/match", response_model=MatchEvaluationResult)
def evaluate_match(request: MatchRequest):
    try:
        return evaluate_candidate_threat(
            brand=request.brand,
            official_assets=request.official_assets,
            candidate=request.candidate
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection evaluation error: {str(e)}")

@app.post("/detect/batch", response_model=BatchMatchResponse)
def evaluate_batch(request: BatchMatchRequest):
    try:
        results: List[MatchEvaluationResult] = []
        excluded_count = 0
        findings_count = 0

        for cand in request.candidates:
            res = evaluate_candidate_threat(
                brand=request.brand,
                official_assets=request.official_assets,
                candidate=cand
            )
            if res.is_excluded:
                excluded_count += 1
            else:
                findings_count += 1
            results.append(res)

        return BatchMatchResponse(
            total_evaluated=len(request.candidates),
            excluded_count=excluded_count,
            findings_count=findings_count,
            results=results
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch detection error: {str(e)}")

@app.post("/detect/hash-image")
async def hash_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image_stream = io.BytesIO(contents)
        h = compute_image_hash(image_stream)
        if not h:
            raise HTTPException(status_code=400, detail="Unable to compute perceptual hash for provided image.")
        return {"hash": h, "algorithm": "dhash"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error hashing image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
