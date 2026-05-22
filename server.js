import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
  console.warn('GEMINI_API_KEY not set — server will run in demo mode');
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static('public'));

/**
 * POST /api/generate-readme
 * Generates a README based on the provided context
 */
app.post("/api/generate-readme", async (req, res) => {
  try {
    console.log('POST /api/generate-readme payload:', JSON.stringify(req.body));
    let { type, projectName, description, technologies, githubUrl, files } = req.body;

    // Auto-detect github type when a githubUrl is present
    if (!type && githubUrl) {
      type = 'github';
    }

    // Allow github type to omit projectName/description by extracting from URL
    if (type === 'github') {
      if (!githubUrl) {
        return res.status(400).json({ error: 'githubUrl is required for type=github' });
      }

      const match = githubUrl.replace(/\.git$/, '').match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        const [, owner, repo] = match;
        projectName = projectName || repo;
        description = description || `Repository ${owner}/${repo}`;
      } else {
        // if URL doesn't match expected format, still proceed but ensure githubUrl provided
        projectName = projectName || 'Repository';
        description = description || `Repository at ${githubUrl}`;
      }
    } else if (type === 'files' || type === 'description' || !type) {
      // For files or description types, projectName and description are required
      if (!projectName || !description) {
        return res.status(400).json({
          error: 'Missing required fields: projectName and description',
        });
      }
    }

    let systemPrompt = `You are a professional README generator. Create comprehensive, well-structured README files in markdown format. 

Guidelines:
- Use clear, professional language
- Include all essential sections: Description, Features, Installation, Usage, Technologies, Contributing, License
- Add practical examples and code snippets where relevant
- Use proper markdown formatting with headers, code blocks, lists
- Make it engaging and easy to follow
- Tailor the content to match the project's purpose`;

    let userPrompt = "";

    if (type === "description") {
      userPrompt = `Generate a professional README.md for a project with these details:

Project Name: ${projectName}
Description: ${description}
Technologies: ${technologies || "Not specified"}

Create a comprehensive README with all standard sections.`;
    } else if (type === "github") {
      let repoData = '';
      try {
        const match = githubUrl.replace(/\.git$/, '').match(/github\.com\/([^/]+)\/([^/]+)/);
        if (match) {
          const [, owner, repo] = match;
          
          // Fetch repo metadata
          const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
          if (repoResp.ok) {
            const repoJson = await repoResp.json();
            repoData += `Repository description: ${repoJson.description || 'None'}\n`;
            repoData += `Language: ${repoJson.language || 'Unknown'}\n`;
            repoData += `Topics: ${(repoJson.topics || []).join(', ')}\n\n`;
          }
          
          // Fetch package.json if it exists (for Node.js projects)
          const pkgResp = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`);
          if (pkgResp.ok) {
            repoData += `--- package.json ---\n${(await pkgResp.text()).substring(0, 3000)}\n\n`;
          } else {
             const pkgRespMaster = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/package.json`);
             if (pkgRespMaster.ok) {
                repoData += `--- package.json ---\n${(await pkgRespMaster.text()).substring(0, 3000)}\n\n`;
             }
          }
        }
      } catch (e) {
        console.error("Error fetching repo details for prompt:", e);
      }

      userPrompt = `Analyze this GitHub repository and generate a professional README.md: ${githubUrl}

Project Name: ${projectName}
Additional Description: ${description}

Repository Data Context:
${repoData || "Could not fetch specific files, but try to generate based on the name and description."}

Create a comprehensive README that explains the project well based on the data provided above.`;
    } else if (type === "files") {
      const filesList = files
        ?.map(
          (f) => `
--- ${f.name} ---
${f.content.substring(0, 3000)}
`
        )
        .join("\n");

      userPrompt = `Based on these project files, generate a professional README.md:

Project Name: ${projectName}
Description: ${description}

Files provided:
${filesList || "No files provided"}

Create a comprehensive README based on the actual project structure and code.`;
    }

    // Call Gemini API
    let readme = '';
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt 
        });
        const result = await model.generateContent(userPrompt);
        readme = result.response.text();
      } catch (apiError) {
        console.error('Gemini API error:', apiError);
        return res.status(500).json({ error: "Failed to generate README via AI", details: apiError.message });
      }
    }

    // Fallback to a server-side demo README when API key or response is unavailable
    if (!readme) {
      readme = generateDemoReadme(projectName, description, technologies);
    }

    res.json({
      success: true,
      readme: readme,
      metadata: {
        projectName,
        description,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error generating README:", error && error.stack ? error.stack : error);
    res.status(500).json({
      error: "Failed to generate README",
      details: error && error.message ? error.message : String(error),
    });
  }
});

