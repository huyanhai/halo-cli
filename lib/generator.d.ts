interface Answers {
    use: string;
    platform: string;
}
export declare class Generator {
    name: string;
    url: string;
    answers: Answers;
    constructor(name: string);
    init(): Promise<void>;
    checkProjectName(): void;
    ask(): Promise<void>;
    checkTargetDir(): Promise<void>;
    downloadFn(): void;
    editFilesInfo(): Promise<void>;
    installDependence(): void;
}
export {};
