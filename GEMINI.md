# GEMINI.md

## Project Overview

**cart** is a web-based platform designed for simulating and visualizing cart-related laboratory data, such as velocity over time. The project consists of a Flask-based backend and an interactive frontend that utilizes Chart.js for data visualization.

### Key Technologies
- **Backend:** Python 3.12 with Flask
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Chart.js 4.5.0
- **Icons:** Bootstrap Icons
- **Typography:** Lexend (Google Fonts)

---

## Directory Structure

- `server/`: The core Flask application.
  - `app.py`: Main entry point for the Flask server.
  - `templates/`: HTML templates for the application (`index.html`, `lab.html`).
  - `static/`: Static assets including CSS (`style.css`) and client-side logic (`lab.js`).
  - `.venv/`: Python virtual environment with pre-installed dependencies.
- `client/`: Intended for client-side scripts (currently contains an empty `main.py`).
- `dummy_client/`: Empty placeholder for potential dummy client implementations.
- `documentation/`: Empty placeholder for project documentation.

---

## Building and Running

### Prerequisites
- Python 3.12
- `pip` (standard with Python)

### Running the Server
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Activate the virtual environment:
   ```bash
   source .venv/bin/activate
   ```
3. Start the Flask application:
   ```bash
   python app.py
   ```
4. Access the application in your browser (typically at `http://127.0.0.1:5000`).

### Running the Client
- Currently, the `client/main.py` is empty and has no defined execution steps.

---

## Development Conventions

- **Backend Logic:** Follow Flask best practices. Note: `server/app.py` currently uses an incorrect import `from flask import ..., requests` which should be corrected to `request` for standard Flask usage.
- **Frontend Visualization:** Data visualization is handled via Chart.js. Configurations are defined in `server/static/lab.js`.
- **Styling:** CSS is maintained in `server/static/style.css`. Prefer the established color palette (Charcoal Blue, Blue Slate, Seaweed, Bright Snow, Golden Orange).
- **Templates:** Use Jinja2 templating within the `server/templates/` directory.

---

## TODOs
- [ ] Implement `index.html` content.
- [ ] Fix the `requests` vs `request` import bug in `server/app.py`.
- [ ] Implement file upload logic in the `/lab` POST route.
- [ ] Populate `client/main.py` with relevant client-side scripts.
