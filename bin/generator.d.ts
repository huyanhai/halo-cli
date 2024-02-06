import { PromptsType } from "./inquirer";
export declare class Generator {
    name: string;
    url: string;
    answers: PromptsType;
    constructor(name: string);
    init(): Promise<void>;
    checkProjectName(): void;
    ask(): Promise<void>;
    checkTargetDir(): Promise<void>;
    downloadFn(): Promise<void>;
    writeFiles(): Promise<void>;
    moveFiles(): Promise<void>;
    editFilesInfo(): Promise<void>;
    editTsconfig(projectRoot: string): Promise<void>;
    installDependence(): void;
}
