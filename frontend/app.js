const API_URL = "";


// ===============================
// Load Tickets
// ===============================

async function loadTickets() {

    const search =
        document.getElementById("searchInput").value.trim();

    const status =
        document.getElementById("statusFilter").value;

    let url = `${API_URL}/api/tickets`;

    const params = new URLSearchParams();

    if (search) {
        params.append("search", search);
    }

    if (status) {
        params.append("status", status);
    }

    if (params.toString()) {
        url += `?${params.toString()}`;
    }


    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to load tickets");
        }

        const tickets = await response.json();

        displayTickets(tickets);

        updateDashboard(tickets);

    } catch (error) {

        console.error(error);

        document.getElementById("ticketList").innerHTML =
            "<p>Unable to load tickets.</p>";
    }
}



// ===============================
// Display Tickets
// ===============================

function displayTickets(tickets) {

    const ticketList =
        document.getElementById("ticketList");


    if (tickets.length === 0) {

        ticketList.innerHTML =
            "<p>No tickets found.</p>";

        return;
    }


    ticketList.innerHTML = tickets.map(ticket => `

        <div
            class="ticket"
            onclick="viewTicket('${ticket.ticket_id}')"
        >

            <div class="ticket-top">

                <span class="ticket-id">
                    ${ticket.ticket_id}
                </span>

                <span class="status">
                    ${ticket.status}
                </span>

            </div>


            <strong>
                ${ticket.subject}
            </strong>


            <p>
                Customer:
                ${ticket.customer_name}
            </p>


            <small>
                Created:
                ${ticket.created_at}
            </small>

        </div>

    `).join("");
}



// ===============================
// Dashboard Statistics
// ===============================

function updateDashboard(tickets) {

    document.getElementById("totalTickets").textContent =
        tickets.length;

    document.getElementById("openTickets").textContent =
        tickets.filter(ticket =>
            ticket.status === "Open"
        ).length;

    document.getElementById("progressTickets").textContent =
        tickets.filter(ticket =>
            ticket.status === "In Progress"
        ).length;

    document.getElementById("closedTickets").textContent =
        tickets.filter(ticket =>
            ticket.status === "Closed"
        ).length;
}



// ===============================
// Create Ticket
// ===============================

document
    .getElementById("ticketForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const customerName =
            document.getElementById("customerName").value;

        const customerEmail =
            document.getElementById("customerEmail").value;

        const subject =
            document.getElementById("subject").value;

        const description =
            document.getElementById("description").value;


        try {

            const response = await fetch(
                `${API_URL}/api/tickets`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        customer_name: customerName,
                        customer_email: customerEmail,
                        subject: subject,
                        description: description
                    })
                }
            );


            const result = await response.json();


            if (!response.ok) {

                throw new Error(
                    result.detail || "Failed to create ticket"
                );
            }


            document.getElementById(
                "createMessage"
            ).textContent =
                `Ticket ${result.ticket_id} created successfully!`;


            document
                .getElementById("ticketForm")
                .reset();


            loadTickets();


        } catch (error) {

            document.getElementById(
                "createMessage"
            ).textContent =
                error.message;
        }

    });



// ===============================
// View Ticket
// ===============================

async function viewTicket(ticketId) {

    try {

        const response = await fetch(
            `${API_URL}/api/tickets/${ticketId}`
        );

        if (!response.ok) {
            throw new Error("Ticket not found");
        }

        const ticket = await response.json();

        const detailsSection =
            document.getElementById("detailsSection");

        const ticketDetails =
            document.getElementById("ticketDetails");

        detailsSection.style.display = "block";


        // Internal notes HTML
        let notesHTML = "";

        if (ticket.notes && ticket.notes.length > 0) {

            notesHTML = ticket.notes.map(note => `

                <div class="note">

                    <strong>Internal Note</strong>

                    <p>
                        ${note.note_text}
                    </p>

                    <small>
                        ${note.created_at}
                    </small>

                </div>

            `).join("");

        } else {

            notesHTML = `
                <p>No internal notes yet.</p>
            `;
        }


        ticketDetails.innerHTML = `

            <p>
                <strong>Ticket ID:</strong>
                ${ticket.ticket_id}
            </p>

            <p>
                <strong>Customer:</strong>
                ${ticket.customer_name}
            </p>

            <p>
                <strong>Email:</strong>
                ${ticket.customer_email}
            </p>

            <p>
                <strong>Subject:</strong>
                ${ticket.subject}
            </p>

            <p>
                <strong>Description:</strong>
                ${ticket.description}
            </p>

            <p>
                <strong>Status:</strong>
                ${ticket.status}
            </p>

            <p>
                <strong>Created:</strong>
                ${ticket.created_at}
            </p>

            <p>
                <strong>Updated:</strong>
                ${ticket.updated_at}
            </p>


            <hr>


            <h3>Internal Notes</h3>

            <div class="notes-container">

                ${notesHTML}

            </div>


            <hr>


            <h3>Update Ticket</h3>


            <select id="updateStatus">

                <option value="Open"
                    ${ticket.status === "Open" ? "selected" : ""}>
                    Open
                </option>

                <option value="In Progress"
                    ${ticket.status === "In Progress" ? "selected" : ""}>
                    In Progress
                </option>

                <option value="Closed"
                    ${ticket.status === "Closed" ? "selected" : ""}>
                    Closed
                </option>

            </select>


            <textarea
                id="ticketNote"
                rows="4"
                placeholder="Add internal note..."
            ></textarea>


            <button
                onclick="updateTicket('${ticket.ticket_id}')"
            >
                Update Ticket
            </button>

        `;


        detailsSection.scrollIntoView({
            behavior: "smooth"
        });


    } catch (error) {

        alert(error.message);

    }
}

// ===============================
// Update Ticket
// ===============================

async function updateTicket(ticketId) {

    const status =
        document.getElementById("updateStatus").value;

    const notes =
        document.getElementById("ticketNote").value;


    try {

        const response = await fetch(
            `${API_URL}/api/tickets/${ticketId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: status,
                    notes: notes
                })
            }
        );


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail || "Update failed"
            );
        }


        alert("Ticket updated successfully!");


        viewTicket(ticketId);

        loadTickets();


    } catch (error) {

        alert(error.message);

    }
}



// ===============================
// Initial Load
// ===============================

loadTickets();