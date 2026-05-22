# README Auto Generator

![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![GitHub Repo stars](https://img.shields.io/github/stars/affan-farooq90/Readme-Gen?style=social)
![GitHub forks](https://img.shields.io/github/forks/affan-farooq90/Readme-Gen?style=social)

The **README Auto Generator** is an AI-powered tool designed to streamline the creation of professional and comprehensive `README.md` files for your projects. Leveraging the power of Google's Generative AI, this backend service can generate detailed project documentation based on various input types, saving developers significant time and effort.

Whether you're starting a new project or updating an existing one, this generator helps ensure your documentation is always up-to-date, well-structured, and informative, making your projects more accessible and understandable to collaborators and users alike.

## ✨ Features

*   **AI-Powered Generation:** Utilizes Google's Generative AI to understand project context and generate relevant, high-quality README content.
*   **Multiple Input Types:** Designed to support various forms of input, allowing for flexible project description and requirements. *(Specific input methods can be extended, e.g., direct text, JSON structure, project metadata).*
*   **Comprehensive Sections:** Automatically includes essential README sections like Description, Features, Installation, Usage, Technologies, Contributing, and License.
*   **Markdown Formatting:** Outputs perfectly formatted Markdown, ready to be dropped directly into your repository.
*   **Fast & Efficient:** Quickly generates documentation, accelerating your development workflow.
*   **API-First Design:** Built with Express.js, offering a robust and scalable API for integration into other applications or frontends.

## 🚀 Technologies

*   **Node.js**: The JavaScript runtime environment.
*   **Express.js**: A minimalist web framework for building the API.
*   **Google Generative AI SDK (`@google/generative-ai`)**: Powers the AI content generation.
*   **CORS**: Middleware for enabling Cross-Origin Resource Sharing.
*   **Dotenv**: For loading environment variables from a `.env` file.
*   **Nodemon**: A utility that monitors for changes in your source and automatically restarts your server (for development).

## 🛠️ Installation

Follow these steps to get the README Auto Generator up and running on your local machine.

### Prerequisites

*   Node.js (version 18 or higher)
*   npm (Node Package Manager, usually comes with Node.js)

### Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/affan-farooq90/Readme-Gen.git
    cd Readme-Gen
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory of the project. This file will store your Google Generative AI API key and other sensitive configurations.

    ```env
    # .env
    GOOGLE_GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
    PORT=3000
    ```
    *   Replace `"YOUR_GOOGLE_GEMINI_API_KEY"` with your actual API key obtained from the Google AI Studio or Google Cloud Console.
    *   You can set a different `PORT` if `3000` is already in use.

## 🏃 Usage

### Running the Development Server

To run the server with `nodemon` (which provides automatic restarts on file changes):

```bash
npm run dev
```
The server will start on the port specified in your `.env` file (default: `http://localhost:3000`).

### Running the Production Server

To run the server in production mode:

```bash
npm start
```
The server will start on the port specified in your `.env` file (default: `http://localhost:3000`).

### Using the API

The generator exposes an API endpoint to generate READMEs. You will typically send a `POST` request to this endpoint with your project details in the request body.

#### Example API Request (using `curl`)

Assume the server is running on `http://localhost:3000`.

```bash
curl -X POST \
  http://localhost:3000/api/generate-readme \
  -H 'Content-Type: application/json' \
  -d '{
    "projectName": "My Awesome Project",
    "projectDescription": "A cutting-edge web application built with React and Node.js for managing tasks efficiently.",
    "features": [
      "User authentication",
      "Task creation and management",
      "Real-time updates",
      "Responsive design"
    ],
    "technologies": [
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "Socket.IO"
    ]
  }'
```

#### Expected Request Body Structure

The API expects a JSON object with the following potential fields (you can customize and expand upon these based on your specific implementation):

| Field             | Type     | Description                                                         | Required |
| :---------------- | :------- | :------------------------------------------------------------------ | :------- |
| `projectName`     | `string` | The name of your project.                                           | Yes      |
| `projectDescription` | `string` | A brief, compelling description of what your project does.          | Yes      |
| `features`        | `array`  | A list of key features your project offers.                         | No       |
| `technologies`    | `array`  | A list of core technologies used in your project.                   | No       |
| `installationSteps` | `array`  | Custom steps for installation.                                      | No       |
| `usageExamples`   | `array`  | Examples or commands for how to use the project.                    | No       |
| `license`         | `string` | The license type (e.g., "MIT", "Apache 2.0").                       | No       |
| `author`          | `string` | The author's name or organization.                                  | No       |
| `githubRepoUrl`   | `string` | (Optional) GitHub repository URL for more context or badges.        | No       |

#### Example API Response

The API will return a JSON object containing the generated README content as a Markdown string:

```json
{
  "success": true,
  "readmeContent": "# My Awesome Project\n\nA cutting-edge web application built with React and Node.js for managing tasks efficiently.\n\n## ✨ Features\n\n- User authentication\n- Task creation and management\n- Real-time updates\n- Responsive design\n\n## 🚀 Technologies\n\n- React\n- Node.js\n- Express.js\n- MongoDB\n- Socket.IO\n\n... and so on in full Markdown format"
}
```

You can then save this `readmeContent` to a file named `README.md` in your project's root directory.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

Don't forget to give the project a star! ⭐

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Made with ❤️ by [Your Name](https://github.com/affan-farooq90)
*(Remember to replace "Your Name" with your actual name/GitHub profile link)*
