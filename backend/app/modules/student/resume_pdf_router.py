"""PDF resume upload — additive endpoint alongside the existing text-paste resume flow.

Uses LangChain's built-in PyPDFLoader to extract text from an uploaded PDF, then
reuses the existing `student.service.analyze_and_store_resume` (unchanged) so the
PDF path produces identical results to pasting the same text manually.
"""

import tempfile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from langchain_community.document_loaders import PyPDFLoader

from app.core.security import require_role
from app.modules.student import service

router = APIRouter(prefix="/api/student", tags=["student"])

student_only = require_role("student")


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using LangChain's PyPDFLoader."""
    with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
        tmp.write(file_bytes)
        tmp.flush()
        pages = PyPDFLoader(tmp.name).load()
    return "\n".join(page.page_content for page in pages)


@router.post("/me/resume-pdf")
async def upload_resume_pdf(file: UploadFile = File(...), user: dict = Depends(student_only)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()
    try:
        resume_text = _extract_text_from_pdf(contents)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read this PDF file")

    if len(resume_text.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Couldn't extract enough text from this PDF (it may be scanned/image-only)",
        )

    return await service.analyze_and_store_resume(user["id"], resume_text)
