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
      text: "소프트웨어를 통해 산업 시스템을 지능화하고, 현장의 데이터를 가치로 전환하는 엔지니어",
      link: { label: "손언상", href: "https://github.com/fortex66" },
    },
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
      description: "산업 환경을 위한 전용 임베디드 제어 인터페이스 제품 개발",
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
    title: "소개",
    paragraphs: [
      "저는 소프트웨어를 통해 실제 현장의 문제를 해결하는 데 관심을 가져온 엔지니어입니다. 산업 설비, 에너지 시스템, 센서 기반 환경에서 발생하는 데이터를 소프트웨어로 연결하고, 이를 모니터링·제어할 수 있는 시스템을 직접 설계하고 구현해왔습니다.",
      "프로젝트 과정에서는 시스템 구조 개선과 로직 최적화를 통해 가시적인 성과를 만들어냈습니다. 통신 구조를 재설계하여 장비 재연결 시간을 최대 7분에서 1분 이내로 단축했으며(약 86% 개선), 수동 데이터 수집 방식은 실시간 시각화·알람 기반 시스템으로 전환해 현장 방문 없이도 운영이 가능하도록 개선했습니다. 이러한 경험을 바탕으로, 현재는 데이터와 AI 모델을 활용해 시스템의 효율과 판단을 고도화하는 방향에 관심을 두고 있습니다.",
    ],
  },
  tech: {
    title: "기술 스택",
    categories: [
      {
        label: "주력 기술",
        items: "C++ / JS / React.js / Node.js / Express.js / C# / MySQL",
      },
      {
        label: "활용 가능",
        items:
          "Java / Spring / PHP / R / Python / TensorFlow / ML Basics (Linear Regression, MLP) / Matplotlib / Numpy / Pandas / Beautiful Soup 4",
      },
      {
        label: "기타",
        items: "Git / Linux / Docker / PLC(LS, Mitsubishi, Yaskawa) / Industrial 6-Axis Robot(Yaskawa) / Raspberry Pi",
      },
      {
        label: "자격증",
        items:
          "정보처리기사(Engineer Information Processing) / SQLD / 컴퓨터활용능력 1급(Computer Specialist in Spreadsheet & Database (Level-1)) / 토익 스피킹(TOEIC Speaking) IH (2023.09.13)",
      },
    ],
  },
  awards: {
    title: "수상 및 성과",
    items: [
      {
        label: "한국정보산업연합회장상(Korea Information Industry Association Award)",
        detail: "Dec 2023 / ICT Mentoring Program",
        suffix:
          " – React 기반 협업 플랫폼을 설계·구현하며 실시간 통신 및 대용량 UI 처리를 담당",
      },
    ],
  },
};
