export declare enum UseType {
    MONOREPO = "monorepo",
    DEFAULT = "default"
}
export declare enum PlatformType {
    PC = "pc",
    H5 = "h5"
}
export declare enum WayType {
    Library = "library",
    Project = "project"
}
export interface PromptsType {
    use: UseType;
    platform: PlatformType;
    way?: WayType;
}
export declare const prompts: ({
    type: string;
    name: string;
    message: string;
    choices: {
        name: string;
        value: UseType;
    }[];
} | {
    type: string;
    name: string;
    message: string;
    choices: {
        name: string;
        value: WayType;
    }[];
    when(answers: PromptsType): boolean;
} | {
    type: string;
    name: string;
    message: string;
    choices: {
        name: string;
        value: PlatformType;
    }[];
})[];
