from pydantic import BaseModel, EmailStr
from typing import Optional


class TicketCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    subject: str
    description: str


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None