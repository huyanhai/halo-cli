export enum UseType {
  MONOREPO = "monorepo",
  DEFAULT = "default",
}

export enum PlatformType {
  PC = "pc",
  H5 = "h5",
}

export enum WayType {
  Library = "library",
  Project = "project",
}

export interface PromptsType {
  use: UseType;
  platform: PlatformType;
  way?: WayType;
}

export const prompts = [
  {
    type: "list",
    name: "use",
    message: "Select Use:",
    choices: [
      { name: "Monorepo - 单仓库多项目", value: UseType.MONOREPO },
      { name: "Default - 单仓库单项目", value: UseType.DEFAULT },
    ],
  },
  {
    type: "list",
    name: "way",
    message: "Select Use:",
    choices: [
      { name: "Library - 库", value: WayType.Library },
      { name: "Project - 项目", value: WayType.Project },
    ],
    when(answers: PromptsType) {
      return answers.use === UseType.MONOREPO;
    },
  },
  {
    type: "list",
    name: "platform",
    message: "Select Platform:",
    choices: [
      { name: "Desktop - 电脑端", value: PlatformType.PC },
      { name: "Mobile - 手机端", value: PlatformType.H5 },
    ],
  },
];
