import shutil,uuid
from pathlib import Path
from uuid import UUID
from fastapi import APIRouter,Depends,File,HTTPException,UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import Document
router=APIRouter(prefix="/documents",tags=["Documents"],dependencies=[Depends(get_current_user)])
@router.get("/{contact_id}")
def list_docs(contact_id:UUID,db:Session=Depends(get_db)): return db.scalars(select(Document).where(Document.contact_id==contact_id)).all()
@router.post("/{contact_id}",status_code=201)
def upload(contact_id:UUID,file:UploadFile=File(...),db:Session=Depends(get_db)):
    root=Path(settings.storage_path);root.mkdir(parents=True,exist_ok=True); key=f"{contact_id}/{uuid.uuid4()}_{Path(file.filename or 'file').name}"; path=root/key;path.parent.mkdir(parents=True,exist_ok=True)
    with path.open("wb") as out: shutil.copyfileobj(file.file,out)
    doc=Document(contact_id=contact_id,original_name=file.filename or "file",storage_key=key,content_type=file.content_type or "application/octet-stream",size_bytes=path.stat().st_size);db.add(doc);db.commit();db.refresh(doc);return doc
@router.get("/download/{document_id}")
def download(document_id:UUID,db:Session=Depends(get_db)):
    doc=db.get(Document,document_id)
    if not doc: raise HTTPException(404,"Document not found")
    return FileResponse(Path(settings.storage_path)/doc.storage_key,filename=doc.original_name,media_type=doc.content_type)
