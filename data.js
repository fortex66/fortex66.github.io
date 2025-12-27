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
      {
        iconClass: "fab fa-github",
        href: "https://github.com/fortex66",
        external: true,
        noUnderline: true,
      },
    ],
  },
  hero: {
    intro: {
      text: "Hi I'm",
      link: { label: "Eonsang Son", href: "https://github.com/fortex66" },
    },
    subtitle:
      "Engineers who harmonize industrial systems through software and transform field data into value",
    achievements: [
      { suffix: "Industrial Systems" },
      { suffix: "Device Integration" },
      { suffix: "Real-time Monitoring & Control" },
      { suffix: "Energy & Sensor-based Systems" },
    ],
  },
  projects: [
    {
      title: "Real-time Water Treatment SCADA System",
      description: "웹 기반 수처리 설비 원격 모니터링·제어 시스템",
      url: "https://fortex66.tistory.com/17",
      backgroundImage: "./imgs/water.gif",
      backgroundColor: "#0b2a3e",
      featured: true,
    },
    {
      title: "ForTex-DIF",
      description: "섬유 공정 전용 임베디드 제어 제품 개발",
      url: "https://fortex66.tistory.com/",
      backgroundImage: "./imgs/fortex_dif.gif",
      backgroundColor: "#290c3dff",
    },
    {
      title: "EV Battery Management System",
      description: "전기차 리튬이온 배터리 온도 관리 및 충·방전 제어 시스템",
      url: "https://fortex66.tistory.com/15",
      backgroundImage: "./imgs/battery.gif",
      backgroundColor: "#431313ff",
    },
    {
      title: "JourneyMate",
      description: "실시간 채팅 기반 여행 정보 통합 플랫폼",
      url: "https://fortex66.tistory.com/12",
      backgroundImage: "./imgs/ict.gif",
      backgroundColor: "#e8cf7dff",
    },
    {
      title: "SmartFarm",
      description: "스마트팜 거래 플랫폼",
      url: "https://fortex66.tistory.com/11",
      backgroundImage: "./imgs/smart_farm.gif",
      backgroundColor: "#013a12ff",
    },
  ],
  about: {
    title: "About",
    paragraphs: [
      "I'm an engineer interested in solving real-world problems through software. I've designed and implemented systems that connect, monitor, and control data generated from industrial facilities, energy systems, and sensor-based environments through software.",
      "During the project, I achieved tangible results through system architecture improvements and logic optimization. By redesigning the communication structure, I reduced equipment reconnection time from up to seven minutes to less than one minute (an approximately 86% improvement). I also transformed manual data collection into a real-time visualization and alarm-based system, enabling operation without on-site visits. Building on this experience, I'm currently focusing on leveraging data and AI models to enhance system efficiency and decision-making.",
    ],
  },
  tech: {
    title: "Tech",
    categories: [
      {
        label: "Strong",
        items: "C++ / JS / React.js / Node.js / Express.js / C# / MySQL",
      },
      {
        label: "Knowledgeable",
        items:
          "Java / Spring / PHP / R / Python / TensorFlow / ML Basics (Linear Regression, MLP) / Matplotlib / Numpy / Pandas / Beautiful Soup 4",
      },
      {
        label: "ETC",
        items: "Git / Linux / Docker / PLC(LS, Mitsubishi, Yaskawa) / Industrial 6-Axis Robot(Yaskawa) / Raspberry Pi",
      },
      {
        label: "Certifications",
        items:
          "Engineer Information Processing / SQLD / Computer Specialist in Spreadsheet & Database (Level-1) / TOEIC Speaking IH (2023.09.13)",
      },
    ],
  },
  awards: {
    title: "Awards",
    items: [
      {
        label: "Korea Information Industry Association Award",
        detail: "Dec 2023 / ICT Mentoring Program",
        suffix:
          "– Developed a React-based collaboration platform with real-time chat, infinite scrolling, and dynamic input features.",
      },
    ],
  },
};
