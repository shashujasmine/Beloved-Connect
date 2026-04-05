# Beloved Connect 

Beloved Connect is a beautiful, interactive web application designed to help you store your most precious memories and stay connected with your loved ones. Whether it's a special note, a cherished song, or a shared memory, Beloved Connect provides a premium platform to keep those connections alive.

##  Features

- **Memory Management**: Create and manage personal memories with a cinematic interactive interface.
- **Quick Reach**: Access your most important memories instantly through a sleek dashboard.
- **Beloved Ones**: Add and manage profiles for your closest friends and family.
- **Invitations**: Send invitations to loved ones, allowing them to accept or reject connections.
- **Premium Design**: Modern, responsive UI with smooth transitions and a focus on visual excellence.

## Technology Stack

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

## Project Structure

```text
Beloved-Connect/
├── frontend/          # React application
│   ├── src/           # Source code
│   └── public/        # Static assets
├── backend/           # FastAPI application
└── README.md          # Project documentation


##  Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Built with ❤️ for those we love.
