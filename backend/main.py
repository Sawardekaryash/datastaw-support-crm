from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from backend.database import get_connection, create_tables
from backend.schemas import TicketCreate, TicketUpdate


app = FastAPI(title="Datastaw Support CRM")


@app.on_event("startup")
def startup():
    create_tables()


# ===============================
# Create Ticket
# ===============================

@app.post("/api/tickets")
def create_ticket(ticket: TicketCreate):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT COUNT(*) FROM tickets")

    count = cursor.fetchone()[0]

    ticket_id = f"TKT-{count + 1:03d}"

    cursor.execute(
        """
        INSERT INTO tickets
        (
            ticket_id,
            customer_name,
            customer_email,
            subject,
            description,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            ticket_id,
            ticket.customer_name,
            ticket.customer_email,
            ticket.subject,
            ticket.description,
            "Open"
        )
    )

    connection.commit()
    connection.close()

    return {
        "message": "Ticket created successfully",
        "ticket_id": ticket_id
    }


# ===============================
# Get Tickets
# ===============================

@app.get("/api/tickets")
def get_tickets(status: str = None, search: str = None):

    connection = get_connection()
    cursor = connection.cursor()

    query = """
        SELECT
            ticket_id,
            customer_name,
            customer_email,
            subject,
            description,
            status,
            created_at
        FROM tickets
        WHERE 1=1
    """

    parameters = []

    if status:
        query += " AND status = ?"
        parameters.append(status)

    if search:

        query += """
            AND (
                ticket_id LIKE ?
                OR customer_name LIKE ?
                OR customer_email LIKE ?
                OR description LIKE ?
            )
        """

        search_value = f"%{search}%"

        parameters.extend([
            search_value,
            search_value,
            search_value,
            search_value
        ])

    query += " ORDER BY created_at DESC"

    cursor.execute(query, parameters)

    tickets = [dict(row) for row in cursor.fetchall()]

    connection.close()

    return tickets


# ===============================
# Get Single Ticket
# ===============================
@app.get("/api/tickets/{ticket_id}")
def get_ticket(ticket_id: str):

    connection = get_connection()
    cursor = connection.cursor()

    # Get ticket
    cursor.execute(
        """
        SELECT *
        FROM tickets
        WHERE ticket_id = ?
        """,
        (ticket_id,)
    )

    ticket = cursor.fetchone()

    if ticket is None:
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Get internal notes
    cursor.execute(
        """
        SELECT
            id,
            note_text,
            created_at
        FROM notes
        WHERE ticket_id = ?
        ORDER BY created_at DESC
        """,
        (ticket_id,)
    )

    notes = [dict(row) for row in cursor.fetchall()]

    connection.close()

    result = dict(ticket)

    result["notes"] = notes

    return result


# ===============================
# Update Ticket
# ===============================

@app.put("/api/tickets/{ticket_id}")
def update_ticket(ticket_id: str, update: TicketUpdate):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM tickets WHERE ticket_id = ?",
        (ticket_id,)
    )

    ticket = cursor.fetchone()

    if ticket is None:

        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    if update.status:

        cursor.execute(
            """
            UPDATE tickets
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE ticket_id = ?
            """,
            (update.status, ticket_id)
        )

    if update.notes:

        cursor.execute(
            """
            INSERT INTO notes
            (ticket_id, note_text)
            VALUES (?, ?)
            """,
            (ticket_id, update.notes)
        )

    connection.commit()

    cursor.execute(
        "SELECT * FROM tickets WHERE ticket_id = ?",
        (ticket_id,)
    )

    updated_ticket = cursor.fetchone()

    connection.close()

    return {
        "message": "Ticket updated successfully",
        "ticket": dict(updated_ticket)
    }


# ===============================
# Serve Frontend
# ===============================

BASE_DIR = Path(__file__).resolve().parent.parent

FRONTEND_DIR = BASE_DIR / "frontend"

app.mount(
    "/",
    StaticFiles(
        directory=FRONTEND_DIR,
        html=True
    ),
    name="frontend"
)