function generateDemoReadme(projectName = 'MyProject', description = '', technologies = '') {
  const name = projectName || 'MyProject';
  return `# ${name}\n\n${description || 'A modern, powerful solution designed to streamline your workflow.'}\n\n## Features\n\n- ⚡ **Lightning Fast** - Optimized performance for seamless user experience\n- 🎨 **Beautiful UI** - Clean and intuitive interface\n- 🔧 **Easy to Configure** - Simple setup process\n\n## Installation\n\n\`\`\`bash\n# Clone the repository\ngit clone https://github.com/username/${name.toLowerCase()}.git\ncd ${name.toLowerCase()}\n\n# Install dependencies\nnpm install\n\n# Start the project\nnpm start\n\`\`\`\n\n## Usage\n\nProvide usage examples here.\n\n## Technologies\n\n${technologies || '- Not specified'}\n\n## License\n\nMIT\n`;
}

/**
 * POST /api/enhance-readme
 * Enhances an existing README with specific improvements
 */
app.post("/api/enhance-readme", async (req, res) => {
  try {
    const { currentReadme, improvementType } = req.body;

    if (!currentReadme) {
      return res.status(400).json({ error: "currentReadme is required" });
    }

    const improvementPrompts = {
      examples: "Add more practical code examples and usage scenarios",
      installation: "Expand the installation section with platform-specific instructions",
      features: "Enhance the features section with more detailed descriptions",
      badges: "Add relevant badges (build status, coverage, version, license, etc.)",
      screenshots: "Add sections for screenshots and visual demonstrations",
    };

    const improvement = improvementPrompts[improvementType] || "Enhance this README";

    let enhancedReadme = '';
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(`Please improve the following README by: ${improvement}\n\nCurrent README:\n${currentReadme}\n\nProvide the enhanced README in markdown format.`);
        enhancedReadme = result.response.text();
      } catch (apiError) {
        console.error('Gemini API error:', apiError);
        return res.status(500).json({ error: "Failed to enhance README via AI", details: apiError.message });
      }
    } else {
      // No Gemini client available — return the original README as a noop fallback
      enhancedReadme = currentReadme;
    }

    res.json({
      success: true,
      readme: enhancedReadme,
      improvement: improvementType,
    });
  } catch (error) {
    console.error("Error enhancing README:", error);
    res.status(500).json({
      error: "Failed to enhance README",
      details: error.message,
    });
  }
});

/**
 * POST /api/parse-github
 * Fetches repository information from GitHub
 */
app.post("/api/parse-github", async (req, res) => {
  try {
    const { githubUrl } = req.body;

    if (!githubUrl || !githubUrl.includes("github.com")) {
      return res.status(400).json({ error: "Invalid GitHub URL" });
    }

    // Extract owner and repo from URL
    const match = githubUrl.replace(/\.git$/, '').match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ error: "Invalid GitHub URL format" });
    }

    const [, owner, repo] = match;

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }
      const data = await response.json();
      
      res.json({
        success: true,
        repository: {
          owner,
          name: repo,
          url: githubUrl,
          description: data.description || "No description provided",
          topics: data.topics || [],
          language: data.language || "Unknown",
          stars: data.stargazers_count || 0,
        },
      });
    } catch (fetchError) {
      console.error("Error fetching from GitHub API:", fetchError);
      return res.status(500).json({ error: "Failed to fetch repository details from GitHub" });
    }
  } catch (error) {
    console.error("Error parsing GitHub URL:", error);
    res.status(500).json({
      error: "Failed to parse GitHub repository",
      details: error.message,
    });
  }
});

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`README Generator API running on http://localhost:${PORT}`);
  console.log("Available endpoints:");
  console.log("  POST /api/generate-readme - Generate a new README");
  console.log("  POST /api/enhance-readme - Enhance an existing README");
  console.log("  POST /api/parse-github - Parse GitHub repository info");
  console.log("  GET /api/health - Health check");
});

// Serve the frontend HTML at the site root
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'readme-generator.html'));
});
