# Beloved Connect 

> **Recap and store the moments that matter.**

Beloved Connect is a beautiful, interactive web application designed to help you store your most precious memories and stay connected with your loved ones. Whether it's a shared memory, a special note, or a cherished moment, Beloved Connect provides a premium platform to keep those connections alive.

The email option is not working properly but the aim is to share the thoughts and notes . After storing the memories , the edit option is not workable and sending mail is not working properly . apart from that all the options are good.

##  The Core Mission

The main purpose of this project is to provide a dedicated space for **storing and recapping memories**. It allows you to invite your people, take notes about your shared experiences, and build a lasting digital archive of your beloved ones. The project's main core idea is to connect and share thoughts , memories and notes that we're storing . 

*Note: While the interface includes communication options, the heart of the project lies in memory preservation and relationship tracking. Call and video functions are currently placeholders, as the primary focus is on the "Invitations" and "Memory Storage" systems.*

##  Features

- **Memory Management**: Create and manage personal memories with a cinematic interactive interface.
- **Invitations & Connection**: Send messages and invitations to loved ones. Connections are active once the invited person accepts.
- **Notes & Profiles**: Take detailed notes about your beloved ones and your shared journeys.
- **Quick Reach**: Access your most important memories instantly through a sleek dashboard.
- **Premium Design**: Modern, responsive UI with smooth transitions and a focus on visual excellence.

##  Technology Stack

- **Frontend**: React.js with Vite, Vanilla CSS.
- **Backend**: Python with FastAPI.
- **API**: RESTful integration between frontend and backend.

##  Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Python](https://www.python.org/) (v3.9+)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/shashujasmine/Beloved-Connect.git
    cd Beloved-Connect
    ```

2.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3.  **Backend Setup**
    ```bash
    cd ../backend
    python -m venv .venv
    source .venv/bin/Scripts/activate # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```

##  Project Structure

```text
Beloved-Connect/
├── frontend/          # React application
│   ├── src/           # Source code
│   └── public/        # Static assets
├── backend/           # FastAPI application
└── README.md          # Project documentation
```

##  Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---
Built with people for those we love...

