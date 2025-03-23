# AI Image Generator (Text-to-Image Generator)

The **AI Image Generator** is a web-based application that allows users to create images from text prompts using advanced AI technology. Users can input a prompt, select different image styles, and generate high-quality images in real time.

## Features

- **Text-to-Image Generation:** Input a prompt and generate images using AI.
- **Customizable Styles:** Choose from various styles like anime, realistic, and 3D.
- **Image Download:** Download generated images with a single click.
- **User Authentication:** Secure user login and signup system using Node.js and MongoDB.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **AI Integration:** AI API (e.g., OpenAI's DALL·E or similar)

## Project Structure

```
├── backend
│   ├── server.js
│   ├── models
│   │    └── User.js
│   ├── routes
│   │    └── authRoutes.js
│   └── package.json
├── frontend
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── README.md
```

## Setup Instructions

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-repo/ai-image-generator.git
    cd ai-image-generator
    ```

2. **Backend Setup:**

    ```bash
    cd backend
    npm install
    ```

    Create a `.env` file and add the following:

    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    AI_API_KEY=your_ai_api_key
    ```

    Start the backend server:

    ```bash
    node server.js
    ```

3. **Frontend Setup:**

    Open `frontend/index.html` in your browser.



