// Public portfolio content. Keep work descriptions abstract and source-backed.
window.portfolioProjects = [
  {
    "id": "plc-ai",
    "title": "PLC AI Studio",
    "category": "ai",
    "label": "AI-ASSISTED ENGINEERING",
    "summary": "An AI workspace for understanding PLC programs and reviewing changes.",
    "role": "PLC program modeling · AI/rule separation · Validation workflow design",
    "stack": [
      "Python",
      "PLC",
      "XML",
      "Local LLM"
    ],
    "flow": [
      "PLC program",
      "Structured context",
      "AI + rules",
      "Human review"
    ],
    "details": "Structures program hierarchies and signal dependencies, combining AI interpretation with deterministic rules. In development, with a focus on change impact and human review.",
    "status": "In development · Private repository",
    "featured": true
  },
  {
    "id": "water",
    "title": "Water Treatment SCADA",
    "category": "industrial",
    "label": "CONNECTED INDUSTRIAL SYSTEMS",
    "summary": "Real-time monitoring and control, from industrial equipment to the web.",
    "role": "Project lead · System architecture · Full-stack development",
    "stack": [
      "React",
      "Node.js",
      "MySQL",
      "Modbus TCP"
    ],
    "flow": [
      "PLC / sensors",
      "Modbus TCP",
      "Node.js + MySQL",
      "Web dashboard"
    ],
    "details": "Connects PLC data to a web dashboard with operating status, alarms, historical records, and CSV export. Built jointly with seonghyeon0312.",
    "links": [
      {
        "label": "Repository",
        "url": "https://github.com/fortex66/Water-Treatement-SCADA"
      },
      {
        "label": "Project story",
        "url": "https://fortex66.tistory.com/17"
      },
      {
        "label": "Co-creator",
        "url": "https://github.com/seonghyeon0312"
      }
    ],
    "demo": "./imgs/water.gif",
    "featured": true
  },
  {
    "id": "local-llm",
    "title": "Local LLM × LabVIEW",
    "category": "ai",
    "label": "LOCAL AI / TOOL INTEGRATION",
    "summary": "Natural-language tool calls for existing LabVIEW control systems.",
    "role": "AI integration design · LabVIEW system integration",
    "stack": [
      "Python",
      "LabVIEW",
      "HTTP / JSON",
      "Tool calling"
    ],
    "flow": [
      "Natural language",
      "Local LLM",
      "Validated tool call",
      "LabVIEW"
    ],
    "details": "A local LLM converts requests into tool calls. Schema and allowed-value checks validate each request before it reaches the LabVIEW environment.",
    "links": [
      {
        "label": "Repository",
        "url": "https://github.com/fortex66/local-llm-field-monitoring-agent"
      }
    ]
  },
  {
    "id": "process",
    "title": "Manufacturing Process Optimization",
    "category": "industrial",
    "label": "PROCESS / CLOSED-LOOP CONTROL",
    "summary": "Feedback-driven control for more consistent manufacturing processes.",
    "role": "Control concept design · Industrial communication · Logic development and validation",
    "stack": [
      "PLC",
      "Industrial communication",
      "Feedback control"
    ],
    "flow": [
      "Process",
      "Measurement",
      "Control logic",
      "Next cycle"
    ],
    "details": "Developed feedback control and validation workflows around process data and engineering constraints, improving process repeatability and quality.",
    "status": "Industrial project · Public overview"
  },
  {
    "id": "vision",
    "title": "Vision & Robot Alignment",
    "category": "industrial",
    "label": "VISION / ROBOTICS / MES",
    "summary": "Connecting vision, robotics, and production data.",
    "role": "Equipment integration · Process improvement · Production data connectivity",
    "stack": [
      "Vision",
      "Robotics",
      "PLC",
      "MES"
    ],
    "flow": [
      "Vision",
      "Robot",
      "Process",
      "Production data"
    ],
    "details": "Reviewed equipment workflows and data flows together, improving integration between vision and robotics equipment and production systems.",
    "status": "Industrial project · Public overview"
  },
  {
    "id": "g90",
    "title": "G90 · GV90 Programs",
    "category": "industrial",
    "label": "AUTOMOTIVE / PROCESS ENGINEERING",
    "summary": "Participation in G90 and GV90 production programs.",
    "role": "Equipment setup and commissioning · Process review · Production handover",
    "stack": [
      "Robotics",
      "PLC",
      "Process engineering"
    ],
    "flow": [
      "Setup",
      "Validation",
      "Process conditions",
      "Production"
    ],
    "details": "Supported new-vehicle programs through equipment setup, process-condition review and validation, and production implementation.",
    "status": "Industrial project · Public overview"
  },
  {
    "id": "embedded",
    "title": "Industrial Embedded Controllers",
    "category": "industrial",
    "label": "EMBEDDED / C++ / QT",
    "summary": "Control software and HMI for industrial embedded systems.",
    "role": "Linux development and deployment · C++ / QML development",
    "stack": [
      "C++",
      "Qt / QML",
      "Linux",
      "ARM"
    ],
    "flow": [
      "PLC",
      "Communication",
      "C++ control",
      "Qt HMI"
    ],
    "details": "Developed Qt HMIs and C++ control software for industrial processes, covering communication handling and deployment in the field.",
    "links": [
      {
        "label": "Tech blog",
        "url": "https://fortex66.tistory.com/"
      }
    ],
    "demo": "./imgs/fortex_dif.gif"
  },
  {
    "id": "viewer",
    "title": "ForTex-Viewer",
    "category": "software",
    "label": "PLC / WEB / VISUALIZATION",
    "summary": "PLC data, made visible through connected monitoring software.",
    "role": "Software development · Equipment data integration",
    "stack": [
      "PLC",
      "Web",
      "Data visualization"
    ],
    "flow": [
      "PLC",
      "Data connection",
      "Visualization"
    ],
    "details": "A monitoring project that collects equipment data and presents it through a visual interface.",
    "links": [
      {
        "label": "Repository",
        "url": "https://github.com/fortex66/ForTex-Viewer"
      }
    ]
  },
  {
    "id": "battery",
    "title": "EV Battery Management",
    "category": "industrial",
    "label": "ENERGY / SENSORS / CONTROL",
    "summary": "Battery thermal management and charge/discharge control.",
    "role": "Sensor integration · Monitoring and control development",
    "stack": [
      "Sensors",
      "Battery control",
      "Monitoring"
    ],
    "flow": [
      "Sensors",
      "Temperature data",
      "Control",
      "Battery"
    ],
    "details": "A graduation project focused on temperature management and charge/discharge control for lithium-ion EV batteries.",
    "links": [
      {
        "label": "Repository",
        "url": "https://github.com/fortex66/Lithium-Ion-Battery-Management-System"
      },
      {
        "label": "Project story",
        "url": "https://fortex66.tistory.com/15"
      }
    ],
    "demo": "./imgs/battery.gif"
  },
  {
    "id": "journey",
    "title": "JourneyMate",
    "category": "software",
    "label": "WEB / REAL-TIME COLLABORATION",
    "summary": "Travel information and real-time collaboration in one workspace.",
    "role": "React web application development",
    "stack": [
      "React",
      "Real-time chat",
      "Web"
    ],
    "flow": [
      "Travel information",
      "Shared workspace",
      "Real-time chat"
    ],
    "details": "A platform combining travel discovery with real-time collaboration. Received the Korea Information Industry Association Award in the ICT Mentoring Program.",
    "links": [
      {
        "label": "Repository",
        "url": "https://github.com/fortex66/JourneyMate"
      },
      {
        "label": "Project story",
        "url": "https://fortex66.tistory.com/12"
      }
    ],
    "demo": "./imgs/ict.gif"
  },
  {
    "id": "smartfarm",
    "title": "SmartFarm",
    "category": "software",
    "label": "WEB / TRADING PLATFORM",
    "summary": "A trading platform for the smart-farm domain.",
    "role": "Web platform development",
    "stack": [
      "PHP",
      "MySQL",
      "Web"
    ],
    "flow": [
      "Products",
      "Trading platform",
      "Users"
    ],
    "details": "A web platform built to support trading in the smart-farm domain.",
    "links": [
      {
        "label": "Repository",
        "url": "https://github.com/fortex66/SmartFarm"
      },
      {
        "label": "Project story",
        "url": "https://fortex66.tistory.com/11"
      }
    ],
    "demo": "./imgs/smart_farm.gif"
  }
];
