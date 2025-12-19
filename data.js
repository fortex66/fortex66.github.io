/**
 * 모든 콘텐츠는 이 객체만 수정하면 됩니다.
 * 필요한 경우 항목을 추가/삭제하거나 텍스트를 바꾸세요.
 */
window.siteContent = {
    navigation: {
        logo: "Eonsang Son",
        logoAccent: "_",
        links: [
            { label: "Projects", href: "#projects" },
            { label: "About", href: "#about" },
            { label: "Tech", href: "#Tech" },
            { label: "Awards", href: "#awards" },
            { label: "Blog", href: "https://fortex66.tistory.com/", external: true },
            { iconClass: "fab fa-github", href: "https://github.com/fortex66", external: true, noUnderline: true }
        ]
    },
    hero: {
        intro: {
            text: "Hi I'm",
            link: { label: "Eonsang Son", href: "https://github.com/fortex66" }
        },
        subtitle: "Connecting industrial systems to real-time monitoring and control",
        achievements: [
            { suffix: "Industrial Systems" },
            { suffix: "PLC & Device Integration" },
            { suffix: "Real-time Monitoring & Control" },
            { suffix: "Energy & Sensor-based Systems" }
        ]

    },
    projects: [
        {
            title: "웹 기반 수처리 설비 원격 모니터링·제어 시스템",
            description: "Real-time Weather Monitoring System",
            url: "https://fortex66.tistory.com/17",
            backgroundImage: "./imgs/amos.gif",
            backgroundColor: "#0b2a3e",
            featured: true
        },
        {
            title: "PLC 연동 산업용 HMI 컨트롤러 개발",
            description: "Singer IU Song Serving Page",
            url: "https://github.com/wnghdcjfe/IUtoon",
            backgroundImage: "./imgs/iu.gif",
            backgroundColor: "#ed1a44"
        },
        {
            title: "Electric Vehicle Battery Management System",
            description: "University community web site",
            url: "https://fortex66.tistory.com/15",
            backgroundImage: "./imgs/knue.gif",
            backgroundColor: "#000000"
        },
        {
            title: "JourneyMate",
            description: "A system that quickly finds answers to Codeforce.",
            url: "https://fortex66.tistory.com/12",
            backgroundImage: "./imgs/lucid.png",
            backgroundColor: "#42b983",
            extraClasses: ["project--mobile-auto-image"]
        },
        {
            title: "SmartFarm",
            description: "Javascript Test Framework",
            url: "https://fortex66.tistory.com/11",
            backgroundImage: "./imgs/mocha.png",
            backgroundColor: "#a67d5d",
            extraClasses: ["project--mobile-auto-image"]
        },

    ],
    about: {
        title: "About",
        paragraphs: [
            "I started programming by building project-based systems that connect software with real-world environments. My work has focused on industrial automation, including PLC-based HMI development, remote monitoring systems, and sensor-driven platforms such as energy and battery management systems.",
            "Through these projects, I have improved system reliability and operational efficiency with measurable results. I reduced PLC reconnection time from up to 7 minutes to under 1 minute (about 86% improvement) by redesigning communication logic, and replaced manual USB-based data collection with a real-time monitoring system, eliminating over 90% of on-site data retrieval work."
        ]
    },
    tech: {
        title: "Tech",
        categories: [
            {
                label: "Strong",
                items: "JS(ES5+) / React.js / Node.js / Express.js / C++ / C# / MySQL"
            },
            {
                label: "Knowledgeable",
                items: "Java / Spring / PHP / Python / TensorFlow / DL(LSTM, CNN) / Matplotlib / Numpy / Pandas / Beautiful Soup 4"
            },
            {
                label: "ETC",
                items: "Git / PLC / RPI / Docker / TOEIC Speaking-IH(23.09.13)"
            }
        ]
    },
    awards: {
        title: "Awards",
        items: [
        {
            label: "Korea Information Industry Association Award",
            detail: "Dec 2023 / ICT Mentoring Program",
            suffix: " – Developed a React-based collaboration platform with real-time chat, infinite scrolling, and dynamic input features."
        }
    ]
    }
};

